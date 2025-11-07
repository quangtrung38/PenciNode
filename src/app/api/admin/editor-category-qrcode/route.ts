import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/adminAuth';
import connectDB from '@/libs/mongoose';
import { EditorCategoryQRCode } from '@/models/EditorCategoryQRCode';

// GET: List all QR code categories
async function handleGet() {
  try {
    await connectDB();

    const categories = await EditorCategoryQRCode.find()
      .select('name display position createdAt updatedAt')
      .sort({ position: 1, createdAt: -1 })
      .lean();

    // Map _id to id for frontend compatibility
    const formattedCategories = categories.map((cat: any) => ({
      id: cat._id.toString(),
      name: cat.name,
      display: cat.display,
      position: cat.position,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    return NextResponse.json({
      categories: formattedCategories,
      count: formattedCategories.length,
    });
  } catch (error) {
    console.error('Error fetching QR code categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST: Create new QR code category
async function handlePost(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, display = 1 } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Tên danh mục là bắt buộc' },
        { status: 400 }
      );
    }

    // Get max position
    const maxCategory = await EditorCategoryQRCode.findOne()
      .sort({ position: -1 })
      .select('position')
      .lean();
    const position = (maxCategory?.position || 0) + 1;

    const category = await EditorCategoryQRCode.create({
      name: name.trim(),
      display,
      position,
    });

    return NextResponse.json({
      category: {
        id: (category._id as any).toString(),
        name: category.name,
        display: category.display,
        position: category.position,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      message: 'Tạo danh mục thành công',
    });
  } catch (error) {
    console.error('Error creating QR code category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(handleGet);
export const POST = withAdminAuth(handlePost);
