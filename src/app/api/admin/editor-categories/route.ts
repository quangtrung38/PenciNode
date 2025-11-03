import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { CategoryProduct } from '@/models/CategoryProduct';

// GET - Get all editor categories (categories_products table)
async function handleGetEditorCategories(
  request: NextRequest,
) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const display = searchParams.get('display') || 'all';

    // Build query
    const query: any = {};

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Filter by display
    if (display !== 'all') {
      query.display = parseInt(display);
    }

    // Get editor categories from categories_products table
    const categories = await CategoryProduct.find(query)
      .select('name slug display position img createdAt updatedAt')
      .sort({ position: 1, createdAt: -1 })
      .lean();

    const formattedCategories = categories.map((category: any) => ({
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      display: category.display,
      position: category.position,
      img: category.img,
      createdAt: category.createdAt?.toISOString().slice(0, 19).replace('T', ' ') || null,
      updatedAt: category.updatedAt?.toISOString().slice(0, 19).replace('T', ' ') || null,
    }));

    return NextResponse.json({
      categories: formattedCategories,
    });
  } catch (error) {
    console.error('Error fetching editor categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const GET = withAdminAuth(handleGetEditorCategories);