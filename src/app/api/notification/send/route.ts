import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import { withCors, handleOptions } from '@/utils/cors';

// Ensure database connection
import '@/libs/DB';

// Get models
const getUserModel = () => mongoose.model('User');
const getNotificationTemplateModel = () => mongoose.model('NotificationTemplate');
const getNotificationModel = () => mongoose.model('Notification');

// Handle preflight requests
export async function OPTIONS() {
  return handleOptions();
}

// POST send notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, to_user_id } = body;

    // Validate required fields
    if (!code || !to_user_id) {
      return NextResponse.json(
        { error: 'Code and to_user_id are required' },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(to_user_id)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const User = getUserModel();
    const NotificationTemplate = getNotificationTemplateModel();
    const Notification = getNotificationModel();

    // Find notification template by code
    const template = await NotificationTemplate.findOne({ code }).lean();

    if (!template) {
      return NextResponse.json(
        { error: 'Notification template not found' },
        { status: 404 }
      );
    }

    // Check if user exists
    const user = await User.findById(new Types.ObjectId(to_user_id)).lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Process template message with variables (if any in template)
    let processedTitle = (template as any).title || 'Notification';
    let processedMessage = (template as any).message || '';

    // Simple variable replacement if template has variables
    // This maintains compatibility with the original structure
    
    // Create notification
    const notification = await Notification.create({
      userId: new mongoose.Types.ObjectId(to_user_id),
      templateId: (template as any)._id,
      title: processedTitle,
      message: processedMessage,
      type: (template as any).type || 'info',
      priority: 'medium',
      channels: ['in_app'],
      status: 'sent',
      variables: {},
      sentAt: new Date()
    });

    // Send notification to Socket.IO server
    try {
      const notificationData = {
        id: (notification as any)._id.toString(),
        title: (notification as any).title,
        message: (notification as any).message,
        createdAt: (notification as any).createdAt,
        isGlobal: false,
      };

      // Send HTTP request to Socket.IO server to emit notification
      const socketResponse = await fetch('http://localhost:8080/emit-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: to_user_id,
          data: notificationData,
        }),
      });

      if (socketResponse.ok) {
        console.log(`Notification sent to user ${to_user_id} via Socket.IO (port 8080):`, notificationData);
      } else {
        console.warn('Failed to emit Socket.IO notification:', await socketResponse.text());
      }
    } catch (socketError) {
      console.warn('Socket.IO server not available:', socketError);
    }

    const response = NextResponse.json({
      message: 'Notification sent successfully',
      notification: {
        id: (notification as any)._id.toString(),
        title: (notification as any).title,
        message: (notification as any).message,
        createdAt: (notification as any).createdAt,
      }
    });

    return withCors(response);

  } catch (error) {
    console.error('Error sending notification:', error);
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return withCors(errorResponse);
  }
}