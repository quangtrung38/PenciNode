
// Database connection using Mongoose instead of Prisma
import connectDB from './mongoose';
import { User, NotificationTemplate, Notification } from '@/models';

// Export the connection function and models
export { connectDB };
export { User, NotificationTemplate, Notification };

// Legacy compatibility - deprecated, use Mongoose models directly instead
export const db = {
  // Deprecated: Use models directly
  user: User,
  notificationTemplate: NotificationTemplate,
  notification: Notification,
};

// Re-export types for convenience
export type { IUser, INotificationTemplate, INotification } from '@/models';