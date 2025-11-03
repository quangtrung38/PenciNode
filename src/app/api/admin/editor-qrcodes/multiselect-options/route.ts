import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { EditorQRCode } from '@/models/EditorQRCode';

// GET - Get multiselect options for editor QR codes
async function handleGetMultiselectOptions() {
  try {
    await connectDB();

    // Get all editor QR codes with display = 1
    const allEditorQRCodes = await EditorQRCode.find({ display: 1 })
      .select('md5_id name img elements tags cate_dn')
      .sort({ name: 1 })
      .lean();

    // Format the response
    const formatQRCodes = (qrcodes: any[]) => qrcodes.map(qr => ({
      id: qr._id.toString(),
      md5_id: qr.md5_id,
      name: qr.name,
      img: qr.img,
      elements: qr.elements,
      tags: qr.tags,
      cate_dn: qr.cate_dn,
    }));

    return NextResponse.json({
      qr_codes: formatQRCodes(allEditorQRCodes),
    });
  } catch (error) {
    console.error('Error fetching QR code multiselect options:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const GET = withAdminAuth(handleGetMultiselectOptions);