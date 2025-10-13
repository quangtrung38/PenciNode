import type { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { Mockup, Product } from '@/models';

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

// GET - Get single mockup by id
async function handleGetMockup(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const mockupId = resolvedParams.id;

    if (!mockupId) {
      return NextResponse.json(
        { error: 'Mockup ID is required' },
        { status: 400 },
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(mockupId)) {
      return NextResponse.json(
        { error: 'Invalid mockup ID' },
        { status: 400 },
      );
    }

    // Find the mockup
    const rawMockup = await (Mockup as any)
      .findById(mockupId)
      .select('name jsoncol image product_id background_color size_img display isViewMain createdAt updatedAt')
      .populate('product_id', 'name')
      .lean();

    if (!rawMockup) {
      return NextResponse.json(
        { error: 'Mockup not found' },
        { status: 404 },
      );
    }

    const mockup = {
      id: rawMockup._id.toString(),
      name: rawMockup.name,
      jsoncol: rawMockup.jsoncol,
      image: rawMockup.image,
      product_id: rawMockup.product_id?._id?.toString(),
      product_name: rawMockup.product_id?.name || 'N/A',
      background_color: rawMockup.background_color,
      size_img: rawMockup.size_img,
      display: rawMockup.display,
      isViewMain: rawMockup.isViewMain,
      createdAt: formatDate(rawMockup.createdAt),
      updatedAt: formatDate(rawMockup.updatedAt),
    };

    return NextResponse.json({ mockup });
  } catch (error) {
    console.error('Error fetching mockup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// PUT - Update mockup
async function handleUpdateMockup(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const mockupId = resolvedParams.id;
    const body = await request.json();

    if (!mockupId) {
      return NextResponse.json(
        { error: 'Mockup ID is required' },
        { status: 400 },
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(mockupId)) {
      return NextResponse.json(
        { error: 'Invalid mockup ID' },
        { status: 400 },
      );
    }

    // Validate allowed updates
    const allowedUpdates = [
      'name',
      'jsoncol',
      'image',
      'product_id',
      'background_color',
      'size_img',
      'display',
      'isViewMain',
    ];
    const filteredUpdates: any = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedUpdates.includes(key)) {
        if (key === 'product_id') {
          if (mongoose.Types.ObjectId.isValid(value as string)) {
            filteredUpdates[key] = new mongoose.Types.ObjectId(value as string);
          }
        } else if (['display', 'isViewMain'].includes(key)) {
          filteredUpdates[key] = Number.parseInt(value as string);
        } else {
          filteredUpdates[key] = value;
        }
      }
    }

    // Validate required fields
    if (filteredUpdates.name && !filteredUpdates.name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 },
      );
    }

    // Validate product_id if provided
    if (filteredUpdates.product_id) {
      const productExists = await (Product as any).findById(filteredUpdates.product_id);
      if (!productExists) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 },
        );
      }
    }

    // Update mockup
    const rawUpdatedMockup = await (Mockup as any).findByIdAndUpdate(
      mockupId,
      filteredUpdates,
      {
        new: true,
        select: 'name jsoncol image product_id background_color size_img display isViewMain createdAt updatedAt',
      },
    ).populate('product_id', 'name').lean();

    if (!rawUpdatedMockup) {
      return NextResponse.json(
        { error: 'Mockup not found' },
        { status: 404 },
      );
    }

    const updatedMockup = {
      id: rawUpdatedMockup._id.toString(),
      name: rawUpdatedMockup.name,
      jsoncol: rawUpdatedMockup.jsoncol,
      image: rawUpdatedMockup.image,
      product_id: rawUpdatedMockup.product_id?._id?.toString(),
      product_name: rawUpdatedMockup.product_id?.name || 'N/A',
      background_color: rawUpdatedMockup.background_color,
      size_img: rawUpdatedMockup.size_img,
      display: rawUpdatedMockup.display,
      isViewMain: rawUpdatedMockup.isViewMain,
      createdAt: formatDate(rawUpdatedMockup.createdAt),
      updatedAt: formatDate(rawUpdatedMockup.updatedAt),
    };

    return NextResponse.json({
      message: 'Mockup updated successfully',
      mockup: updatedMockup,
    });
  } catch (error) {
    console.error('Error updating mockup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE - Delete mockup
async function handleDeleteMockup(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const mockupId = resolvedParams.id;

    if (!mockupId) {
      return NextResponse.json(
        { error: 'Mockup ID is required' },
        { status: 400 },
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(mockupId)) {
      return NextResponse.json(
        { error: 'Invalid mockup ID' },
        { status: 400 },
      );
    }

    // Delete mockup
    const deletedMockup = await (Mockup as any).findByIdAndDelete(mockupId);

    if (!deletedMockup) {
      return NextResponse.json(
        { error: 'Mockup not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: 'Mockup deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting mockup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const GET = withAdminAuth(handleGetMockup);
export const PUT = withAdminAuth(handleUpdateMockup);
export const DELETE = withAdminAuth(handleDeleteMockup);
