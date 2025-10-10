import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

// Plan Interface based on MySQL schema
export type IPlan = Document & {
  _id: mongoose.Types.ObjectId;

  // Basic info
  name: string; // Tên gói
  type: 'group' | 'individual' | 'classroom'; // Loại gói

  // Limits and features
  storage_capacity?: number; // Dung lượng lưu trữ (MB)
  ai_points?: number; // Số điểm AI
  template_limit?: number; // Giới hạn template
  downloads_limit?: number; // Giới hạn tải xuống

  // Library access
  template_library: 'basic' | 'premium'; // Thư viện mẫu
  graphics_library: 'basic' | 'premium'; // Thư viện đồ họa

  // Support and pricing
  customer_support: 'basic' | 'priority' | 'special'; // Hỗ trợ khách hàng
  price?: number; // Giá VNĐ (0 = free)

  // AI settings
  ai_duration_unit: 'day' | 'month'; // Đơn vị thời gian AI

  // Status
  active: boolean; // Trạng thái plan (true = active, false = inactive)

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
};

// Plan Schema based on MySQL structure
const PlanSchema = new Schema<IPlan>({
  // Basic info
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  type: {
    type: String,
    enum: ['group', 'individual', 'classroom'],
    required: true,
  },

  // Limits and features
  storage_capacity: {
    type: Number,
    min: 0,
  },
  ai_points: {
    type: Number,
    min: 0,
  },
  template_limit: {
    type: Number,
    min: 0,
  },
  downloads_limit: {
    type: Number,
    min: 0,
  },

  // Library access
  template_library: {
    type: String,
    enum: ['basic', 'premium'],
    default: 'basic',
    required: true,
  },
  graphics_library: {
    type: String,
    enum: ['basic', 'premium'],
    default: 'basic',
    required: true,
  },

  // Support and pricing
  customer_support: {
    type: String,
    enum: ['basic', 'priority', 'special'],
    default: 'basic',
    required: true,
  },
  price: {
    type: Number,
    min: 0,
    default: 0,
  },

  // AI settings
  ai_duration_unit: {
    type: String,
    enum: ['day', 'month'],
    default: 'month',
    required: true,
  },

  // Status
  active: {
    type: Boolean,
    default: true,
  },

}, {
  timestamps: true,
  collection: 'plans',
});

// Indexes for performance
PlanSchema.index({ name: 1 });
PlanSchema.index({ type: 1 });
PlanSchema.index({ active: 1 });
PlanSchema.index({ price: 1 });
PlanSchema.index({ createdAt: -1 });

// Instance methods
PlanSchema.methods.isActive = function () {
  return this.active === true;
};

PlanSchema.methods.isFree = function () {
  return this.price === 0;
};

PlanSchema.methods.isPremium = function () {
  return this.template_library === 'premium' || this.graphics_library === 'premium';
};

PlanSchema.methods.getFormattedPrice = function () {
  if (this.price === 0) {
    return 'Miễn phí';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(this.price);
};

// Static methods
PlanSchema.statics.findActivePlans = function () {
  return this.find({ active: true });
};

PlanSchema.statics.findByType = function (type: string) {
  return this.find({ type, active: true });
};

PlanSchema.statics.findFreePlans = function () {
  return this.find({ price: 0, active: true });
};

PlanSchema.statics.findPaidPlans = function () {
  return this.find({ price: { $gt: 0 }, active: true });
};

// Virtual for display name with type
PlanSchema.virtual('displayName').get(function () {
  const typeMap = {
    group: 'Nhóm',
    individual: 'Cá nhân',
    classroom: 'Lớp học',
  };
  return `${this.name} (${typeMap[this.type as keyof typeof typeMap]})`;
});

// Virtual for feature summary
PlanSchema.virtual('featureSummary').get(function () {
  const features = [];
  if (this.storage_capacity) {
    features.push(`${this.storage_capacity}MB lưu trữ`);
  }
  if (this.ai_points) {
    features.push(`${this.ai_points} điểm AI`);
  }
  if (this.template_limit) {
    features.push(`${this.template_limit} template`);
  }
  if (this.downloads_limit) {
    features.push(`${this.downloads_limit} tải xuống`);
  }
  return features.join(', ');
});

// Pre-save middleware
PlanSchema.pre('save', function (next) {
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Create and export the model
export const Plan = mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);