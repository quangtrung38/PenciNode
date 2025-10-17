import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { withAdminAuth } from '@/middleware/adminAuth';
import cloudinary from '@/libs/cloudinary';

async function handleUploadEditorImage(request: NextRequest) {
  try {
    console.log('Upload editor image request received');
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
    const publicId = `editor-images/${uuidv4()}`;

    console.log('Uploading to Cloudinary with public_id:', publicId);

    // Upload to Cloudinary with optimizations
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder: 'penci-editor-images',
          resource_type: 'image',
          quality: 'auto:good',
          fetch_format: 'auto',
          width: 1200,
          height: 1200,
          crop: 'limit',
        },
        (error: any, result: any) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', result?.secure_url);
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });

    // Generate thumbnail
    const thumbnailPublicId = `editor-images/thumbs/${uuidv4()}`;
    console.log('Generating thumbnail with public_id:', thumbnailPublicId);

    const thumbnailResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: thumbnailPublicId,
          folder: 'penci-editor-images/thumbs',
          resource_type: 'image',
          quality: 'auto:good',
          fetch_format: 'auto',
          width: 300,
          height: 300,
          crop: 'fill',
          gravity: 'auto',
        },
        (error: any, result: any) => {
          if (error) {
            console.error('Thumbnail generation error:', error);
            reject(error);
          } else {
            console.log('Thumbnail generation success:', result?.secure_url);
            resolve(result);
          }
        }
      ).end(buffer);
    });

    // Return success response
    const response = {
      success: true,
      fileName: `${publicId}.${file.name.split('.').pop()}`,
      fileUrl: uploadResult.secure_url,
      thumbnailUrl: thumbnailResult.secure_url,
      publicId: uploadResult.public_id,
      thumbnailPublicId: thumbnailResult.public_id,
      fileSize: file.size,
      fileType: file.type,
      width: uploadResult.width,
      height: uploadResult.height,
    };

    console.log('Upload response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload editor image' },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(handleUploadEditorImage);