import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/adminAuth';
import connectDB from '@/libs/mongoose';
import { EditorCategoryQRCode } from '@/models/EditorCategoryQRCode';

// PUT: Update QR code category
async function handlePut(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, display } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Tên danh mục là bắt buộc' },
        { status: 400 }
      );
    }

    const category = await EditorCategoryQRCode.findByIdAndUpdate(
      params.id,
      {
        name: name.trim(),
        display: display ?? 1,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!category) {
      return NextResponse.json(
        { error: 'Không tìm thấy danh mục' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      category: {
        id: (category._id as any).toString(),
        name: category.name,
        display: category.display,
        position: category.position,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      message: 'Cập nhật danh mục thành công',
    });
  } catch (error) {
    console.error('Error updating QR code category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE: Delete QR code category
async function handleDelete(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const category = await EditorCategoryQRCode.findByIdAndDelete(params.id);

    if (!category) {
      return NextResponse.json(
        { error: 'Không tìm thấy danh mục' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Xóa danh mục thành công',
    });
  } catch (error) {
    console.error('Error deleting QR code category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

export const PUT = withAdminAuth(handlePut);
export const DELETE = withAdminAuth(handleDelete);
