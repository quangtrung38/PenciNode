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

// GET - Get all categories
async function handleGetCategories(
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
    const totalCount = await (Product as any).countDocuments(query);

    // Get categories with pagination
    const categories = await (Product as any).find(query)
      .select('name position display img createdAt updatedAt')
      .sort({ position: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalCount / limit);

    const formattedCategories = categories.map((category: any) => ({
      id: category._id.toString(),
      name: category.name,
      position: category.position,
      display: category.display,
      img: category.img,
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
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST - Create new category
async function handleCreateCategory(
  request: NextRequest,
) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, position, display, img } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Tên danh mục là bắt buộc' },
        { status: 400 },
      );
    }

    // Create category
    const category = await (Product as any).create({
      name: name.trim(),
      position: position || 0,
      display: display || 1,
      img: img || null,
      // Set default values for other required fields
      slug: null,
      cate_name: null,
      tgia_cate: 0,
      tgia_product: 0,
      width: null,
      height: null,
      size_dv: null,
      select_size: 0,
      tags_template: null,
      tags_graphics: null,
      tags_textstyles: null,
      tags_frames: null,
      tags_images: null,
      tags_QR: null,
      image_bgov: null,
      select_bg: 0,
      select_ov: 0,
      page: 1,
      pageContext: null,
      select_page: 0,
      rateview: 0,
      select_image_sq: 0,
      image_size: null,
      image_quanlity: 0,
      display_home: 0,
      isShowPage: 0,
      enableBg: 0,
      enableBgmk: 0,
      outline: 0,
      svgContent: null,
      numPdt: 0,
      numCol: 0,
      sizeExport: 0,
      sizeExportClient: 0,
    });

    const formattedCategory = {
      id: category._id.toString(),
      name: category.name,
      position: category.position,
      display: category.display,
      img: category.img,
      createdAt: formatDate(category.createdAt),
      updatedAt: formatDate(category.updatedAt),
    };

    return NextResponse.json({
      message: 'Tạo danh mục thành công',
      category: formattedCategory,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const GET = withAdminAuth(handleGetCategories);
export const POST = withAdminAuth(handleCreateCategory);