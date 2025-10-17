import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { EditorImage } from '@/models/EditorImage';

// Helper function to format dates
function formatDate(date: Date | null | string): string | null {
  if (!date) {
    return null;
  }

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) {
      return null;
    }

    return d.toISOString().slice(0, 19).replace('T', ' ');
  } catch {
    return null;
  }
}

// GET - Get single editor image by id
async function handleGetEditorImage(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const imageId = resolvedParams.id;

    if (!imageId) {
      return NextResponse.json(
        { error: 'Editor image ID is required' },
        { status: 400 },
      );
    }

    // Validate ObjectId
    if (!imageId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid editor image ID' },
        { status: 400 },
      );
    }

    // Find the editor image
    const rawImage = await (EditorImage as any)
      .findById(imageId)
      .select('name parent_id category_id img img_thumb img_process display group_img group_imgThumb group_name is_background description user_id createdAt updatedAt')
      .lean();

    if (!rawImage) {
      return NextResponse.json(
        { error: 'Editor image not found' },
        { status: 404 },
      );
    }

    const image = {
      id: rawImage._id.toString(),
      name: rawImage.name,
      parent_id: rawImage.parent_id,
      category_id: rawImage.category_id,
      img: rawImage.img,
      img_thumb: rawImage.img_thumb,
      img_process: rawImage.img_process,
      display: rawImage.display,
      group_img: rawImage.group_img,
      group_imgThumb: rawImage.group_imgThumb,
      group_name: rawImage.group_name,
      is_background: rawImage.is_background,
      description: rawImage.description,
      user_id: rawImage.user_id,
      createdAt: formatDate(rawImage.createdAt),
      updatedAt: formatDate(rawImage.updatedAt),
    };

    return NextResponse.json({ image });
  } catch (error) {
    console.error('Error fetching editor image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// PUT - Update editor image
async function handleUpdateEditorImage(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const imageId = resolvedParams.id;
    const body = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { error: 'Editor image ID is required' },
        { status: 400 },
      );
    }

    // Validate ObjectId
    if (!imageId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid editor image ID' },
        { status: 400 },
      );
    }

    // Validate allowed updates
    const allowedUpdates = [
      'name',
      'parent_id',
      'category_id',
      'img',
      'img_thumb',
      'img_process',
      'display',
      'group_img',
      'group_imgThumb',
      'group_name',
      'is_background',
      'description',
      'user_id',
    ];
    const filteredUpdates: any = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedUpdates.includes(key)) {
        if (['parent_id', 'display', 'is_background', 'user_id'].includes(key)) {
          filteredUpdates[key] = value !== null ? Number(value) : null;
        } else {
          filteredUpdates[key] = value;
        }
      }
    }

    // Validate required fields if provided
    if (filteredUpdates.name !== undefined && !filteredUpdates.name?.trim()) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 },
      );
    }

    // Update editor image
    const rawUpdatedImage = await (EditorImage as any).findByIdAndUpdate(
      imageId,
      filteredUpdates,
      {
        new: true,
        select: 'name parent_id category_id img img_thumb img_process display group_img group_imgThumb group_name is_background description user_id createdAt updatedAt',
      },
    ).lean();

    if (!rawUpdatedImage) {
      return NextResponse.json(
        { error: 'Editor image not found' },
        { status: 404 },
      );
    }

    const updatedImage = {
      id: rawUpdatedImage._id.toString(),
      name: rawUpdatedImage.name,
      parent_id: rawUpdatedImage.parent_id,
      category_id: rawUpdatedImage.category_id,
      img: rawUpdatedImage.img,
      img_thumb: rawUpdatedImage.img_thumb,
      img_process: rawUpdatedImage.img_process,
      display: rawUpdatedImage.display,
      group_img: rawUpdatedImage.group_img,
      group_imgThumb: rawUpdatedImage.group_imgThumb,
      group_name: rawUpdatedImage.group_name,
      is_background: rawUpdatedImage.is_background,
      description: rawUpdatedImage.description,
      user_id: rawUpdatedImage.user_id,
      createdAt: formatDate(rawUpdatedImage.createdAt),
      updatedAt: formatDate(rawUpdatedImage.updatedAt),
    };

    return NextResponse.json({
      message: 'Editor image updated successfully',
      image: updatedImage,
    });
  } catch (error) {
    console.error('Error updating editor image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE - Delete editor image
async function handleDeleteEditorImage(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const imageId = resolvedParams.id;

    if (!imageId) {
      return NextResponse.json(
        { error: 'Editor image ID is required' },
        { status: 400 },
      );
    }

    // Validate ObjectId
    if (!imageId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid editor image ID' },
        { status: 400 },
      );
    }

    // Find the image first to get URLs
    const imageToDelete = await (EditorImage as any).findById(imageId).select('img img_thumb').lean();

    if (!imageToDelete) {
      return NextResponse.json(
        { error: 'Editor image not found' },
        { status: 404 },
      );
    }

    // Delete images from Cloudinary
    const deletePromises = [];

    if (imageToDelete.img) {
      deletePromises.push(deleteImageFromCloudinary(imageToDelete.img));
    }

    if (imageToDelete.img_thumb && imageToDelete.img_thumb !== imageToDelete.img) {
      deletePromises.push(deleteImageFromCloudinary(imageToDelete.img_thumb));
    }

    // Wait for all delete operations to complete
    await Promise.allSettled(deletePromises);

    // Delete editor image from database
    const deletedImage = await (EditorImage as any).findByIdAndDelete(imageId);

    if (!deletedImage) {
      return NextResponse.json(
        { error: 'Editor image not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: 'Editor image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting editor image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// Helper function to delete image from Cloudinary
async function deleteImageFromCloudinary(imageUrl: string) {
  try {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');

    if (uploadIndex === -1 || uploadIndex >= urlParts.length - 2) {
      console.warn('Invalid Cloudinary URL format:', imageUrl);
      return;
    }

    // Skip version (v{number}) and get the public_id
    let publicIdParts = [];
    for (let i = uploadIndex + 1; i < urlParts.length; i++) {
      const part = urlParts[i];
      if (!part) continue;
      // Skip version parts that start with 'v' followed by digits
      if (part.match(/^v\d+$/)) {
        continue;
      }
      publicIdParts.push(part);
    }

    const publicIdWithExtension = publicIdParts.join('/');
    const publicId = publicIdWithExtension.split('.')[0]; // Remove file extension

    console.log('Deleting image from Cloudinary:', publicId);

    // Call delete API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/editor-images/delete-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.warn('Failed to delete image from Cloudinary:', errorData);
    } else {
      console.log('Successfully deleted image from Cloudinary:', publicId);
    }
  } catch (error) {
    console.warn('Error deleting image from Cloudinary:', error);
  }
}

export const GET = withAdminAuth(handleGetEditorImage);
export const PUT = withAdminAuth(handleUpdateEditorImage);
export const DELETE = withAdminAuth(handleDeleteEditorImage);