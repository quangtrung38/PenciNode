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

// GET notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate required fields
    if (!userId) {
      const errorResponse = NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
      return withCors(errorResponse);
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const errorResponse = NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
      return withCors(errorResponse);
    }

    const User = getUserModel();
    const Notification = getNotificationModel();

    // Check if user exists
    const user = await User.findById(userId).lean();

    if (!user) {
      const errorResponse = NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
      return withCors(errorResponse);
    }

    // Get notifications for the user
    const notifications = await Notification.find({ 
      userId: new mongoose.Types.ObjectId(userId) 
    })
    .select('title message readAt actionUrl createdAt status')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .lean();

    // Transform notifications to match frontend expectations
    const transformedNotifications = notifications.map((notification: any) => ({
      id: notification._id.toString(),
      title: notification.title,
      message: notification.message,
      is_read: notification.status === 'read' || !!notification.readAt,
      read: notification.status === 'read' || !!notification.readAt,
      action_url: notification.actionUrl,
      createdAt: notification.createdAt,
    }));

    const response = NextResponse.json({
      ok: true,
      notifications: transformedNotifications,
      total: notifications.length,
    });

    return withCors(response);

  } catch (error) {
    console.error('Error fetching notifications:', error);
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return withCors(errorResponse);
  }
}