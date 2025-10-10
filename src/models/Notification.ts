import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

// Notification Interface
export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'failed' | 'read';
  channels: ('push' | 'email' | 'sms' | 'in_app')[];
  variables?: Record<string, any>;
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
  error?: string;
  attemptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Virtual populate
  user?: IUser;
}

// Notification Schema
const NotificationSchema = new Schema<INotification>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'NotificationTemplate',
    index: true
  },
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  message: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'read'],
    default: 'sent',
    index: true
  },
  channels: [{
    type: String,
    enum: ['push', 'email', 'sms', 'in_app'],
    default: 'in_app'
  }],
  variables: {
    type: Schema.Types.Mixed,
    default: {}
  },
  scheduledFor: {
    type: Date,
    index: true
  },
  sentAt: {
    type: Date,
    index: true
  },
  readAt: { 
    type: Date,
    index: true
  },
  actionUrl: { 
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  error: {
    type: String,
    trim: true
  },
  attemptedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

// Indexes for performance (compound indexes)
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ status: 1, scheduledFor: 1 }); // For scheduled notifications
NotificationSchema.index({ userId: 1, status: 1 }); // For user-specific queries

// Text search
NotificationSchema.index({ 
  title: 'text', 
  message: 'text' 
}, {
  name: 'notification_text_search'
});

// Virtual populate
NotificationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

NotificationSchema.virtual('template', {
  ref: 'NotificationTemplate',
  localField: 'templateId',
  foreignField: '_id',
  justOne: true
});

// Instance methods
NotificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

NotificationSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

NotificationSchema.methods.markAsFailed = function(error?: string) {
  this.status = 'failed';
  this.error = error;
  this.attemptedAt = new Date();
  return this.save();
};

NotificationSchema.methods.isUnread = function() {
  return this.status !== 'read';
};

NotificationSchema.methods.isScheduled = function() {
  return this.status === 'pending' && this.scheduledFor && this.scheduledFor > new Date();
};

NotificationSchema.methods.isDue = function() {
  return this.status === 'pending' && 
         this.scheduledFor && 
         this.scheduledFor <= new Date();
};

// Static methods
NotificationSchema.statics.findUnread = function(userId?: string) {
  const query = { status: { $ne: 'read' } };
  if (userId) {
    (query as any).userId = new mongoose.Types.ObjectId(userId);
  }
  return this.find(query).sort({ createdAt: -1 });
};

NotificationSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId: new mongoose.Types.ObjectId(userId) })
             .sort({ createdAt: -1 });
};

NotificationSchema.statics.findDueNotifications = function() {
  return this.find({
    status: 'pending',
    scheduledFor: { $lte: new Date() }
  }).sort({ scheduledFor: 1 });
};

NotificationSchema.statics.markAllAsRead = function(userId: string) {
  return this.updateMany(
    { 
      userId: new mongoose.Types.ObjectId(userId),
      status: { $ne: 'read' }
    },
    { 
      status: 'read',
      readAt: new Date()
    }
  );
};

NotificationSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    status: { $ne: 'read' }
  });
};

// Pre-save middleware
NotificationSchema.pre('save', function(next) {
  // Set sentAt if status is changed to sent and sentAt is not set
  if (this.isModified('status') && this.status === 'sent' && !this.sentAt) {
    this.sentAt = new Date();
  }
  
  // Set readAt if status is changed to read and readAt is not set
  if (this.isModified('status') && this.status === 'read' && !this.readAt) {
    this.readAt = new Date();
  }
  
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Create and export the model
export const Notification = mongoose.models.Notification || 
  mongoose.model<INotification>('Notification', NotificationSchema);