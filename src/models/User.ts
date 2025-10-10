import mongoose, { Schema, Document } from 'mongoose';

// User Interface based on MySQL schema
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Basic info
  name?: string;
  email: string;
  email_user?: string;
  password: string;
  
  // Social login
  facebook_id?: string;
  google_id?: string;
  is_facebook_linked: boolean;
  is_google_linked: boolean;
  
  // Role & status (matching MySQL values)
  role?: 1 | 2 | 3; // 1:super admin, 2:admin, 3:user
  status: 0 | 1; // 1:active, 0:inactive
  
  // Penci specific
  penci_purpose?: 'Personal' | 'Business' | 'Other';
  language: string; // default: 'vi'
  
  // Profile info
  avatar?: string;
  avatar_google?: string;
  sex?: 1 | 2; // 1:male, 2:female
  first_name?: string;
  last_name?: string;
  phone?: string;
  
  // System fields
  point: number; // default: 0
  ai_points: number; // default: 0
  card_limit: number; // default: 1
  uid?: string; // unique referral code
  
  // Verification & authentication
  email_verified_at?: Date;
  remember_token?: string;
  token_login?: string;
  pass_review?: string;
  
  // Activity tracking
  last_login?: Date;
  device_type?: string;
  ip_address?: string;
  
  // Feature flags
  is_about: number; // default: 0
  is_intro: number; // default: 0
  is_marketing_mail_synced: boolean; // default: false
  isPenci: number; // default: 0
  is_contributor: 'Y' | 'N'; // default: 'N'
  
  // Additional fields
  badge_id?: number;
  nguoidung_id: number; // default: 0
  permissions?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// User Schema based on MySQL structure
const UserSchema = new Schema<IUser>({
  // Basic info
  name: { type: String, trim: true },
  email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true
  },
  email_user: { type: String },
  password: { type: String, required: true },
  
  // Social login
  facebook_id: { type: String },
  google_id: { type: String },
  is_facebook_linked: { type: Boolean, default: false },
  is_google_linked: { type: Boolean, default: false },
  
  // Role & status (matching MySQL values)
  role: { 
    type: Number, 
    enum: [1, 2, 3], // 1:super admin, 2:admin, 3:user
    default: 3 
  },
  status: { 
    type: Number, 
    enum: [0, 1], // 1:active, 0:inactive
    default: 1 
  },
  
  // Penci specific
  penci_purpose: { 
    type: String, 
    enum: ['Personal', 'Business', 'Other']
  },
  language: { type: String, default: 'vi' },
  
  // Profile info
  avatar: { type: String },
  avatar_google: { type: String },
  sex: { 
    type: Number, 
    enum: [1, 2] // 1:male, 2:female
  },
  first_name: { type: String, trim: true },
  last_name: { type: String, trim: true },
  phone: { type: String },
  
  // System fields
  point: { type: Number, default: 0 },
  ai_points: { type: Number, default: 0 },
  card_limit: { type: Number, default: 1 },
  uid: { 
    type: String
  },
  
  // Verification & authentication
  email_verified_at: { type: Date },
  remember_token: { type: String },
  token_login: { type: String },
  pass_review: { type: String },
  
  // Activity tracking
  last_login: { type: Date },
  device_type: { type: String },
  ip_address: { type: String },
  
  // Feature flags
  is_about: { type: Number, default: 0 },
  is_intro: { type: Number, default: 0 },
  is_marketing_mail_synced: { type: Boolean, default: false },
  isPenci: { type: Number, default: 0 },
  is_contributor: { 
    type: String, 
    enum: ['Y', 'N'], 
    default: 'N' 
  },
  
  // Additional fields
  badge_id: { type: Number },
  nguoidung_id: { type: Number, default: 0 },
  permissions: { type: String }
  
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for performance (matching MySQL indexes)
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ uid: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ createdAt: -1 });

// Instance methods
UserSchema.methods.isAdmin = function() {
  return this.role === 1 || this.role === 2; // super admin or admin
};

UserSchema.methods.isSuperAdmin = function() {
  return this.role === 1;
};

UserSchema.methods.isActive = function() {
  return this.status === 1;
};

UserSchema.methods.getFullName = function() {
  if (this.first_name && this.last_name) {
    return `${this.first_name} ${this.last_name}`;
  }
  return this.name || this.email || 'Unknown User';
};

// Static methods
UserSchema.statics.findActiveUsers = function() {
  return this.find({ status: 1 });
};

UserSchema.statics.findByRole = function(role: number) {
  return this.find({ role });
};

UserSchema.statics.findAdmins = function() {
  return this.find({ role: { $in: [1, 2] } });
};

UserSchema.statics.findByUid = function(uid: string) {
  return this.findOne({ uid });
};

// Pre-save middleware
UserSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  
  // Generate UID if not provided
  if (this.isNew && !this.uid) {
    this.uid = generateUID();
  }
  
  next();
});

// Helper function to generate unique UID
function generateUID(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Virtual for display name
UserSchema.virtual('displayName').get(function() {
  if (this.first_name && this.last_name) {
    return `${this.first_name} ${this.last_name}`;
  }
  return this.name || this.email || 'Unknown User';
});

// Create and export the model
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);