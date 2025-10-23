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

// GET - Get all categories products
async function handleGetCategoriesProducts(
  request: NextRequest,
) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const display = searchParams.get('display') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

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

    // Get total count
    const totalCount = await CategoryProduct.countDocuments(query);

    // Get categories with pagination
    const categories = await CategoryProduct.find(query)
      .select('name slug img imgIcon position display displayTgia displayPenci createdAt updatedAt')
      .sort({ position: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalCount / limit);

    const formattedCategories = categories.map((category: any) => ({
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
    }));

    return NextResponse.json({
      categories: formattedCategories,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching categories products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST - Create new category product
async function handleCreateCategoryProduct(
  request: NextRequest,
) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, slug, img, imgIcon, position, display, displayTgia, displayPenci } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Tên danh mục là bắt buộc' },
        { status: 400 },
      );
    }

    // Create category
    const category = await CategoryProduct.create({
      name: name.trim(),
      slug: slug || null,
      img: img || null,
      imgIcon: imgIcon || null,
      position: position || 0,
      display: display ?? 0,
      displayTgia: displayTgia ?? 0,
      displayPenci: displayPenci ?? 0,
    });

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
      message: 'Tạo danh mục sản phẩm thành công',
      category: formattedCategory,
    });
  } catch (error) {
    console.error('Error creating category product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const GET = withAdminAuth(handleGetCategoriesProducts);
export const POST = withAdminAuth(handleCreateCategoryProduct);