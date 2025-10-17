import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { Product } from '@/models/Product';

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

// GET - Get single category by id
async function handleGetCategory(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const categoryId = resolvedParams.id;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 },
      );
    }

    // Validate ObjectId
    if (!categoryId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 },
      );
    }

    // Find the category
    const rawCategory = await (Product as any)
      .findById(categoryId)
      .select('name position display img tgia_cate createdAt updatedAt')
      .lean();

    if (!rawCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 },
      );
    }

    const category = {
      id: rawCategory._id.toString(),
      name: rawCategory.name,
      position: rawCategory.position,
      display: rawCategory.display,
      img: rawCategory.img,
      createdAt: formatDate(rawCategory.createdAt),
      updatedAt: formatDate(rawCategory.updatedAt),
    };

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// PUT - Update category
async function handleUpdateCategory(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();
    const { name, position, display, img } = body;

    // Validate required fields only if they are provided
    if (name !== undefined && !name?.trim()) {
      return NextResponse.json(
        { error: 'Tên danh mục là bắt buộc' },
        { status: 400 },
      );
    }

    // Check if category exists
    const existingCategory = await (Product as any).findById(id);
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Danh mục không tồn tại' },
        { status: 404 },
      );
    }

    // Update category - only update provided fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (position !== undefined) updateData.position = position;
    if (display !== undefined) updateData.display = display;
    if (img !== undefined) updateData.img = img;

    const updatedCategory = await (Product as any).findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    if (!updatedCategory) {
      return NextResponse.json(
        { error: 'Không thể cập nhật danh mục' },
        { status: 500 },
      );
    }

    const formattedCategory = {
      id: updatedCategory._id.toString(),
      name: updatedCategory.name,
      position: updatedCategory.position,
      display: updatedCategory.display,
      img: updatedCategory.img,
      createdAt: formatDate(updatedCategory.createdAt),
      updatedAt: formatDate(updatedCategory.updatedAt),
    };

    return NextResponse.json({
      message: 'Cập nhật danh mục thành công',
      category: formattedCategory,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE - Delete category
async function handleDeleteCategory(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const { id } = params;

    // Check if category exists
    const existingCategory = await (Product as any).findById(id);
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Danh mục không tồn tại' },
        { status: 404 },
      );
    }

    // Delete category
    await (Product as any).findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Xóa danh mục thành công',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const GET = withAdminAuth(handleGetCategory);
export const PUT = withAdminAuth(handleUpdateCategory);
export const DELETE = withAdminAuth(handleDeleteCategory);