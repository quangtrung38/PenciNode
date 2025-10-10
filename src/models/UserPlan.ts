import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export type IUserPlan = {
  user_id: mongoose.Types.ObjectId;
  plan_id: mongoose.Types.ObjectId;
  price?: number; // Giá VNĐ tại thời điểm đăng ký (0 = free)
  start_date: Date;
  end_date: Date;
  active: boolean; // Trạng thái gói (true=active, false=expired)
  created_at: Date;
  updated_at: Date;
} & Document;

const UserPlanSchema = new Schema<IUserPlan>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  plan_id: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
    index: true,
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Giá VNĐ tại thời điểm đăng ký (0 = free)',
  },
  start_date: {
    type: Date,
    required: true,
    index: true,
  },
  end_date: {
    type: Date,
    required: true,
    index: true,
  },
  active: {
    type: Boolean,
    default: true,
    index: true,
    comment: 'Trạng thái gói (true=active, false=expired)',
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'user_plans',
});

// Indexes for performance
UserPlanSchema.index({ user_id: 1, active: 1 });
UserPlanSchema.index({ plan_id: 1, active: 1 });
UserPlanSchema.index({ start_date: 1, end_date: 1 });

// Virtual for checking if plan is expired
UserPlanSchema.virtual('is_expired').get(function () {
  return new Date() > this.end_date;
});

// Instance method to toggle active status
UserPlanSchema.methods.toggleActive = function () {
  this.active = !this.active;
  return this.save();
};

// Static method to find active user plans
UserPlanSchema.statics.findActiveUserPlans = function (userId: string) {
  return this.find({ user_id: userId, active: true })
    .populate('plan_id', 'name type price')
    .sort({ start_date: -1 });
};

// Static method to find plans by user
UserPlanSchema.statics.findByUser = function (userId: string) {
  return this.find({ user_id: userId })
    .populate('user_id', 'name email')
    .populate('plan_id', 'name type price')
    .sort({ created_at: -1 });
};

export default mongoose.models.UserPlan || mongoose.model<IUserPlan>('UserPlan', UserPlanSchema);
