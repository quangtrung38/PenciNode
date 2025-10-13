/**
 * Matrix Transform Utilities for Canvas Editor
 * Port from jQuery/numeric.js to TypeScript/mathjs
 */

import { lusolve, matrix, multiply } from 'mathjs';

export interface Point {
  x: number;
  y: number;
}

export interface Matrix3D {
  matrix: number[][];
}

/**
 * Calculate perspective transform matrix from source to target points
 * Based on homography transformation using 4 point correspondences
 * 
 * @param from - Array of 4 source points (original positions)
 * @param to - Array of 4 target points (transformed positions)
 * @returns 4x4 transformation matrix for CSS matrix3d
 */
export function getTransform(from: Point[], to: Point[]): number[][] {
  // Validate input
  if (from.length !== 4 || to.length !== 4) {
    throw new Error('Both from and to arrays must contain exactly 4 points');
  }

  // Validate that all points are defined
  for (let i = 0; i < 4; i++) {
    if (!from[i] || !to[i]) {
      throw new Error(`Missing point at index ${i}`);
    }
    if (typeof from[i]!.x !== 'number' || typeof from[i]!.y !== 'number' || 
        typeof to[i]!.x !== 'number' || typeof to[i]!.y !== 'number') {
      throw new Error(`Invalid point coordinates at index ${i}`);
    }
  }

  // Build the coefficient matrix A for the linear system
  // Each point correspondence gives us 2 equations (x and y)
  const A: number[][] = [];
  
  for (let i = 0; i < 4; i++) {
    const fromPoint = from[i]!;
    const toPoint = to[i]!;
    
    // Equation for x coordinate
    A.push([
      fromPoint.x, fromPoint.y, 1, 0, 0, 0,
      -fromPoint.x * toPoint.x, -fromPoint.y * toPoint.x,
    ]);
    
    // Equation for y coordinate
    A.push([
      0, 0, 0, fromPoint.x, fromPoint.y, 1,
      -fromPoint.x * toPoint.y, -fromPoint.y * toPoint.y,
    ]);
  }

  // Build the result vector b
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const toPoint = to[i]!;
    b.push(toPoint.x);
    b.push(toPoint.y);
  }

  // Solve the linear system Ah = b using LU decomposition
  let h: number[];
  try {
    const solution = lusolve(matrix(A), matrix(b.map(val => [val])));
    h = (solution as any).toArray().map((row: number[]) => row[0]);
  } catch (error) {
    console.error('Failed to solve matrix equation:', error);
    // Return identity matrix on error
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }

  // Construct the 4x4 homography matrix H from the solution
  // h contains [h00, h01, h02, h10, h11, h12, h20, h21]
  // We need to add h22 = 1 to complete the matrix
  const H: number[][] = [
    [h[0] ?? 0, h[1] ?? 0, 0, h[2] ?? 0], // First row
    [h[3] ?? 0, h[4] ?? 0, 0, h[5] ?? 0], // Second row
    [0, 0, 1, 0],                         // Third row (z-axis, identity for 2D)
    [h[6] ?? 0, h[7] ?? 0, 0, 1],         // Fourth row (perspective)
  ];

  // Verify the transformation (optional, for debugging)
  if (process.env.NODE_ENV === 'development') {
    verifyTransform(H, from, to);
  }

  return H;
}

/**
 * Verify that the transformation matrix correctly maps from source to target
 * Used for debugging and validation
 */
function verifyTransform(H: number[][], from: Point[], to: Point[]): void {
  for (let i = 0; i < 4; i++) {
    const fromPoint = from[i];
    const toPoint = to[i];
    
    if (!fromPoint || !toPoint) continue;
    
    // Apply homogeneous transformation
    const transformed = multiply(H, [fromPoint.x, fromPoint.y, 0, 1]) as number[];
    
    // Normalize by dividing by w (homogeneous coordinate)
    const w = transformed[3] ?? 1;
    const x = (transformed[0] ?? 0) / w;
    const y = (transformed[1] ?? 0) / w;
    
    // Check if transformed point matches target
    const error = Math.sqrt(
      Math.pow(x - toPoint.x, 2) + Math.pow(y - toPoint.y, 2),
    );
    
    if (error > 1e-6) {
      console.warn(`Transform verification failed for point ${i}:`, {
        expected: toPoint,
        actual: { x, y },
        error,
      });
    }
  }
}

/**
 * Convert a 4x4 matrix to CSS matrix3d string
 * CSS expects column-major order
 */
export function matrixToCSS(matrix: number[][]): string {
  const values: number[] = [];
  
  // Convert from row-major to column-major
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      const value = matrix[row]?.[col] ?? 0;
      values.push(value);
    }
  }
  
  return `matrix3d(${values.map(v => v.toFixed(10)).join(', ')})`;
}

/**
 * Get element styles as object
 */
export function getElementStyles(element: HTMLElement) {
  const computed = window.getComputedStyle(element);
  return {
    position: computed.position,
    left: computed.left,
    top: computed.top,
    width: computed.width,
    height: computed.height,
    opacity: computed.opacity,
  };
}

/**
 * Calculate original positions from element offsets
 * Used to establish the reference frame for transformations
 */
export function calculateOriginalPositions(
  controlPoints: HTMLElement[],
): Point[] {
  return controlPoints.map((point) => {
    const rect = point.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  });
}

/**
 * Apply transform matrix to an element
 */
export function applyTransformToElement(
  element: HTMLElement,
  matrix: number[][],
  transformOrigin = '0 0',
): void {
  element.style.transform = matrixToCSS(matrix);
  element.style.transformOrigin = transformOrigin;
}

/**
 * Create identity matrix (no transformation)
 */
export function identityMatrix(): number[][] {
  return [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

/**
 * Calculate bounding box from 4 corner points
 */
export function calculateBoundingBox(points: Point[]): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);
  
  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

/**
 * Calculate control points from matrix3d transform
 * Given original rectangle corners and transform matrix, 
 * calculate where the control points should be positioned
 */
export function calculateControlPointsFromMatrix(
  originalPoints: Point[], 
  transformMatrix: number[][]
): Point[] {
  const controlPoints: Point[] = [];
  
  try {
    // Validate matrix dimensions
    if (!transformMatrix || transformMatrix.length !== 4) {
      return [...originalPoints];
    }
    
    // Apply the transform matrix to each original corner point
    for (const point of originalPoints) {
      // Convert point to homogeneous coordinates [x, y, 0, 1]
      const homogeneousPoint = [point.x, point.y, 0, 1];
      
      // Apply matrix transformation
      const transformedPoint = [0, 0, 0, 0];
      for (let i = 0; i < 4; i++) {
        transformedPoint[i] = 0;
        const matrixRow = transformMatrix[i];
        if (matrixRow && matrixRow.length === 4) {
          for (let j = 0; j < 4; j++) {
            const matrixValue = matrixRow[j];
            const pointValue = homogeneousPoint[j];
            if (typeof matrixValue === 'number' && typeof pointValue === 'number') {
              const currentValue = transformedPoint[i];
              if (typeof currentValue === 'number') {
                transformedPoint[i] = currentValue + (matrixValue * pointValue);
              }
            }
          }
        }
      }
      
      // Convert back to 2D coordinates (divide by w component)
      const w = transformedPoint[3] || 1;
      const transformedX = (transformedPoint[0] || 0) / w;
      const transformedY = (transformedPoint[1] || 0) / w;
      
      controlPoints.push({ x: transformedX, y: transformedY });
    }
  } catch (error) {
    console.error('Error calculating control points from matrix:', error);
    // Return original points as fallback
    return [...originalPoints];
  }
  
  return controlPoints;
}
