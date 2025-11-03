import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { EditorTag } from '@/models/EditorTag';
import { EditorImage } from '@/models/EditorImage';
import { EditorQRCode } from '@/models/EditorQRCode';

// GET - Get multiselect options for editor tags and images
async function handleGetMultiselectOptions() {
  try {
    await connectDB();

    // Get all editor tags with display = 1 in one query
    const allEditorTags = await EditorTag.find({ display: 1 })
      .select('name slug is_cate display_cate')
      .sort({ position: 1, name: 1 })
      .lean();

    // Get all editor images with display = 1 in one query
    const allEditorImages = await EditorImage.find({ display: 1 })
      .select('name img img_thumb is_background')
      .sort({ name: 1 })
      .lean();

    // Get all editor QR codes with display = 1
    const allEditorQRCodes = await EditorQRCode.find({ display: 1 })
      .select('md5_id name img elements tags cate_dn')
      .sort({ name: 1 })
      .lean();

    // Filter tags in memory
    const templateTypes = allEditorTags.filter(tag => tag.is_cate === true);
    const collections = allEditorTags.filter(tag => tag.is_cate === false);
    const textStyles = allEditorTags.filter(tag => tag.is_cate === true && tag.display_cate === 1);

    // Filter images in memory
    const frames = allEditorImages.filter(image => image.is_background === 0);
    const images = allEditorImages.filter(image => image.is_background === 0);
    const qrCodes = allEditorQRCodes; // Use QR codes from EditorQRCode collection

    // Format the response
    const formatTags = (tags: any[]) => tags.map(tag => ({
      id: tag._id.toString(),
      name: tag.name,
      slug: tag.slug,
    }));

    const formatImages = (images: any[]) => images.map(image => ({
      id: image._id.toString(),
      name: image.name,
      img: image.img,
      img_thumb: image.img_thumb,
    }));

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
      template_types: formatTags(templateTypes),
      collections: formatTags(collections),
      text_styles: formatTags(textStyles),
      frames: formatImages(frames),
      images: formatImages(images),
      qr_codes: formatQRCodes(qrCodes),
    });
  } catch (error) {
    console.error('Error fetching multiselect options:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const GET = withAdminAuth(handleGetMultiselectOptions);