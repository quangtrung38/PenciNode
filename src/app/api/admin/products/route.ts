import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { Product } from '@/models/Product';

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
      .select('name img category_id display display_home isShowPage homePenci isSocical enableBg enableBgmk outline position createdAt updatedAt')
      .sort({ position: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalCount / limit);

    const formattedProducts = products.map((product: any) => ({
      id: product._id.toString(),
      name: product.name,
      img: product.img,
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
      name,
      slug,
      category_id,
      img,
      display,
      display_home,
      isShowPage,
      homePenci,
      isSocical,
      enableBg,
      enableBgmk,
      outline,
      position,
      // Add other fields as needed
    } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Tên sản phẩm là bắt buộc' },
        { status: 400 },
      );
    }

    // Create product
    const product = await (Product as any).create({
      name: name.trim(),
      slug: slug || null,
      category_id: category_id || null,
      img: img || null,
      display: display ?? 0,
      display_home: display_home ?? 0,
      isShowPage: isShowPage ?? 0,
      homePenci: homePenci ?? 0,
      isSocical: isSocical ?? 0,
      enableBg: enableBg ?? 0,
      enableBgmk: enableBgmk ?? 0,
      outline: outline ?? 0,
      position: position || 0,
      // Set default values for other required fields
      cate_name: null,
      tgia_cate: 0,
      tgia_product: 0,
      width: null,
      height: null,
      size_dv: null,
      select_size: 0,
      tags_template: null,
      tags_graphics: null,
      tags_textstyles: null,
      tags_frames: null,
      tags_images: null,
      tags_QR: null,
      image_bgov: null,
      select_bg: 0,
      select_ov: 0,
      page: 1,
      pageContext: null,
      select_page: 0,
      rateview: 0,
      select_image_sq: 0,
      image_size: null,
      image_quanlity: 0,
      svgContent: null,
      numPdt: 0,
      numCol: 0,
      sizeExport: 0,
      sizeExportClient: 0,
    });

    // Populate category for response
    await product.populate('category_id', 'name');

    const formattedProduct = {
      id: product._id.toString(),
      name: product.name,
      img: product.img,
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