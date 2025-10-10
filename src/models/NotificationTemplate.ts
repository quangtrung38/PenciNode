import mongoose, { Schema, Document } from 'mongoose';

// NotificationTemplate Interface
export interface INotificationTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  isActive: boolean;
  variables?: string[]; // Template variables like {{userName}}
  createdAt: Date;
  updatedAt: Date;
}

// NotificationTemplate Schema
const NotificationTemplateSchema = new Schema<INotificationTemplate>({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
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
    default: 'info'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  variables: [{ 
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  collection: 'notification_templates'
});

// Indexes for performance
NotificationTemplateSchema.index({ isActive: 1 });

// Instance methods
NotificationTemplateSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

NotificationTemplateSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

NotificationTemplateSchema.methods.extractVariables = function(): string[] {
  return extractVariablesFromText(this.title, this.message);
};

// Static methods
NotificationTemplateSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

NotificationTemplateSchema.statics.findByCode = function(code: string) {
  return this.findOne({ code: code.toUpperCase() });
};

NotificationTemplateSchema.statics.findByType = function(type: string) {
  return this.find({ type, isActive: true });
};

// Helper function to extract variables
function extractVariablesFromText(title: string, message: string): string[] {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  // Extract from title
  variableRegex.lastIndex = 0;
  while ((match = variableRegex.exec(title)) !== null) {
    if (match[1] && !variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  // Reset regex and extract from message
  variableRegex.lastIndex = 0;
  while ((match = variableRegex.exec(message)) !== null) {
    if (match[1] && !variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

// Pre-save middleware
NotificationTemplateSchema.pre('save', function(next) {
  // Auto-extract variables when saving
  this.variables = extractVariablesFromText(this.title, this.message);
  
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Pre-update middleware
NotificationTemplateSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Create and export the model
export const NotificationTemplate = mongoose.models.NotificationTemplate || 
  mongoose.model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema);