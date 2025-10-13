import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { withAdminAuth } from '@/middleware/adminAuth';
import cloudinary from '@/libs/cloudinary';

async function handleUploadMockupImage(request: NextRequest) {
  try {
    console.log('Upload request received');
    const data = await request.formData();
    const file = data.get('file') as File | null;

    if (!file) {
      console.log('No file in request');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB for Cloudinary)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.log('File too large:', file.size);
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique public_id for Cloudinary
    const publicId = `mockups/${uuidv4()}`;
    
    try {
      console.log('Uploading to Cloudinary...');
      
      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            public_id: publicId,
            folder: 'penci-mockups', // Organize in folder
            transformation: [
              { quality: 'auto:good' }, // Auto optimize quality
              { fetch_format: 'auto' }, // Auto format (webp, etc.)
            ],
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary error:', error);
              reject(error);
            } else {
              console.log('Cloudinary success:', result?.public_id);
              resolve(result);
            }
          }
        ).end(buffer);
      }) as any;

      console.log('Upload successful to Cloudinary:', uploadResult.public_id);
      return NextResponse.json({
        success: true,
        fileName: `${publicId}.${file.name.split('.').pop()}`,
        fileUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fileSize: uploadResult.bytes,
        fileType: file.type,
        width: uploadResult.width,
        height: uploadResult.height,
      });

    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError);
      return NextResponse.json(
        { error: 'Failed to upload to Cloudinary', details: String(cloudinaryError) },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Mockup image upload error:', error);
    
    // Return more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to upload mockup image',
        details: errorMessage,
        platform: 'cloudinary'
      },
      { status: 500 }
    );
  }
}

// Export with admin authentication
export const POST = withAdminAuth(handleUploadMockupImage);