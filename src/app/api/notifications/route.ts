import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { notificationService } from '@/services/NotificationService';

// GET user notifications
async function handleGetNotifications(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') as any;
    const priority = searchParams.get('priority') as any;
    const channel = searchParams.get('channel') as any;
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '20');

    // Date filters
    const fromDate = searchParams.get('fromDate')
      ? new Date(searchParams.get('fromDate')!)
      : undefined;
    const toDate = searchParams.get('toDate')
      ? new Date(searchParams.get('toDate')!)
      : undefined;

    const result = await notificationService.getNotifications({
      userId: userId || undefined,
      status,
      priority,
      channel,
      fromDate,
      toDate,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 },
    );
  }
}

// POST create notification
async function handleCreateNotification(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      templateCode,
      variables = {},
      priority = 'medium',
      scheduledFor,
      channels = ['in_app'],
    } = body;

    // Validation
    if (!userId || !templateCode) {
      return NextResponse.json(
        { error: 'userId and templateCode are required' },
        { status: 400 },
      );
    }

    const notification = await notificationService.createNotification({
      userId,
      templateCode,
      variables,
      priority,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      channels,
    });

    return NextResponse.json({
      message: 'Notification created successfully',
      notification: {
        id: notification._id.toString(),
        userId: notification.userId.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        channels: notification.channels,
        status: notification.status,
        variables: notification.variables,
        createdAt: notification.createdAt,
        scheduledFor: notification.scheduledFor,
        sentAt: notification.sentAt,
        readAt: notification.readAt,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    const message = error instanceof Error ? error.message : 'Failed to create notification';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

// PATCH mark notifications as read
async function handleMarkAsRead(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, notificationIds, markAll = false } = body;

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 },
      );
    }

    let result;
    if (markAll) {
      // Mark all notifications for user as read
      result = await notificationService.markAllAsRead(userId);
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      result = await notificationService.markMultipleAsRead(notificationIds, userId);
    } else {
      return NextResponse.json(
        { error: 'Either markAll=true or notificationIds array is required' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: markAll ? 'All notifications marked as read' : 'Notifications marked as read',
      updatedCount: typeof result === 'object' && 'modifiedCount' in result ? result.modifiedCount : 0,
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 },
    );
  }
}

// Export handlers with auth
export const GET = withAuth(handleGetNotifications);
export const POST = withAuth(handleCreateNotification);
export const PATCH = withAuth(handleMarkAsRead);
