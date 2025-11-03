import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/adminAuth';
import cloudinary from '@/libs/cloudinary';

async function uploadHandler(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'icon', 'image', 'penci', 'banner'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate type parameter
    const validTypes = ['icon', 'image', 'penci', 'banner'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: icon, image, penci, banner' },
        { status: 400 }
      );
    }

    // Validate file type based on type
    let allowedTypes: string[];
    let maxSize: number;
    let folder: string;

    switch (type) {
      case 'icon':
        allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        maxSize = 2 * 1024 * 1024; // 2MB for icons
        folder = 'product-icons';
        break;
      case 'image':
        allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        maxSize = 5 * 1024 * 1024; // 5MB for product images
        folder = 'product-images';
        break;
      case 'penci':
        allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        maxSize = 5 * 1024 * 1024; // 5MB for penci images
        folder = 'product-penci';
        break;
      case 'banner':
        allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        maxSize = 10 * 1024 * 1024; // 10MB for banner images
        folder = 'product-banners';
        break;
      default:
        allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        maxSize = 5 * 1024 * 1024;
        folder = 'products';
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type for ${type}. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size too large for ${type}. Maximum size is ${maxSize / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: type === 'icon' ? [] : [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      type,
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(uploadHandler);