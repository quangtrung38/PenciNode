import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { EditorTemplate } from '@/models/EditorTemplate';

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

// GET - Get all editor templates
async function handleGetEditorTemplates(
  request: NextRequest,
) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const display = searchParams.get('display') || 'all';
    const cate_dn = searchParams.get('cate_dn') || 'all';
    const collection_id = searchParams.get('collection_id') || 'all';
    const user_id = searchParams.get('user_id') || 'all';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Build query
    const query: any = { is_delete: 0 }; // Only show non-deleted templates

    // Search by name or md5_id
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { md5_id: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by display
    if (display && display !== 'all') {
      query.display = Number.parseInt(display);
    }

    // Filter by cate_dn
    if (cate_dn && cate_dn !== 'all') {
      query.cate_dn = cate_dn;
    }

    // Filter by collection_id
    if (collection_id && collection_id !== 'all') {
      query.collection_id = collection_id;
    }

    // Filter by user_id
    if (user_id && user_id !== 'all') {
      query.user_id = Number.parseInt(user_id);
    }

    // Get total count
    const totalCount = await EditorTemplate.countDocuments(query);

    // Get editor templates with pagination
    const editorTemplates = await EditorTemplate.find(query)
      .select('folder_id md5_id name slug img img_size elements tags display is_favorite cate_dn collection_id user_id star views img_download_count pdf_download_count use_count homePenci position is_confirm createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalCount / limit);

    const formattedEditorTemplates = editorTemplates.map((template: any) => ({
      id: template._id.toString(),
      folder_id: template.folder_id,
      md5_id: template.md5_id,
      name: template.name,
      slug: template.slug,
      img: template.img,
      img_size: template.img_size,
      elements: template.elements,
      tags: template.tags,
      display: template.display,
      is_favorite: template.is_favorite,
      cate_dn: template.cate_dn,
      collection_id: template.collection_id,
      user_id: template.user_id,
      star: template.star,
      views: template.views,
      img_download_count: template.img_download_count,
      pdf_download_count: template.pdf_download_count,
      use_count: template.use_count,
      homePenci: template.homePenci,
      position: template.position,
      is_confirm: template.is_confirm,
      createdAt: formatDate(template.createdAt),
      updatedAt: formatDate(template.updatedAt),
    }));

    return NextResponse.json({
      editorTemplates: formattedEditorTemplates,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching editor templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST - Create new editor template
async function handleCreateEditorTemplate(
  request: NextRequest,
) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, img, cate_dn, display } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Tên template là bắt buộc' },
        { status: 400 },
      );
    }

    // Auto-generate MD5 ID if not provided
    let finalMd5Id = body.md5_id?.trim();
    if (!finalMd5Id) {
      const crypto = await import('crypto');
      const uniqueString = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      finalMd5Id = crypto.createHash('md5').update(uniqueString).digest('hex');
    } else {
      // Check if md5_id already exists
      const existingTemplate = await EditorTemplate.findOne({ md5_id: finalMd5Id });
      if (existingTemplate) {
        return NextResponse.json(
          { error: 'MD5 ID đã tồn tại' },
          { status: 400 },
        );
      }
    }

    // Generate slug from name
    const slug = name.trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Create new editor template
    const newTemplate = new EditorTemplate({
      md5_id: finalMd5Id,
      name: name.trim(),
      slug,
      img: img || null,
      display: display !== undefined ? display : 1,
      cate_dn: cate_dn !== undefined ? cate_dn : null,
      collection_id: body.collection_id || null,
      folder_id: body.folder_id || 0,
      img_size: body.img_size || null,
      elements: body.elements || null,
      tags: body.tags || null,
      is_favorite: body.is_favorite || 'N',
      is_delete: 0,
      isCustomer: body.isCustomer || 0,
      isEditView: body.isEditView || 0,
      isEditViewv2: body.isEditViewv2 || 0,
      user_id: body.user_id || 0,
      star: body.star || 0,
      UrlOrderFile: body.UrlOrderFile || null,
      is_confirm: body.is_confirm || 0,
      approved_at: body.approved_at || null,
      views: 0,
      img_download_count: 0,
      pdf_download_count: 0,
      use_count: 0,
      homePenci: body.homePenci || 0,
      position: body.position || null,
    });

    await newTemplate.save();

    return NextResponse.json({
      id: newTemplate._id.toString(),
      folder_id: newTemplate.folder_id,
      md5_id: newTemplate.md5_id,
      name: newTemplate.name,
      slug: newTemplate.slug,
      img: newTemplate.img,
      img_size: newTemplate.img_size,
      elements: newTemplate.elements,
      tags: newTemplate.tags,
      display: newTemplate.display,
      is_favorite: newTemplate.is_favorite,
      cate_dn: newTemplate.cate_dn,
      collection_id: newTemplate.collection_id,
      user_id: newTemplate.user_id,
      star: newTemplate.star,
      views: newTemplate.views,
      img_download_count: newTemplate.img_download_count,
      pdf_download_count: newTemplate.pdf_download_count,
      use_count: newTemplate.use_count,
      homePenci: newTemplate.homePenci,
      position: newTemplate.position,
      is_confirm: newTemplate.is_confirm,
      createdAt: formatDate(newTemplate.createdAt),
      updatedAt: formatDate(newTemplate.updatedAt),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating editor template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const GET = withAdminAuth(handleGetEditorTemplates);
export const POST = withAdminAuth(handleCreateEditorTemplate);
