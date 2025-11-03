import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { Product } from '@/models/Product';

// Helper function to parse tag fields that might be JSON arrays or comma-separated strings
function parseTagField(value: string | null | undefined): string[] {
  if (!value) return [];
  
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    // If it's not an array, treat as single value
    return [parsed];
  } catch {
    // If JSON parsing fails, treat as comma-separated string
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }
}

// Allowed toggle fields for quick updates
const ALLOWED_TOGGLE_FIELDS = new Set([
  'display',
  'display_home',
  'isShowPage',
  'homePenci',
  'isSocical',
  'outline',
]);

async function handleGet(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
    }

    const product = await (Product as any).findById(id)
      .populate('category_id', 'name')
      .lean();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }



    const formattedProduct = {
      id: product._id.toString(),
      productName: product.name,
      tgiaCategory: product.tgia_cate?.toString() || '',
      product: product.tgia_product?.toString() || '',
      category: product.category_id?._id?.toString() || '',
      selectSize: product.select_size === 1,
      width: product.width?.toString() || '',
      height: product.height?.toString() || '',
      sizeDv: product.size_dv || 'px',
      selectImageSq: product.select_image_sq === 1,
      imageSizeW: product.image_size ? JSON.parse(product.image_size).width?.toString() || '' : '',
      imageSizeH: product.image_size ? JSON.parse(product.image_size).height?.toString() || '' : '',
      imageQuality: product.image_quanlity?.toString() || '',
      showMockup: product.enableBgmk === 1,
      chooseMainMockup: product.select_bg === 1,
      outline: product.outline?.toString() || '18',
      sizeExport: product.sizeExport?.toString() || '',
      textBanner: product.textBanner || '',
      position: product.position?.toString() || '',
      numProducts: product.numPdt?.toString() || '',
      numColumns: product.numCol?.toString() || '',
      showProduct: product.display === 1,
      canAddPages: product.select_page === 1,
      pageContext: product.pageContext ? JSON.parse(product.pageContext) : [{ id: 1, name: '', img: '' }],
      templateTypes: parseTagField(product.tags_template),
      collections: parseTagField(product.tags_graphics),
      textStyles: parseTagField(product.tags_textstyles),
      frames: parseTagField(product.tags_frames),
      images: parseTagField(product.tags_images),
      qrCodes: parseTagField(product.tags_QR),
      // Image URLs
      productIcon: product.svgContent || '',
      productImage: product.img || '',
      penciImage: product.imgPenci || '',
      bannerImage: product.imgBannerPenci || '',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return NextResponse.json({ product: formattedProduct });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

async function handlePut(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
    }

    const body = await request.json();

    const {
      productName,
      tgiaCategory,
      product: productId,
      category,
      selectSize,
      width,
      height,
      sizeDv,
      selectImageSq,
      imageSizeW,
      imageSizeH,
      imageQuality,
      showMockup,
      chooseMainMockup,
      outline,
      sizeExport,
      position,
      numProducts,
      numColumns,
      showProduct,
      canAddPages,
      pageContext,
      textBanner,
      templateTypes,
      collections,
      textStyles,
      frames,
      images,
      qrCodes,
      // Image URLs
      productIcon,
      productImage,
      penciImage,
      bannerImage,
    } = body;

    // Validate required fields
    if (!productName?.trim()) {
      return NextResponse.json(
        { error: 'Tên sản phẩm là bắt buộc' },
        { status: 400 },
      );
    }

    // Create slug from product name
    const slug = productName.trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Prepare image_size as JSON string if both dimensions are provided
    let image_size = null;
    if (imageSizeW && imageSizeH) {
      image_size = JSON.stringify({
        width: parseInt(imageSizeW),
        height: parseInt(imageSizeH),
      });
    }

    // Prepare pageContext as JSON string
    const pageContextJson = pageContext ? JSON.stringify(pageContext) : null;

    // Update product
    const updateData: any = {
      name: productName.trim(),
      slug,
      category_id: category || null,
      tgia_cate: tgiaCategory ? parseInt(tgiaCategory) : 0,
      tgia_product: productId ? parseInt(productId) : 0,
      width: width ? parseInt(width) : null,
      height: height ? parseInt(height) : null,
      size_dv: sizeDv || null,
      select_size: selectSize ? 1 : 0,
      select_image_sq: selectImageSq ? 1 : 0,
      image_size,
      image_quanlity: imageQuality ? parseInt(imageQuality) : 0,
      display: showProduct ? 1 : 0,
      enableBgmk: showMockup ? 1 : 0,
      select_bg: chooseMainMockup ? 1 : 0,
      outline: outline ? parseInt(outline) : 18,
      position: position ? parseInt(position) : 0,
      numPdt: numProducts ? parseInt(numProducts) : 0,
      numCol: numColumns ? parseInt(numColumns) : 0,
      sizeExport: sizeExport ? parseInt(sizeExport) : 0,
      pageContext: pageContextJson,
      select_page: canAddPages ? 1 : 0,
      textBanner: textBanner || null,
      tags_template: templateTypes?.length ? JSON.stringify(templateTypes) : null,
      tags_graphics: collections?.length ? JSON.stringify(collections) : null,
      tags_textstyles: textStyles?.length ? JSON.stringify(textStyles) : null,
      tags_frames: frames?.length ? JSON.stringify(frames) : null,
      tags_images: images?.length ? JSON.stringify(images) : null,
      tags_QR: qrCodes?.length ? JSON.stringify(qrCodes.map((qr: any) => qr.id || qr)) : null,
      // Update image URLs
      svgContent: productIcon || null,
      img: productImage || null,
      imgPenci: penciImage || null,
      imgBannerPenci: bannerImage || null,
    };

    const product = await (Product as any).findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    ).populate('category_id', 'name');

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update image fields separately to ensure they are saved
    if (penciImage !== undefined || bannerImage !== undefined) {
      const imageUpdate: any = {};
      if (penciImage !== undefined) imageUpdate.imgPenci = penciImage || null;
      if (bannerImage !== undefined) imageUpdate.imgBannerPenci = bannerImage || null;

      await (Product as any).findByIdAndUpdate(
        id,
        { $set: imageUpdate },
        { new: true }
      );
    }

    // Fetch updated product again
    const updatedProduct = await (Product as any).findById(id)
      .populate('category_id', 'name')
      .lean();



    const formattedProduct = {
      id: updatedProduct._id.toString(),
      name: updatedProduct.name,
      slug: updatedProduct.slug,
      category: updatedProduct.category_id?.name || null,
      category_id: updatedProduct.category_id?._id?.toString() || null,
      tgia_cate: updatedProduct.tgia_cate,
      tgia_product: updatedProduct.tgia_product,
      width: updatedProduct.width,
      height: updatedProduct.height,
      size_dv: updatedProduct.size_dv,
      select_size: updatedProduct.select_size,
      select_image_sq: updatedProduct.select_image_sq,
      image_size: updatedProduct.image_size,
      image_quanlity: updatedProduct.image_quanlity,
      display: updatedProduct.display,
      enableBgmk: updatedProduct.enableBgmk,
      select_bg: updatedProduct.select_bg,
      outline: updatedProduct.outline,
      position: updatedProduct.position,
      numPdt: updatedProduct.numPdt,
      numCol: updatedProduct.numCol,
      sizeExport: updatedProduct.sizeExport,
      textBanner: updatedProduct.textBanner,
      pageContext: updatedProduct.pageContext,
      select_page: updatedProduct.select_page,
      tags_template: updatedProduct.tags_template,
      tags_graphics: updatedProduct.tags_graphics,
      tags_textstyles: updatedProduct.tags_textstyles,
      tags_frames: updatedProduct.tags_frames,
      tags_images: updatedProduct.tags_images,
      tags_QR: updatedProduct.tags_QR,
      qrCodes: parseTagField(updatedProduct.tags_QR),
      // Image URLs
      productIcon: updatedProduct.svgContent,
      productImage: updatedProduct.img,
      penciImage: updatedProduct.imgPenci,
      bannerImage: updatedProduct.imgBannerPenci,
      createdAt: updatedProduct.createdAt,
      updatedAt: updatedProduct.updatedAt,
    };

    return NextResponse.json({
      message: 'Cập nhật sản phẩm thành công',
      product: formattedProduct,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
};

async function handlePatch(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
    }

    const body = await request.json();

    // body should be like { field: 'display', value: 1 }
    // or multiple fields { display: 1, enableBg: 0 }

    const update: any = {};

    for (const key of Object.keys(body)) {
      if (!ALLOWED_TOGGLE_FIELDS.has(key)) continue;
      const raw = body[key];
      // normalize values: accept boolean, '0'|'1', 0|1
      const val = typeof raw === 'boolean' ? (raw ? 1 : 0) : Number(raw);
      update[key] = val === 1 ? 1 : 0;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid toggle fields provided' }, { status: 400 });
    }

    const product = await (Product as any).findByIdAndUpdate(
      id,
      { $set: update },
      { new: true },
    ).lean();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Updated', product });
  } catch (error) {
    console.error('Error updating product toggles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleDelete(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
    }

    const product = await (Product as any).findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAdminAuth(handleGet);
export const PATCH = withAdminAuth(handlePatch);
export const PUT = withAdminAuth(handlePut);
export const DELETE = withAdminAuth(handleDelete);
