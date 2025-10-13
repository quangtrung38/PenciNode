import type { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { Mockup, Product } from '@/models';

// Response caching headers
const CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=0, must-revalidate',
  'ETag': `W/"${Date.now()}"`,
};

// Helper function to format dates
const dateFormatCache = new Map<string, string>();
function formatDate(date: Date | null | string): string | null {
  if (!date) {
    return null;
  }

  const dateStr = date.toString();
  if (dateFormatCache.has(dateStr)) {
    return dateFormatCache.get(dateStr)!;
  }

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) {
      return null;
    }

    const formatted = d.toISOString().slice(0, 19).replace('T', ' ');
    dateFormatCache.set(dateStr, formatted);

    if (dateFormatCache.size > 1000) {
      const firstKey = dateFormatCache.keys().next().value;
      if (firstKey) {
        dateFormatCache.delete(firstKey);
      }
    }

    return formatted;
  } catch {
    return null;
  }
}

// GET - Fetch mockups with pagination and filters
async function handleGetMockups(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const product_id = searchParams.get('product_id') || '';
    const display = searchParams.get('display') || 'all';
    const isViewMain = searchParams.get('isViewMain') || 'all';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('limit') || '10')));
    const offset = (page - 1) * limit;

    // Build MongoDB query
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { background_color: { $regex: search, $options: 'i' } },
      ];
    }

    if (product_id && mongoose.Types.ObjectId.isValid(product_id)) {
      query.product_id = new mongoose.Types.ObjectId(product_id);
    }

    if (display && display !== 'all') {
      query.display = Number.parseInt(display);
    }

    if (isViewMain && isViewMain !== 'all') {
      query.isViewMain = Number.parseInt(isViewMain);
    }

    // Parallel queries for better performance
    const [rawMockups, totalCount] = await Promise.all([
      (Mockup as any)
        .find(query)
        .select('name jsoncol image product_id background_color size_img display isViewMain createdAt updatedAt')
        .populate('product_id', 'name')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Mockup.countDocuments(query),
    ]);

    // Format mockups for response
    const mockups = rawMockups.map((mockup: any) => ({
      id: mockup._id.toString(),
      name: mockup.name,
      jsoncol: mockup.jsoncol,
      image: mockup.image,
      product_id: mockup.product_id?._id?.toString(),
      product_name: mockup.product_id?.name || 'N/A',
      background_color: mockup.background_color,
      size_img: mockup.size_img,
      display: mockup.display,
      isViewMain: mockup.isViewMain,
      createdAt: formatDate(mockup.createdAt),
      updatedAt: formatDate(mockup.updatedAt),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      mockups,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    console.error('Error fetching mockups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST - Create a new mockup
async function handleCreateMockup(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      jsoncol,
      image,
      product_id,
      background_color,
      size_img,
      display,
      isViewMain,
    } = body;

    // Validation
    if (!name || !product_id) {
      return NextResponse.json(
        { error: 'Name and product_id are required' },
        { status: 400 },
      );
    }

    // Validate product_id format
    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      return NextResponse.json(
        { error: 'Invalid product_id format' },
        { status: 400 },
      );
    }

    // Check if product exists
    const productExists = await (Product as any).findById(product_id);
    if (!productExists) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 },
      );
    }

    // Create new mockup
    const rawNewMockup = await (Mockup as any).create({
      name: name.trim(),
      jsoncol: jsoncol || null,
      image: image || null,
      product_id: new mongoose.Types.ObjectId(product_id),
      background_color: background_color || null,
      size_img: size_img || null,
      display: display !== undefined ? Number.parseInt(display) : 0,
      isViewMain: isViewMain !== undefined ? Number.parseInt(isViewMain) : 0,
    });

    // Populate product info
    await rawNewMockup.populate('product_id', 'name');

    const newMockup = {
      id: rawNewMockup._id.toString(),
      name: rawNewMockup.name,
      jsoncol: rawNewMockup.jsoncol,
      image: rawNewMockup.image,
      product_id: rawNewMockup.product_id._id.toString(),
      product_name: rawNewMockup.product_id.name,
      background_color: rawNewMockup.background_color,
      size_img: rawNewMockup.size_img,
      display: rawNewMockup.display,
      isViewMain: rawNewMockup.isViewMain,
      createdAt: formatDate(rawNewMockup.createdAt),
      updatedAt: formatDate(rawNewMockup.updatedAt),
    };

    return NextResponse.json({
      message: 'Mockup created successfully',
      mockup: newMockup,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating mockup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// Export handlers with admin auth
export const GET = withAdminAuth(handleGetMockups);
export const POST = withAdminAuth(handleCreateMockup);
