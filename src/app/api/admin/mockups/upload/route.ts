import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { withAdminAuth } from '@/middleware/adminAuth';

async function handleUploadMockupImage(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads/mockups
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'mockups', fileName);
    await writeFile(uploadPath, buffer);

    // Return the API URL for serving the file
    const fileUrl = `/api/uploads/mockups/${fileName}`;

    return NextResponse.json({
      success: true,
      fileName,
      fileUrl,
      fileSize: file.size,
      fileType: file.type,
    });

  } catch (error) {
    console.error('Mockup image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload mockup image' },
      { status: 500 }
    );
  }
}

// Export with admin authentication
export const POST = withAdminAuth(handleUploadMockupImage);