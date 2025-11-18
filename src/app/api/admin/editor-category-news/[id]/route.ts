import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import EditorCategoryNews from '@/models/EditorCategoryNews';

// GET - Get single category by ID
async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    // @ts-ignore - Mongoose type issue
    const category = (await EditorCategoryNews.findById(params.id).lean()) as any;

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id: category._id.toString(),
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      img: category.img || null,
      display: category.display,
      position: category.position,
      parent_id: category.parent_id?.toString() || null,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 },
    );
  }
}

// PUT - Update category
async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const body = await request.json();

    // If name is changed, regenerate slug
    if (body.name) {
      let slug = body.slug || body.name;
      slug = slug
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      // Check if slug exists (excluding current category)
      // @ts-ignore - Mongoose type issue
      const existingCategory = (await EditorCategoryNews.findOne({
        slug,
        _id: { $ne: params.id },
      })) as any;
      if (existingCategory) {
        slug = `${slug}-${Date.now()}`;
      }

      body.slug = slug;
    }

    // @ts-ignore - Mongoose type issue
    const updatedCategory = (await EditorCategoryNews.findByIdAndUpdate(
      params.id,
      body,
      { new: true },
    ).lean()) as any;

    if (!updatedCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id: updatedCategory._id.toString(),
      id: updatedCategory._id.toString(),
      name: updatedCategory.name,
      slug: updatedCategory.slug,
      img: updatedCategory.img || null,
      display: updatedCategory.display,
      position: updatedCategory.position,
      parent_id: updatedCategory.parent_id?.toString() || null,
      createdAt: updatedCategory.createdAt,
      updatedAt: updatedCategory.updatedAt,
    });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 },
    );
  }
}

// DELETE - Delete category
async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    // @ts-ignore - Mongoose type issue
    const deletedCategory = (await EditorCategoryNews.findByIdAndDelete(params.id)) as any;

    if (!deletedCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 },
    );
  }
}

export { GET, PUT, DELETE };

export const dynamic = 'force-dynamic';
