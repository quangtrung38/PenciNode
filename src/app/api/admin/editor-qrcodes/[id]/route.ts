import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { EditorQRCode } from '@/models/EditorQRCode';

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

// GET - Get single editor QR code
async function handleGetEditorQRCode(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const { id } = params;

    const editorQRCode = await EditorQRCode.findById(id)
      .select('md5_id name img elements tags display cate_dn user_id createdAt updatedAt')
      .lean();

    if (!editorQRCode) {
      return NextResponse.json(
        { error: 'QR code không tồn tại' },
        { status: 404 },
      );
    }

    const formattedEditorQRCode = {
      id: editorQRCode._id.toString(),
      md5_id: editorQRCode.md5_id,
      name: editorQRCode.name,
      img: editorQRCode.img,
      elements: editorQRCode.elements,
      tags: editorQRCode.tags,
      display: editorQRCode.display,
      cate_dn: editorQRCode.cate_dn,
      user_id: editorQRCode.user_id,
      createdAt: formatDate(editorQRCode.createdAt),
      updatedAt: formatDate(editorQRCode.updatedAt),
    };

    return NextResponse.json({
      editorQRCode: formattedEditorQRCode,
    });
  } catch (error) {
    console.error('Error fetching editor QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// PUT - Update editor QR code
async function handleUpdateEditorQRCode(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();
    const { md5_id, name, img, elements, tags, display, cate_dn, user_id } = body;

    // Find existing QR code
    const existingQR = await EditorQRCode.findById(id);
    if (!existingQR) {
      return NextResponse.json(
        { error: 'QR code không tồn tại' },
        { status: 404 },
      );
    }

    // Validate name only if it's being updated
    if (name !== undefined && !name?.trim()) {
      return NextResponse.json(
        { error: 'Tên QR code là bắt buộc' },
        { status: 400 },
      );
    }

    // Use existing md5_id if not provided
    const finalMd5Id = md5_id?.trim() || existingQR.md5_id;

    // Check if md5_id already exists (excluding current QR code)
    if (md5_id && md5_id.trim() !== existingQR.md5_id) {
      const md5Exists = await EditorQRCode.findOne({ md5_id: md5_id.trim(), _id: { $ne: id } });
      if (md5Exists) {
        return NextResponse.json(
          { error: 'MD5 ID đã tồn tại' },
          { status: 400 },
        );
      }
    }

    // Update editor QR code
    const updatedQR = await EditorQRCode.findByIdAndUpdate(
      id,
      {
        md5_id: finalMd5Id,
        name: name !== undefined ? name.trim() : existingQR.name,
        img: img !== undefined ? img : existingQR.img,
        elements: elements !== undefined ? elements : existingQR.elements,
        tags: tags !== undefined ? tags : existingQR.tags,
        display: display !== undefined ? display : existingQR.display,
        cate_dn: cate_dn !== undefined ? cate_dn : existingQR.cate_dn,
        user_id: user_id !== undefined ? user_id : existingQR.user_id,
      },
      { new: true },
    );

    if (!updatedQR) {
      return NextResponse.json(
        { error: 'Không thể cập nhật QR code' },
        { status: 500 },
      );
    }

    const formattedEditorQRCode = {
      id: (updatedQR._id as any).toString(),
      md5_id: updatedQR.md5_id,
      name: updatedQR.name,
      img: updatedQR.img,
      elements: updatedQR.elements,
      tags: updatedQR.tags,
      display: updatedQR.display,
      cate_dn: updatedQR.cate_dn,
      user_id: updatedQR.user_id,
      createdAt: formatDate(updatedQR.createdAt),
      updatedAt: formatDate(updatedQR.updatedAt),
    };

    return NextResponse.json({
      message: 'Cập nhật QR code thành công',
      editorQRCode: formattedEditorQRCode,
    });
  } catch (error) {
    console.error('Error updating editor QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE - Delete editor QR code
async function handleDeleteEditorQRCode(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const { id } = params;

    // Find and delete the QR code
    const deletedQR = await EditorQRCode.findByIdAndDelete(id);

    if (!deletedQR) {
      return NextResponse.json(
        { error: 'QR code không tồn tại' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: 'Xóa QR code thành công',
    });
  } catch (error) {
    console.error('Error deleting editor QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const GET = withAdminAuth(handleGetEditorQRCode);
export const PUT = withAdminAuth(handleUpdateEditorQRCode);
export const DELETE = withAdminAuth(handleDeleteEditorQRCode);