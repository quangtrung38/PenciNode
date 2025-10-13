import { NextResponse } from 'next/server';
import connectDB from '@/libs/mongoose';
import { Product } from '@/models/Product';

export async function GET() {
  try {
    await connectDB();

    // Get all products with only id and name for dropdown
    const products = await (Product as any).find(
      { display: 1 }, // Only get active products
      { _id: 1, name: 1 } // Only select id and name
    )
    .sort({ name: 1 }) // Sort by name alphabetically
    .lean();

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}