import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { Product } from '@/models/Product';

// Allowed toggle fields for quick updates
const ALLOWED_TOGGLE_FIELDS = new Set([
  'display',
  'display_home',
  'isShowPage',
  'homePenci',
  'isSocical',
  'outline',
]);

async function handlePatch(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const { id } = params;

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

export const PATCH = withAdminAuth(handlePatch);
export const DELETE = withAdminAuth(handleDelete);
