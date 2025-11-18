import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { News } from '@/models/News';

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

// Helper function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// GET - Get all news
async function handleGetNews(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const display = searchParams.get('display') || 'all';
    const enable = searchParams.get('enable') || 'all';
    const category_id = searchParams.get('category_id') || 'all';
    const user_id = searchParams.get('user_id') || 'all';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Search by title, slug, or tags
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by display
    if (display && display !== 'all') {
      query.display = Number.parseInt(display);
    }

    // Filter by enable
    if (enable && enable !== 'all') {
      query.enable = Number.parseInt(enable);
    }

    // Filter by category_id
    if (category_id && category_id !== 'all') {
      query.category_id = category_id;
    }

    // Filter by user_id
    if (user_id && user_id !== 'all') {
      query.user_id = Number.parseInt(user_id);
    }

    // Get total count
    const totalCount = await News.countDocuments(query);

    // Get news with pagination and populate category
    const news = await News.find(query)
      .select('title category_id summary user_id tags author image img slug display view_count enable createdAt updatedAt')
      .populate('category_id', 'name slug')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalCount / limit);

    const formattedNews = news.map((item: any) => ({
      id: item._id.toString(),
      title: item.title,
      category_id: item.category_id?._id?.toString() || null,
      category_name: item.category_id?.name || null,
      category_slug: item.category_id?.slug || null,
      summary: item.summary,
      user_id: item.user_id,
      tags: item.tags,
      author: item.author,
      image: item.image,
      img: item.img,
      slug: item.slug,
      display: item.display,
      view_count: item.view_count,
      enable: item.enable,
      createdAt: formatDate(item.createdAt),
      updatedAt: formatDate(item.updatedAt),
    }));

    return NextResponse.json({
      news: formattedNews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new news
async function handleCreateNews(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { title, content } = body;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Tiêu đề là bắt buộc' }, { status: 400 });
    }

    // Generate slug from title
    let slug = body.slug?.trim() || generateSlug(title);

    // Check if slug exists
    const existingNews = await News.findOne({ slug });
    if (existingNews) {
      // Add random suffix to make slug unique
      slug = `${slug}-${Date.now()}`;
    }

    // Create new news
    const newNews = new News({
      title: title.trim(),
      slug,
      category_id: body.category_id || null,
      summary: body.summary || null,
      user_id: body.user_id || null,
      tags: body.tags || null,
      author: body.author || null,
      image: body.image || null,
      img: body.img || null,
      content: content || null,
      display: body.display !== undefined ? body.display : 0,
      enable: body.enable !== undefined ? body.enable : 1,
      view_count: 0,
      page_title: body.page_title || null,
      page_keyword: body.page_keyword || null,
      page_description: body.page_description || null,
    });

    await newNews.save();

    return NextResponse.json(
      {
        id: (newNews._id as any).toString(),
        title: newNews.title,
        category_id: newNews.category_id,
        summary: newNews.summary,
        user_id: newNews.user_id,
        tags: newNews.tags,
        author: newNews.author,
        image: newNews.image,
        img: newNews.img,
        slug: newNews.slug,
        display: newNews.display,
        view_count: newNews.view_count,
        enable: newNews.enable,
        createdAt: formatDate(newNews.createdAt),
        updatedAt: formatDate(newNews.updatedAt),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAdminAuth(handleGetNews);
export const POST = withAdminAuth(handleCreateNews);
