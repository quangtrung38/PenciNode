import connectDB from '@/libs/mongoose';
import { 
  User, 
  NotificationTemplate, 
  Notification
} from '@/models';
import type { INotification } from '@/models';
import { Types } from 'mongoose';

export interface CreateNotificationInput {
  userId: string;
  templateCode: string;
  variables?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: Date;
  channels?: ('push' | 'email' | 'sms' | 'in_app')[];
}

export interface NotificationQuery {
  userId?: string;
  status?: 'pending' | 'sent' | 'failed' | 'read';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channel?: 'push' | 'email' | 'sms' | 'in_app';
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export class NotificationService {
  constructor() {}

  /**
   * Create a new notification from template
   */
  async createNotification(input: CreateNotificationInput): Promise<INotification> {
    await connectDB();

    const { userId, templateCode, variables = {}, priority = 'medium', scheduledFor, channels = ['in_app'] } = input;

    // Validate user exists
    const user = await (User as any).findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get notification template
    const template = await (NotificationTemplate as any).findOne({ 
      code: templateCode.toUpperCase(),
      isActive: true 
    });
    
    if (!template) {
      throw new Error(`Notification template with code '${templateCode}' not found or inactive`);
    }

    // Replace variables in title and message
    const processedTitle = this.replaceVariables(template.title, variables);
    const processedMessage = this.replaceVariables(template.message, variables);

    // Create notification
    const notification = new Notification({
      userId: new Types.ObjectId(userId),
      templateId: template._id,
      title: processedTitle,
      message: processedMessage,
      type: template.type,
      priority,
      channels,
      variables,
      status: scheduledFor ? 'pending' : 'sent',
      scheduledFor,
      sentAt: scheduledFor ? undefined : new Date(),
    });

    await notification.save();
    return notification;
  }

  /**
   * Get notifications with filtering and pagination
   */
  async getNotifications(query: NotificationQuery = {}) {
    await connectDB();

    const {
      userId,
      status,
      priority,
      channel,
      fromDate,
      toDate,
      page = 1,
      limit = 20
    } = query;

    // Build MongoDB query
    const mongoQuery: any = {};

    if (userId) {
      mongoQuery.userId = new Types.ObjectId(userId);
    }

    if (status) {
      mongoQuery.status = status;
    }

    if (priority) {
      mongoQuery.priority = priority;
    }

    if (channel) {
      mongoQuery.channels = { $in: [channel] };
    }

    if (fromDate || toDate) {
      mongoQuery.createdAt = {};
      if (fromDate) mongoQuery.createdAt.$gte = fromDate;
      if (toDate) mongoQuery.createdAt.$lte = toDate;
    }

    // Execute query with pagination
    const [notifications, totalCount] = await Promise.all([
      (Notification as any).find(mongoQuery)
        .populate('userId', 'name email')
        .populate('templateId', 'code title type')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(mongoQuery)
    ]);

    return {
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      }
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId?: string): Promise<INotification | null> {
    await connectDB();

    if (!Types.ObjectId.isValid(notificationId)) {
      throw new Error('Invalid notification ID');
    }

    const query: any = { _id: notificationId };
    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    const notification = await (Notification as any).findOneAndUpdate(
      query,
      { 
        status: 'read',
        readAt: new Date()
      },
      { new: true }
    );

    return notification;
  }

  // Removed duplicate function - keeping the more detailed version below

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId?: string) {
    await connectDB();

    const match: any = {};
    if (userId) {
      match.userId = new Types.ObjectId(userId);
    }

    const stats = await Notification.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $ne: ['$status', 'read'] }, 1, 0] }
          },
          byPriority: {
            $push: {
              priority: '$priority',
              count: 1
            }
          },
          byType: {
            $push: {
              type: '$type',
              count: 1
            }
          }
        }
      }
    ]);

    return stats[0] || {
      total: 0,
      unread: 0,
      byPriority: [],
      byType: []
    };
  }

  /**
   * Delete old notifications (cleanup)
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    await connectDB();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await (Notification as any).deleteMany({
      createdAt: { $lt: cutoffDate },
      status: 'read'
    });

    return result.deletedCount;
  }

  /**
   * Send scheduled notifications
   */
  async sendScheduledNotifications(): Promise<number> {
    await connectDB();

    const now = new Date();
    const scheduledNotifications = await (Notification as any).find({
      status: 'pending',
      scheduledFor: { $lte: now }
    });

    let sentCount = 0;
    for (const notification of scheduledNotifications) {
      try {
        // Update notification status
        await (Notification as any).findByIdAndUpdate(notification._id, {
          status: 'sent',
          sentAt: now
        });

        // Here you would integrate with actual notification services
        // (push notifications, email, SMS, etc.)
        console.log(`Sent notification ${notification._id} to user ${notification.userId}`);
        
        sentCount++;
      } catch (error) {
        console.error(`Failed to send notification ${notification._id}:`, error);
        
        // Mark as failed
        await (Notification as any).findByIdAndUpdate(notification._id, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          attemptedAt: now
        });
      }
    }

    return sentCount;
  }

  /**
   * Replace variables in text with actual values
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      return variables[variableName] !== undefined 
        ? String(variables[variableName]) 
        : match;
    });
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(id: string): Promise<INotification | null> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error('Invalid notification ID');
    }

    return await (Notification as any).findById(id)
      .populate('userId', 'name email')
      .populate('templateId', 'code title type');
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[], userId?: string): Promise<{ modifiedCount: number }> {
    await connectDB();

    // Validate all notification IDs
    const validIds = notificationIds.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      throw new Error('No valid notification IDs provided');
    }

    const query: any = { 
      _id: { $in: validIds.map(id => new Types.ObjectId(id)) },
      status: { $ne: 'read' } // Only update unread notifications
    };
    
    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    const result = await Notification.updateMany(
      query,
      { 
        status: 'read',
        readAt: new Date()
      }
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    await connectDB();

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const result = await Notification.updateMany(
      { 
        userId: new Types.ObjectId(userId),
        status: { $ne: 'read' } // Only update unread notifications
      },
      { 
        status: 'read',
        readAt: new Date()
      }
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string, userId?: string): Promise<boolean> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error('Invalid notification ID');
    }

    const query: any = { _id: id };
    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    const result = await (Notification as any).findOneAndDelete(query);
    return !!result;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
