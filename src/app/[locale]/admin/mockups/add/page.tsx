'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getTransform,
  matrixToCSS,
  identityMatrix,
  type Point,
} from '@/utils/matrixTransform';

interface BoxData {
  id: string;
  box: {
    matrix3d: number[][];
    styles: {
      position: string;
      left: string;
      top: string;
      width: string;
      height: string;
      opacity: string;
    };
  };
  imageShow: {
    matrix3d: number[][];
    styles: {
      position: string;
      left: string;
      top: string;
      width: string;
      height: string;
      opacity: string;
    };
  };
}

export default function AddMockupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imagePreviewRef = useRef<HTMLImageElement>(null);

  const [products, setProducts] = useState<Array<{ _id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    name: '',
    product_id: '',
    background_color: '#ffffff',
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState({ width: 800, height: 800 });
  
  // Canvas editor state
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [activeBoxIndex, setActiveBoxIndex] = useState<number | null>(null);
  
  // Control points for active box
  const [controlPoints, setControlPoints] = useState<Point[]>([
    { x: 0, y: 0 },
    { x: 0, y: 800 },
    { x: 800, y: 0 },
    { x: 800, y: 800 },
  ]);
  const [originalPositions, setOriginalPositions] = useState<Point[]>([
    { x: 0, y: 0 },
    { x: 0, y: 800 },
    { x: 800, y: 0 },
    { x: 800, y: 800 },
  ]);
  
  const [isDragging, setIsDragging] = useState<number | null>(null);

  // Load products for dropdown
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/admin/products');
        const result = await response.json();

        if (response.ok && result.success) {
          setProducts(result.products || []);
        } else {
          console.error('Failed to load products:', result.error);
        }
      } catch (err) {
        console.error('Error loading products:', err);
      }
    };

    loadProducts();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);

      // Upload file to Cloudinary
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/admin/mockups/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || 'Failed to upload image to Cloudinary');
      }

      // Set image preview to the uploaded Cloudinary URL
      const imageUrl = uploadResult.fileUrl;
      setImagePreview(imageUrl);
      
      // Load image to get dimensions
      const img = new Image();
      img.onload = () => {
        const width = 800;
        const height = 800;
        setImageDimensions({ width, height });
        
        // Reset control points based on image size
        const newPoints = [
          { x: 0, y: 0 },
          { x: 0, y: height },
          { x: width, y: 0 },
          { x: width, y: height },
        ];
        setControlPoints(newPoints);
        setOriginalPositions(newPoints);
      };
      img.src = imageUrl;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  // Add mockup box with control points
  const handleAddMockupBox = () => {
    if (!imagePreview) {
      alert('Vui lòng chọn ảnh trước!');
      return;
    }

    const newBoxId = `box-${boxes.length + 1}`;
    const identityMat = identityMatrix();

    const newBox: BoxData = {
      id: newBoxId,
      box: {
        matrix3d: identityMat,
        styles: {
          position: 'absolute',
          left: '0px',
          top: '0px',
          width: `${imageDimensions.width}px`,
          height: `${imageDimensions.height}px`,
          opacity: '0.3',
        },
      },
      imageShow: {
        matrix3d: identityMat,
        styles: {
          position: 'absolute',
          left: '0px',
          top: '0px',
          width: `${imageDimensions.width}px`,
          height: `${imageDimensions.height}px`,
          opacity: '0.3',
        },
      },
    };

    setBoxes([...boxes, newBox]);
    setActiveBoxIndex(boxes.length); // Set new box as active
    
    // Reset control points to image corners
    const newPoints = [
      { x: 0, y: 0 },
      { x: 0, y: imageDimensions.height },
      { x: imageDimensions.width, y: 0 },
      { x: imageDimensions.width, y: imageDimensions.height },
    ];
    setControlPoints(newPoints);
    setOriginalPositions(newPoints);
  };

  // Apply transform when control points change
  const applyTransform = () => {
    if (activeBoxIndex === null) return;

    try {
      // Calculate transform matrix from original to current positions
      const transformMatrix = getTransform(originalPositions, controlPoints);
      
      // Debug log
      console.log('Applying transform (add page):', {
        activeBoxIndex,
        originalPositions,
        controlPoints,
        transformMatrix
      });

      // Update the active box with new transform
      setBoxes((prevBoxes) => {
        const newBoxes = [...prevBoxes];
        if (activeBoxIndex < newBoxes.length) {
          const activeBox = newBoxes[activeBoxIndex];
          if (activeBox) {
            newBoxes[activeBoxIndex] = {
              ...activeBox,
              box: {
                ...activeBox.box,
                matrix3d: transformMatrix,
              },
              imageShow: {
                ...activeBox.imageShow,
                matrix3d: transformMatrix,
              },
            };
            
            console.log('Updated box (add page):', newBoxes[activeBoxIndex]);
          }
        }
        return newBoxes;
      });
    } catch (error) {
      console.error('Error applying transform:', error);
    }
  };

  // Apply transform when control points change (real-time during drag)
  useEffect(() => {
    if (activeBoxIndex !== null) {
      applyTransform();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlPoints, activeBoxIndex]);

  // Handle box click for selection
  const handleBoxClick = (index: number) => {
    setActiveBoxIndex(index);
    // Reset control points when selecting a box
    const newPoints = [
      { x: 0, y: 0 },
      { x: 0, y: imageDimensions.height },
      { x: imageDimensions.width, y: 0 },
      { x: imageDimensions.width, y: imageDimensions.height },
    ];
    setControlPoints(newPoints);
    setOriginalPositions(newPoints);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Vui lòng nhập tên mockup');
      }

      if (!formData.product_id) {
        throw new Error('Vui lòng chọn sản phẩm');
      }

      if (!imagePreview) {
        throw new Error('Vui lòng chọn hình ảnh');
      }

      // Calculate size_img from image dimensions
      const imgElement = imagePreviewRef.current;
      let sizeImgString = '';
      if (imgElement) {
        const rect = imgElement.getBoundingClientRect();
        sizeImgString = `${rect.width}x${rect.height}x${rect.top}x${rect.left}x${rect.right}x${rect.bottom}x${rect.x}x${rect.y}`;
      }

      // Prepare JSON data for boxes
      const jsonData = boxes.length > 0 ? JSON.stringify({ boxes }) : null;

      const mockupData = {
        name: formData.name,
        product_id: formData.product_id,
        background_color: formData.background_color,
        image: imagePreview,
        jsoncol: jsonData,
        size_img: sizeImgString,
        display: 1,
        isViewMain: 0,
      };

      const response = await fetch('/api/admin/mockups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockupData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create mockup');
      }

      // Success - redirect to mockups list
      router.push('/admin/mockups');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/mockups');
  };

  // Mouse handlers for dragging control points
  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(index);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging === null || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(imageDimensions.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(imageDimensions.height, e.clientY - rect.top));

    setControlPoints((prev) => {
      const newPoints = [...prev];
      newPoints[isDragging] = { x, y };
      
      // Debug log to ensure control points are updating
      console.log('Updating control points (add page):', newPoints);
      
      return newPoints;
    });
  };

  const handleMouseUp = () => {
    if (isDragging !== null) {
      // Apply final transform
      applyTransform();
      setIsDragging(null);
    }
  };

  // Delete active box
  const handleDeleteBox = (index: number) => {
    setBoxes((prev) => prev.filter((_, i) => i !== index));
    if (activeBoxIndex === index) {
      setActiveBoxIndex(null);
    } else if (activeBoxIndex !== null && activeBoxIndex > index) {
      setActiveBoxIndex(activeBoxIndex - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Thêm Mockup mới
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Tạo mockup với canvas editor và perspective transform
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Lỗi khi tạo mockup
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 dark:border-white/[0.05] dark:bg-white/[0.03] w-1/2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Thông tin cơ bản</h3>

          <div className="space-y-4">
            {/* Mockup Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tên mockup <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="Nhập tên mockup"
                required
              />
            </div>

            {/* Product Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sản phẩm <span className="text-red-500">*</span>
              </label>
              <select
                name="product_id"
                value={formData.product_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">-- Chọn sản phẩm --</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Màu nền canvas
              </label>
              <input
                type="color"
                name="background_color"
                value={formData.background_color}
                onChange={handleInputChange}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Canvas Editor */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Canvas Editor</h3>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap mb-4">
            <label className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 cursor-pointer shadow-sm border border-blue-600">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Chọn hình ảnh
            </label>

            <button
              type="button"
              onClick={handleAddMockupBox}
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 focus:ring-4 focus:ring-red-200 transition-all duration-200 shadow-sm border border-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-red-500 disabled:hover:to-red-600"
              disabled={!imagePreview}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Thêm Mockup
            </button>
          </div>

          {/* Main Content Area: Canvas (left) + Boxes List (right) */}
          {imagePreview ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Canvas Area (2/3 width) */}
              <div className="lg:col-span-2">
                {/* Canvas Preview */}
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div
                    ref={canvasRef}
                    className="relative mx-auto"
                    style={{
                      width: `${imageDimensions.width}px`,
                      height: `${imageDimensions.height}px`,
                      backgroundColor: formData.background_color,
                      cursor: isDragging !== null ? 'grabbing' : 'default',
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                  {/* Base Image */}
                  <img
                    ref={imagePreviewRef}
                    src={imagePreview}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />

                  {/* Render boxes */}
                  {boxes.map((boxData, index) => {
                    const isActive = activeBoxIndex === index;
                    const transformCSS = matrixToCSS(boxData.imageShow.matrix3d);
                    
                    return (
                      <div key={boxData.id}>
                        {/* Box overlay (semi-transparent dark) */}
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            position: boxData.box.styles.position as any,
                            left: boxData.box.styles.left,
                            top: boxData.box.styles.top,
                            width: boxData.box.styles.width,
                            height: boxData.box.styles.height,
                            opacity: boxData.box.styles.opacity,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            transform: transformCSS,
                            transformOrigin: '0 0',
                            zIndex: isActive ? 999 : 900,
                          }}
                        />
                        
                        {/* Simple overlay layer (chỉ là lớp màng đơn giản) */}
                        <div
                          className="absolute flex items-center justify-center cursor-pointer"
                          style={{
                            position: boxData.imageShow.styles.position as any,
                            left: boxData.imageShow.styles.left,
                            top: boxData.imageShow.styles.top,
                            width: boxData.imageShow.styles.width,
                            height: boxData.imageShow.styles.height,
                            opacity: isActive ? 0.7 : 0.3,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            transform: transformCSS,
                            transformOrigin: '0 0',
                            zIndex: isActive ? 1000 : 901,
                          }}
                          onClick={() => handleBoxClick(index)}
                        >
                          <span className="text-white font-semibold text-sm pointer-events-none">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                    {/* Control Points (only for active box) */}
                    {activeBoxIndex !== null && controlPoints.map((point, index) => (
                      <div
                        key={index}
                        className="absolute cursor-move"
                        style={{
                          left: `${point.x}px`,
                          top: `${point.y}px`,
                          width: '10px',
                          height: '10px',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: '#f5222d',
                          border: '3px solid white',
                          borderRadius: '50%',
                          zIndex: 100000,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }}
                        onMouseDown={(e) => handleMouseDown(index, e)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Mockup Boxes List (1/3 width) */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Mockup Boxes ({boxes.length})
                  </h4>
                  
                  {boxes.length > 0 ? (
                    <div className="space-y-2">
                      {boxes.map((box, index) => (
                        <div
                          key={box.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            activeBoxIndex === index
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 bg-white'
                          }`}
                          onClick={() => {
                            setActiveBoxIndex(index);
                            // Reset control points for this box
                            const newPoints = [
                              { x: 0, y: 0 },
                              { x: 0, y: imageDimensions.height },
                              { x: imageDimensions.width, y: 0 },
                              { x: imageDimensions.width, y: imageDimensions.height },
                            ];
                            setControlPoints(newPoints);
                            setOriginalPositions(newPoints);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {box.id} {activeBoxIndex === index && '(Active)'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBox(index);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-8">
                      <div className="mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      Chưa có mockup box nào.<br />
                      Click "Thêm Mockup Box" để bắt đầu.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-lg">Chọn hình ảnh để bắt đầu chỉnh sửa</p>
              <p className="text-sm text-gray-400 mt-1">Hỗ trợ các định dạng: JPG, PNG, GIF, WebP</p>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading
              ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tạo...
                  </div>
                )
              : (
                  'Tạo mockup'
                )}
          </button>
        </div>
      </form>
    </div>
  );
}