import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withCors, handleOptions } from '@/utils/cors';

// Ensure database connection
import '@/libs/DB';

// Get models
const getUserModel = () => mongoose.model('User');
const getNotificationModel = () => mongoose.model('Notification');

// Handle preflight requests
export async function OPTIONS() {
  return handleOptions();
}

// POST mark all notifications as read for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const User = getUserModel();
    const Notification = getNotificationModel();

    // Check if user exists
    const user = await User.findById(userId).lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Mark all unread notifications as read
    const result = await Notification.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        status: { $ne: 'read' }, // Only update unread notifications
      },
      {
        status: 'read',
        readAt: new Date(),
      }
    );

    const response = NextResponse.json({
      ok: true,
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount,
    });

    return withCors(response);

  } catch (error) {
    console.error('Error marking notifications as read:', error);
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return withCors(errorResponse);
  }
}