import mongoose, { Schema, type Document } from 'mongoose';

export interface IMockup extends Document {
  name: string;
  jsoncol?: string; // JSON data for mockup configuration
  image?: string; // Image URL or path
  product_id: mongoose.Types.ObjectId; // Reference to Product
  background_color?: string;
  size_img?: string; // Format: "widthxheightxtopxleftxrightxbottomxxxy"
  display: number; // 0 or 1
  isViewMain: number; // 0 or 1
  createdAt: Date;
  updatedAt: Date;
}

const MockupSchema = new Schema<IMockup>(
  {
    name: {
      type: String,
      required: [true, 'Mockup name is required'],
      trim: true,
      maxlength: [191, 'Name cannot exceed 191 characters'],
    },
    jsoncol: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    background_color: {
      type: String,
      default: null,
      maxlength: [191, 'Background color cannot exceed 191 characters'],
    },
    size_img: {
      type: String,
      default: null,
      maxlength: [191, 'Size image cannot exceed 191 characters'],
    },
    display: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
    isViewMain: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
  },
  {
    timestamps: true,
    collection: 'mockups',
  },
);

// Indexes
MockupSchema.index({ product_id: 1 });
MockupSchema.index({ name: 1 });
MockupSchema.index({ display: 1 });
MockupSchema.index({ isViewMain: 1 });

// Methods
MockupSchema.methods.toJSON = function () {
  const mockup = this.toObject();
  mockup.id = mockup._id.toString();
  delete mockup._id;
  delete mockup.__v;
  return mockup;
};

// Virtual for product population
MockupSchema.virtual('product', {
  ref: 'Product',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included in JSON
MockupSchema.set('toJSON', { virtuals: true });
MockupSchema.set('toObject', { virtuals: true });

export const Mockup = mongoose.models.Mockup || mongoose.model<IMockup>('Mockup', MockupSchema);
