import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { EditorTag } from '@/models/EditorTag';

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

// Helper function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// GET - Get all editor tags
async function handleGetEditorTags(
  request: NextRequest,
) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const display = searchParams.get('display') || 'all';
    const display_cate = searchParams.get('display_cate') || 'all';
    const is_cate = searchParams.get('is_cate') || 'all';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Search by name or slug
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by display
    if (display && display !== 'all') {
      query.display = Number.parseInt(display);
    }

    // Filter by display_cate
    if (display_cate && display_cate !== 'all') {
      query.display_cate = Number.parseInt(display_cate);
    }

    // Filter by is_cate
    if (is_cate && is_cate !== 'all') {
      query.is_cate = is_cate === '1';
    }

    // Get total count
    const totalCount = await EditorTag.countDocuments(query);

    // Get editor tags with pagination
    const editorTags = await EditorTag.find(query)
      .select('name slug display display_cate position is_cate img createdAt updatedAt')
      .sort({ position: 1, createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalCount / limit);

    const formattedEditorTags = editorTags.map((tag: any) => ({
      id: tag._id.toString(),
      name: tag.name,
      slug: tag.slug,
      display: tag.display,
      display_cate: tag.display_cate,
      position: tag.position,
      is_cate: tag.is_cate,
      img: tag.img,
      createdAt: formatDate(tag.createdAt),
      updatedAt: formatDate(tag.updatedAt),
    }));

    return NextResponse.json({
      editorTags: formattedEditorTags,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching editor tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST - Create new editor tag
async function handleCreateEditorTag(
  request: NextRequest,
) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, display, display_cate, position, is_cate, img } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Tên danh mục là bắt buộc' },
        { status: 400 },
      );
    }

    // Create slug from name
    const slug = createSlug(name.trim());

    // Check if slug already exists
    const existingTag = await EditorTag.findOne({ slug });
    if (existingTag) {
      return NextResponse.json(
        { error: 'Slug đã tồn tại, vui lòng chọn tên khác' },
        { status: 400 },
      );
    }

    // Create editor tag
    const editorTag = await EditorTag.create({
      name: name.trim(),
      slug,
      display: display || 0,
      display_cate: display_cate || 0,
      position: position || 0,
      is_cate: is_cate || false,
      img: img || null,
    });

    const formattedEditorTag = {
      id: (editorTag._id as any).toString(),
      name: editorTag.name,
      slug: editorTag.slug,
      display: editorTag.display,
      display_cate: editorTag.display_cate,
      position: editorTag.position,
      is_cate: editorTag.is_cate,
      img: editorTag.img,
      createdAt: formatDate(editorTag.createdAt),
      updatedAt: formatDate(editorTag.updatedAt),
    };

    return NextResponse.json({
      message: 'Tạo danh mục thành công',
      editorTag: formattedEditorTag,
    });
  } catch (error) {
    console.error('Error creating editor tag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const GET = withAdminAuth(handleGetEditorTags);
export const POST = withAdminAuth(handleCreateEditorTag);