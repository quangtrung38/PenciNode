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

// GET - Get single news by ID
async function handleGetNewsById(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const news = await News.findById(params.id).populate('category_id', 'name slug').lean();

    if (!news) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: (news as any)._id.toString(),
      title: (news as any).title,
      category_id: (news as any).category_id?._id?.toString() || null,
      category_name: (news as any).category_id?.name || null,
      summary: (news as any).summary,
      user_id: (news as any).user_id,
      tags: (news as any).tags,
      author: (news as any).author,
      image: (news as any).image,
      img: (news as any).img,
      slug: (news as any).slug,
      content: (news as any).content,
      display: (news as any).display,
      view_count: (news as any).view_count,
      enable: (news as any).enable,
      page_title: (news as any).page_title,
      page_keyword: (news as any).page_keyword,
      page_description: (news as any).page_description,
      createdAt: formatDate((news as any).createdAt),
      updatedAt: formatDate((news as any).updatedAt),
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update news
async function handleUpdateNews(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const body = await request.json();

    // Check if news exists
    const existingNews = await News.findById(params.id);
    if (!existingNews) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (body.title !== undefined) {
      updateData.title = body.title.trim();
      
      // Auto-generate slug if title changed
      if (body.slug === undefined || !body.slug) {
        const newSlug = generateSlug(body.title);
        // Check if new slug conflicts with other news (not this one)
        const slugExists = await News.findOne({
          slug: newSlug,
          _id: { $ne: params.id },
        });
        updateData.slug = slugExists ? `${newSlug}-${Date.now()}` : newSlug;
      }
    }

    if (body.slug !== undefined) updateData.slug = body.slug.trim();
    if (body.category_id !== undefined) updateData.category_id = body.category_id;
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.user_id !== undefined) updateData.user_id = body.user_id;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.author !== undefined) updateData.author = body.author;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.img !== undefined) updateData.img = body.img;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.display !== undefined) updateData.display = body.display;
    if (body.enable !== undefined) updateData.enable = body.enable;
    if (body.page_title !== undefined) updateData.page_title = body.page_title;
    if (body.page_keyword !== undefined) updateData.page_keyword = body.page_keyword;
    if (body.page_description !== undefined) updateData.page_description = body.page_description;

    // Update news
    const updatedNews = await News.findByIdAndUpdate(params.id, updateData, {
      new: true,
    }).populate('category_id', 'name slug').lean();

    return NextResponse.json({
      id: (updatedNews as any)._id.toString(),
      title: (updatedNews as any).title,
      category_id: (updatedNews as any).category_id?._id?.toString() || null,
      category_name: (updatedNews as any).category_id?.name || null,
      summary: (updatedNews as any).summary,
      user_id: (updatedNews as any).user_id,
      tags: (updatedNews as any).tags,
      author: (updatedNews as any).author,
      image: (updatedNews as any).image,
      img: (updatedNews as any).img,
      slug: (updatedNews as any).slug,
      display: (updatedNews as any).display,
      view_count: (updatedNews as any).view_count,
      enable: (updatedNews as any).enable,
      createdAt: formatDate((updatedNews as any).createdAt),
      updatedAt: formatDate((updatedNews as any).updatedAt),
    });
  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete news
async function handleDeleteNews(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const deletedNews = await News.findByIdAndDelete(params.id);

    if (!deletedNews) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'News deleted successfully' });
  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAdminAuth(handleGetNewsById);
export const PUT = withAdminAuth(handleUpdateNews);
export const DELETE = withAdminAuth(handleDeleteNews);
