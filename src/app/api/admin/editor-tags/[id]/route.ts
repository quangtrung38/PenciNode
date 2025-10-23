import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { EditorTag } from '@/models/EditorTag';

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

// Helper function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// PUT - Update editor tag
async function handleUpdateEditorTag(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();
    const { name, display, display_cate, position, is_cate, img } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Tên danh mục là bắt buộc' },
        { status: 400 },
      );
    }

    // Find existing tag
    const existingTag = await EditorTag.findById(id);
    if (!existingTag) {
      return NextResponse.json(
        { error: 'Danh mục không tồn tại' },
        { status: 404 },
      );
    }

    // Create new slug if name changed
    let slug = existingTag.slug;
    if (name.trim() !== existingTag.name) {
      slug = createSlug(name.trim());

      // Check if new slug already exists (excluding current tag)
      const slugExists = await EditorTag.findOne({ slug, _id: { $ne: id } });
      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug đã tồn tại, vui lòng chọn tên khác' },
          { status: 400 },
        );
      }
    }

    // Update editor tag
    const updatedTag = await EditorTag.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        slug,
        display: display !== undefined ? display : existingTag.display,
        display_cate: display_cate !== undefined ? display_cate : existingTag.display_cate,
        position: position !== undefined ? position : existingTag.position,
        is_cate: is_cate !== undefined ? is_cate : existingTag.is_cate,
        img: img !== undefined ? img : existingTag.img,
      },
      { new: true },
    );

    if (!updatedTag) {
      return NextResponse.json(
        { error: 'Không thể cập nhật danh mục' },
        { status: 500 },
      );
    }

    const formattedEditorTag = {
      id: (updatedTag._id as any).toString(),
      name: updatedTag.name,
      slug: updatedTag.slug,
      display: updatedTag.display,
      display_cate: updatedTag.display_cate,
      position: updatedTag.position,
      is_cate: updatedTag.is_cate,
      img: updatedTag.img,
      createdAt: formatDate(updatedTag.createdAt),
      updatedAt: formatDate(updatedTag.updatedAt),
    };

    return NextResponse.json({
      message: 'Cập nhật danh mục thành công',
      editorTag: formattedEditorTag,
    });
  } catch (error) {
    console.error('Error updating editor tag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE - Delete editor tag
async function handleDeleteEditorTag(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const { id } = params;

    // Find and delete the tag
    const deletedTag = await EditorTag.findByIdAndDelete(id);

    if (!deletedTag) {
      return NextResponse.json(
        { error: 'Danh mục không tồn tại' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: 'Xóa danh mục thành công',
    });
  } catch (error) {
    console.error('Error deleting editor tag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const PUT = withAdminAuth(handleUpdateEditorTag);
export const DELETE = withAdminAuth(handleDeleteEditorTag);