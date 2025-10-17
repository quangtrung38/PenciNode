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

// PATCH - Toggle editor image display status
async function handleToggleEditorImageDisplay(
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

    // Find the current editor image
    const currentImage = await (EditorImage as any).findById(imageId).select('display').lean();

    if (!currentImage) {
      return NextResponse.json(
        { error: 'Editor image not found' },
        { status: 404 },
      );
    }

    // Toggle the display status (0 -> 1, 1 -> 0)
    const newStatus = currentImage.display === 1 ? 0 : 1;

    // Update editor image display
    const rawUpdatedImage = await (EditorImage as any).findByIdAndUpdate(
      imageId,
      { display: newStatus },
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
      success: true,
      message: `Editor image ${newStatus === 1 ? 'displayed' : 'hidden'} successfully`,
      image: updatedImage,
    });
  } catch (error) {
    console.error('Error toggling editor image display:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const PATCH = withAdminAuth(handleToggleEditorImageDisplay);