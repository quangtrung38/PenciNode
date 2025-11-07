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

// GET - Get all editor QR codes
async function handleGetEditorQRCodes(
  request: NextRequest,
) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const display = searchParams.get('display') || 'all';
    const cate_dn = searchParams.get('cate_dn') || 'all';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Search by name or md5_id
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { md5_id: { $regex: search, $options: 'i' } },
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

    // Get total count
    const totalCount = await EditorQRCode.countDocuments(query);

    // Get editor QR codes with pagination
    const editorQRCodes = await EditorQRCode.find(query)
      .select('md5_id name img elements tags display cate_dn user_id createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalCount / limit);

    const formattedEditorQRCodes = editorQRCodes.map((qr: any) => ({
      id: qr._id.toString(),
      md5_id: qr.md5_id,
      name: qr.name,
      img: qr.img,
      elements: qr.elements,
      tags: qr.tags,
      display: qr.display,
      cate_dn: qr.cate_dn,
      user_id: qr.user_id,
      createdAt: formatDate(qr.createdAt),
      updatedAt: formatDate(qr.updatedAt),
    }));

    return NextResponse.json({
      editorQRCodes: formattedEditorQRCodes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching editor QR codes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST - Create new editor QR code
async function handleCreateEditorQRCode(
  request: NextRequest,
) {
  try {
    await connectDB();

    const body = await request.json();
    const { md5_id, name, img, elements, tags, display, cate_dn, user_id } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Tên QR code là bắt buộc' },
        { status: 400 },
      );
    }

    // Generate MD5 ID if not provided
    let finalMd5Id = md5_id?.trim();
    if (!finalMd5Id) {
      // Generate a unique MD5 ID based on timestamp and random string
      const crypto = await import('crypto');
      const uniqueString = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      finalMd5Id = crypto.createHash('md5').update(uniqueString).digest('hex');
    } else {
      // Check if md5_id already exists
      const existingQR = await EditorQRCode.findOne({ md5_id: finalMd5Id });
      if (existingQR) {
        return NextResponse.json(
          { error: 'MD5 ID đã tồn tại' },
          { status: 400 },
        );
      }
    }

    // Create editor QR code
    const editorQRCode = await EditorQRCode.create({
      md5_id: finalMd5Id,
      name: name.trim(),
      img: img || null,
      elements: elements || null,
      tags: tags || null,
      display: display ?? 1,
      cate_dn: cate_dn || '0',
      user_id: user_id || 0,
    });

    const formattedEditorQRCode = {
      id: (editorQRCode._id as any).toString(),
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
      message: 'Tạo QR code thành công',
      editorQRCode: formattedEditorQRCode,
    });
  } catch (error) {
    console.error('Error creating editor QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const GET = withAdminAuth(handleGetEditorQRCodes);
export const POST = withAdminAuth(handleCreateEditorQRCode);