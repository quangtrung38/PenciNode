
// This file is kept for Next.js Boilerplate compatibility
// Database schema is now managed by Mongoose in models/

// Re-export Mongoose types for consistent imports
export type { IUser as User, INotificationTemplate, INotification } from './index';

// You can add any additional model types or utilities here if needed
export { User as UserModel, NotificationTemplate, Notification } from './index';