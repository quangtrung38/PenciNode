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

// PUT - Update editor template
async function handleUpdateEditorTemplate(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();
    const { md5_id, name, slug, img, img_size, elements, tags, display, is_favorite, cate_dn, user_id, star, UrlOrderFile, is_confirm, approved_at, homePenci, position, folder_id } = body;

    // Find existing template
    const existingTemplate = await EditorTemplate.findById(id);
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template không tồn tại' },
        { status: 404 },
      );
    }

    // Validate name only if it's being updated
    if (name !== undefined && !name?.trim()) {
      return NextResponse.json(
        { error: 'Tên template là bắt buộc' },
        { status: 400 },
      );
    }

    // Use existing md5_id if not provided
    const finalMd5Id = md5_id?.trim() || existingTemplate.md5_id;

    // Check if md5_id already exists (excluding current template)
    if (md5_id && md5_id.trim() !== existingTemplate.md5_id) {
      const md5Exists = await EditorTemplate.findOne({ md5_id: md5_id.trim(), _id: { $ne: id } });
      if (md5Exists) {
        return NextResponse.json(
          { error: 'MD5 ID đã tồn tại' },
          { status: 400 },
        );
      }
    }

    // Generate slug if name is updated
    let finalSlug = slug;
    if (name !== undefined && slug === undefined) {
      finalSlug = name.trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    // Update editor template
    const updatedTemplate = await EditorTemplate.findByIdAndUpdate(
      id,
      {
        md5_id: finalMd5Id,
        name: name !== undefined ? name.trim() : existingTemplate.name,
        slug: finalSlug !== undefined ? finalSlug : existingTemplate.slug,
        img: img !== undefined ? img : existingTemplate.img,
        img_size: img_size !== undefined ? img_size : existingTemplate.img_size,
        elements: elements !== undefined ? elements : existingTemplate.elements,
        tags: tags !== undefined ? tags : existingTemplate.tags,
        display: display !== undefined ? display : existingTemplate.display,
        is_favorite: is_favorite !== undefined ? is_favorite : existingTemplate.is_favorite,
        cate_dn: cate_dn !== undefined ? cate_dn : existingTemplate.cate_dn,
        user_id: user_id !== undefined ? user_id : existingTemplate.user_id,
        star: star !== undefined ? star : existingTemplate.star,
        UrlOrderFile: UrlOrderFile !== undefined ? UrlOrderFile : existingTemplate.UrlOrderFile,
        is_confirm: is_confirm !== undefined ? is_confirm : existingTemplate.is_confirm,
        approved_at: approved_at !== undefined ? approved_at : existingTemplate.approved_at,
        homePenci: homePenci !== undefined ? homePenci : existingTemplate.homePenci,
        position: position !== undefined ? position : existingTemplate.position,
        folder_id: folder_id !== undefined ? folder_id : existingTemplate.folder_id,
      },
      { new: true },
    );

    if (!updatedTemplate) {
      return NextResponse.json(
        { error: 'Cập nhật template thất bại' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      id: updatedTemplate._id.toString(),
      folder_id: updatedTemplate.folder_id,
      md5_id: updatedTemplate.md5_id,
      name: updatedTemplate.name,
      slug: updatedTemplate.slug,
      img: updatedTemplate.img,
      img_size: updatedTemplate.img_size,
      elements: updatedTemplate.elements,
      tags: updatedTemplate.tags,
      display: updatedTemplate.display,
      is_favorite: updatedTemplate.is_favorite,
      cate_dn: updatedTemplate.cate_dn,
      user_id: updatedTemplate.user_id,
      star: updatedTemplate.star,
      views: updatedTemplate.views,
      img_download_count: updatedTemplate.img_download_count,
      pdf_download_count: updatedTemplate.pdf_download_count,
      use_count: updatedTemplate.use_count,
      homePenci: updatedTemplate.homePenci,
      position: updatedTemplate.position,
      is_confirm: updatedTemplate.is_confirm,
      createdAt: formatDate(updatedTemplate.createdAt),
      updatedAt: formatDate(updatedTemplate.updatedAt),
    });
  } catch (error) {
    console.error('Error updating editor template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE - Soft delete editor template
async function handleDeleteEditorTemplate(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const { id } = params;

    // Find existing template
    const existingTemplate = await EditorTemplate.findById(id);
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template không tồn tại' },
        { status: 404 },
      );
    }

    // Soft delete by setting is_delete to 1
    const deletedTemplate = await EditorTemplate.findByIdAndUpdate(
      id,
      { is_delete: 1 },
      { new: true },
    );

    if (!deletedTemplate) {
      return NextResponse.json(
        { error: 'Xóa template thất bại' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: 'Xóa template thành công',
      id: deletedTemplate._id.toString(),
    });
  } catch (error) {
    console.error('Error deleting editor template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const PUT = withAdminAuth(handleUpdateEditorTemplate);
export const DELETE = withAdminAuth(handleDeleteEditorTemplate);
