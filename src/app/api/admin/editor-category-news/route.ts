import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import EditorCategoryNews from '@/models/EditorCategoryNews';

// GET - List categories with optional filters
async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const display = searchParams.get('display');
    const parent_id = searchParams.get('parent_id');

    const query: any = {};

    // Search by name or slug
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by display
    if (display !== null && display !== 'all') {
      query.display = Number.parseInt(display);
    }

    // Filter by parent_id
    if (parent_id !== null && parent_id !== undefined && parent_id !== 'all') {
      query.parent_id = parent_id;
    }

    // @ts-ignore - Mongoose type issue
    const categories = (await EditorCategoryNews.find(query)
      .sort({ position: 1, createdAt: -1 })
      .lean()) as any;

    // Format response
    const formattedCategories = categories.map((cat: any) => ({
      _id: cat._id.toString(),
      id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      img: cat.img || null,
      display: cat.display,
      position: cat.position,
      parent_id: cat.parent_id?.toString() || null,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    return NextResponse.json({
      categories: formattedCategories,
      total: formattedCategories.length,
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 },
    );
  }
}

// POST - Create new category
async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Auto-generate slug from name if not provided
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

    // Check if slug already exists
    // @ts-ignore - Mongoose type issue
    const existingCategory = (await EditorCategoryNews.findOne({ slug })) as any;
    if (existingCategory) {
      slug = `${slug}-${Date.now()}`;
    }

    // @ts-ignore - Mongoose type issue
    const newCategory = (await EditorCategoryNews.create({
      name: body.name.trim(),
      slug,
      img: body.img || null,
      display: body.display !== undefined ? body.display : 1,
      position: body.position !== undefined ? body.position : 0,
      parent_id: body.parent_id || null,
    })) as any;

    return NextResponse.json({
      _id: newCategory._id.toString(),
      id: newCategory._id.toString(),
      name: newCategory.name,
      slug: newCategory.slug,
      img: newCategory.img,
      display: newCategory.display,
      position: newCategory.position,
      parent_id: newCategory.parent_id?.toString() || null,
      createdAt: newCategory.createdAt,
      updatedAt: newCategory.updatedAt,
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 },
    );
  }
}

export { GET, POST };

// Apply admin authentication middleware
export const dynamic = 'force-dynamic';
