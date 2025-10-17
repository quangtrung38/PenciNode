import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { EditorImage } from '@/models/EditorImage';

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

// GET - Fetch editor images with pagination and filters
async function handleGetEditorImages(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const display = searchParams.get('display') || 'all';
    const is_background = searchParams.get('is_background') || 'all';
    const category_id = searchParams.get('category_id') || '';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Build MongoDB query
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { group_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category_id) {
      query.category_id = category_id;
    }

    if (display && display !== 'all') {
      query.display = Number.parseInt(display);
    }

    if (is_background && is_background !== 'all') {
      query.is_background = Number.parseInt(is_background);
    }

    // Parallel queries for better performance
    const [rawImages, totalCount] = await Promise.all([
      (EditorImage as any)
        .find(query)
        .select('name parent_id category_id img img_thumb img_process display group_img group_imgThumb group_name is_background description user_id createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      EditorImage.countDocuments(query),
    ]);

    // Format images for response
    const images = rawImages.map((image: any) => ({
      id: image._id.toString(),
      name: image.name,
      parent_id: image.parent_id,
      category_id: image.category_id,
      img: image.img,
      img_thumb: image.img_thumb,
      img_process: image.img_process,
      display: image.display,
      group_img: image.group_img,
      group_imgThumb: image.group_imgThumb,
      group_name: image.group_name,
      is_background: image.is_background,
      description: image.description,
      user_id: image.user_id,
      createdAt: formatDate(image.createdAt),
      updatedAt: formatDate(image.updatedAt),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        success: true,
        images,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error('Error fetching editor images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST - Create new editor image
async function handleCreateEditorImage(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    if (!body.img || !body.img_thumb) {
      return NextResponse.json(
        { error: 'Main image and thumbnail are required' },
        { status: 400 },
      );
    }

    // Create new editor image
    const newImage = new EditorImage({
      name: body.name || null,
      parent_id: body.parent_id || 0,
      category_id: body.category_id || null,
      img: body.img,
      img_thumb: body.img_thumb,
      img_process: body.img_process || null,
      display: body.display || 0,
      group_img: body.group_img || null,
      group_imgThumb: body.group_imgThumb || null,
      group_name: body.group_name || null,
      is_background: body.is_background || 0,
      description: body.description || null,
      user_id: body.user_id || null,
    });

    const savedImage = await newImage.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Editor image created successfully',
        image: {
          id: (savedImage._id as any).toString(),
          name: savedImage.name,
          parent_id: savedImage.parent_id,
          category_id: savedImage.category_id,
          img: savedImage.img,
          img_thumb: savedImage.img_thumb,
          img_process: savedImage.img_process,
          display: savedImage.display,
          group_img: savedImage.group_img,
          group_imgThumb: savedImage.group_imgThumb,
          group_name: savedImage.group_name,
          is_background: savedImage.is_background,
          description: savedImage.description,
          user_id: savedImage.user_id,
          createdAt: formatDate(savedImage.createdAt),
          updatedAt: formatDate(savedImage.updatedAt),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating editor image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const GET = withAdminAuth(handleGetEditorImages);
export const POST = withAdminAuth(handleCreateEditorImage);