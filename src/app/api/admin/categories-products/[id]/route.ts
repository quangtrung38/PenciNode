import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { CategoryProduct } from '@/models/CategoryProduct';

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

// PUT - Update category product
async function handleUpdateCategoryProduct(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const { id } = params;
    const body = await _request.json();
    const { name, slug, img, imgIcon, position, display, displayTgia, displayPenci } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Tên danh mục là bắt buộc' },
        { status: 400 },
      );
    }

    // Find and update category
    const category = await CategoryProduct.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        slug: slug || null,
        img: img || null,
        imgIcon: imgIcon || null,
        position: position || 0,
        display: display ?? 0,
        displayTgia: displayTgia ?? 0,
        displayPenci: displayPenci ?? 0,
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return NextResponse.json(
        { error: 'Danh mục không tồn tại' },
        { status: 404 },
      );
    }

    const formattedCategory = {
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      img: category.img,
      imgIcon: category.imgIcon,
      position: category.position,
      display: category.display,
      displayTgia: category.displayTgia,
      displayPenci: category.displayPenci,
      createdAt: formatDate(category.createdAt),
      updatedAt: formatDate(category.updatedAt),
    };

    return NextResponse.json({
      message: 'Cập nhật danh mục thành công',
      category: formattedCategory,
    });
  } catch (error) {
    console.error('Error updating category product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE - Delete category product
async function handleDeleteCategoryProduct(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const { id } = params;

    // Find and delete category
    const category = await CategoryProduct.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json(
        { error: 'Danh mục không tồn tại' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: 'Xóa danh mục thành công',
    });
  } catch (error) {
    console.error('Error deleting category product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const PUT = withAdminAuth(handleUpdateCategoryProduct);
export const DELETE = withAdminAuth(handleDeleteCategoryProduct);