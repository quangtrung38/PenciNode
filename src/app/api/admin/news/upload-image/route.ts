import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/adminAuth';

async function handleUploadTinyMCEImage(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Upload to Cloudinary via existing endpoint
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    // Use absolute URL for the upload endpoint
    const uploadUrl = new URL('/api/admin/editor-images/upload', request.url);
    
    const uploadResponse = await fetch(uploadUrl.toString(), {
      method: 'POST',
      body: uploadFormData,
      headers: {
        // Forward auth cookies
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      return NextResponse.json(
        { error: error.error || 'Failed to upload image' },
        { status: uploadResponse.status },
      );
    }

    const uploadResult = await uploadResponse.json();

    // Return in TinyMCE expected format
    return NextResponse.json({
      location: uploadResult.fileUrl,
    });
  } catch (error) {
    console.error('Error uploading TinyMCE image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withAdminAuth(handleUploadTinyMCEImage);
