import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { Product } from '@/models/Product';
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

// GET - Get all products
async function handleGetProducts(
  request: NextRequest,
) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const display = searchParams.get('display') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query: any = {};

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Filter by category
    if (categoryId && categoryId !== 'all') {
      query.category_id = categoryId;
    }

    // Filter by display
    if (display !== 'all') {
      query.display = parseInt(display);
    }

    // Get total count
    const totalCount = await Product.countDocuments(query);

    // Get products with pagination and populate category
    const products = await (Product as any).find(query)
      .populate('category_id', 'name')
      .select('name img svgContent imgPenci imgBannerPenci category_id display display_home isShowPage homePenci isSocical enableBg enableBgmk outline position createdAt updatedAt')
      .sort({ position: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalCount / limit);

    const formattedProducts = products.map((product: any) => ({
      id: product._id.toString(),
      tgia_product: product.tgia_product,
      name: product.name,
      img: product.img,
      svgContent: product.svgContent,
      imgPenci: product.imgPenci,
      imgBannerPenci: product.imgBannerPenci,
      category: product.category_id?.name || null,
      category_id: product.category_id?._id?.toString() || null,
      display: product.display,
      display_home: product.display_home,
      isShowPage: product.isShowPage,
      homePenci: product.homePenci,
      isSocical: product.isSocical,
      enableBg: product.enableBg,
      enableBgmk: product.enableBgmk,
      outline: product.outline,
      position: product.position,
      createdAt: formatDate(product.createdAt),
      updatedAt: formatDate(product.updatedAt),
    }));

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST - Create new product
async function handleCreateProduct(
  request: NextRequest,
) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      productName,
      tgiaCategory,
      product,
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
      templateTypes,
      collections,
      textStyles,
      frames,
      images,
      qrCodes,
      // Image URLs instead of files
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

    // Create product with all form fields
    const productData = await (Product as any).create({
      name: productName.trim(),
      slug,
      category_id: category || null,
      tgia_cate: tgiaCategory ? parseInt(tgiaCategory) : 0,
      tgia_product: product ? parseInt(product) : 0,
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
      tags_template: templateTypes?.length ? JSON.stringify(templateTypes) : null,
      tags_graphics: collections?.length ? JSON.stringify(collections) : null,
      tags_textstyles: textStyles?.length ? JSON.stringify(textStyles) : null,
      tags_frames: frames?.length ? JSON.stringify(frames) : null,
      tags_images: images?.length ? JSON.stringify(images) : null,
      tags_QR: qrCodes?.length ? JSON.stringify(qrCodes.map((qr: any) => qr.id || qr)) : null,
      // Map image URLs to database fields
      svgContent: productIcon || null,
      img: productImage || null,
      imgPenci: penciImage || null,
      imgBannerPenci: bannerImage || null,
      // Default values for other fields
      cate_name: null,
      image_bgov: null,
      select_ov: 0,
      page: 1,
      rateview: 0,
      display_home: 0,
      isShowPage: 0,
      homePenci: 0,
      isSocical: 0,
      enableBg: 0,
      sizeExportClient: 0,
    });

    // Populate category for response
    await productData.populate('category_id', 'name');

    // Parse QR code IDs and fetch QR code data for response
    let qrCodesData: any[] = [];
    if (productData.tags_QR) {
      try {
        const qrCodeIds = JSON.parse(productData.tags_QR);
        if (qrCodeIds.length > 0) {
          const qrCodes = await EditorQRCode.find({
            _id: { $in: qrCodeIds },
            display: 1
          })
            .select('md5_id name img')
            .lean();
          qrCodesData = qrCodes.map(qr => ({
            id: qr._id.toString(),
            md5_id: qr.md5_id,
            name: qr.name,
            img: qr.img,
          }));
        }
      } catch (error) {
        console.warn('Error fetching QR codes for new product:', error);
      }
    }

    const formattedProduct = {
      id: productData._id.toString(),
      name: productData.name,
      slug: productData.slug,
      category: productData.category_id?.name || null,
      category_id: productData.category_id?._id?.toString() || null,
      tgia_cate: productData.tgia_cate,
      tgia_product: productData.tgia_product,
      width: productData.width,
      height: productData.height,
      size_dv: productData.size_dv,
      select_size: productData.select_size,
      select_image_sq: productData.select_image_sq,
      image_size: productData.image_size,
      image_quanlity: productData.image_quanlity,
      display: productData.display,
      enableBgmk: productData.enableBgmk,
      select_bg: productData.select_bg,
      outline: productData.outline,
      position: productData.position,
      numPdt: productData.numPdt,
      numCol: productData.numCol,
      sizeExport: productData.sizeExport,
      pageContext: productData.pageContext,
      select_page: productData.select_page,
      tags_template: productData.tags_template,
      tags_graphics: productData.tags_graphics,
      tags_textstyles: productData.tags_textstyles,
      tags_frames: productData.tags_frames,
      tags_images: productData.tags_images,
      tags_QR: productData.tags_QR,
      qrCodes: qrCodesData,
      createdAt: formatDate(productData.createdAt),
      updatedAt: formatDate(productData.updatedAt),
    };

    return NextResponse.json({
      message: 'Tạo sản phẩm thành công',
      product: formattedProduct,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const GET = withAdminAuth(handleGetProducts);
export const POST = withAdminAuth(handleCreateProduct);