import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { EditorTag } from '@/models/EditorTag';

async function handleBatchUpdatePositions(request: NextRequest) {
  try {
    await connectDB();

    const { updates } = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates format' }, { status: 400 });
    }

    // Update positions in batch
    const updatePromises = updates.map(({ id, position }: { id: string; position: number }) =>
      EditorTag.findByIdAndUpdate(id, { position }, { new: true })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating positions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const PUT = withAdminAuth(handleBatchUpdatePositions);