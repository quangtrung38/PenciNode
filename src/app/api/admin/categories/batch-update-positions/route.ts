import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { Product } from '@/models/Product';

async function handleBatchUpdatePositions(request: NextRequest) {
  try {
    await connectDB();

    const { updates } = await request.json();

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected array of updates.' },
        { status: 400 }
      );
    }

    // Validate updates
    for (const update of updates) {
      if (!update.id || typeof update.position !== 'number') {
        return NextResponse.json(
          { error: 'Each update must have id and position (number).' },
          { status: 400 }
        );
      }
    }

    // Update positions in batch
    const updatePromises = updates.map(update =>
      (Product as any).findByIdAndUpdate(
        update.id,
        { position: update.position },
        { new: true }
      )
    );

    const results = await Promise.all(updatePromises);

    // Check if all updates were successful
    const failedUpdates = results.filter((result: any) => !result);
    if (failedUpdates.length > 0) {
      return NextResponse.json(
        { error: 'Some categories could not be updated.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Updated positions for ${results.length} categories.`,
      updatedCategories: results.map((cat: any) => ({
        id: cat._id.toString(),
        name: cat.name,
        position: cat.position,
      })),
    });

  } catch (error) {
    console.error('Error updating category positions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const PUT = withAdminAuth(handleBatchUpdatePositions);