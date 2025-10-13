import type { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { Mockup } from '@/models';

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

// PATCH - Toggle mockup isViewMain status
async function handleToggleMockupViewMain(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const mockupId = params.id;

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

    // Find the current mockup
    const currentMockup = await (Mockup as any).findById(mockupId).select('isViewMain').lean();

    if (!currentMockup) {
      return NextResponse.json(
        { error: 'Mockup not found' },
        { status: 404 },
      );
    }

    // Toggle the isViewMain status (0 -> 1, 1 -> 0)
    const newStatus = currentMockup.isViewMain === 1 ? 0 : 1;

    // Update mockup isViewMain
    const rawUpdatedMockup = await (Mockup as any).findByIdAndUpdate(
      mockupId,
      { isViewMain: newStatus },
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
      success: true,
      message: `Mockup ${newStatus === 1 ? 'set as main' : 'removed from main'} successfully`,
      mockup: updatedMockup,
    });
  } catch (error) {
    console.error('Error toggling mockup view main:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const PATCH = withAdminAuth(handleToggleMockupViewMain);
