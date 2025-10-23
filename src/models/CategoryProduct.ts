import mongoose, { type Document, Schema } from 'mongoose';

export interface ICategoryProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string | null;
  slug: string | null;
  img: string | null;
  imgIcon: string | null;
  position: number;
  display: number;
  displayTgia: number;
  displayPenci: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategoryProductSchema = new Schema<ICategoryProduct>(
  {
    name: {
      type: String,
      default: null,
    },
    slug: {
      type: String,
      default: null,
    },
    img: {
      type: String,
      default: null,
    },
    imgIcon: {
      type: String,
      default: null,
    },
    position: {
      type: Number,
      default: 0,
    },
    display: {
      type: Number,
      default: 0,
    },
    displayTgia: {
      type: Number,
      default: 0,
    },
    displayPenci: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'categories_products',
  },
);

// Indexes for better query performance
CategoryProductSchema.index({ slug: 1 });
CategoryProductSchema.index({ display: 1 });
CategoryProductSchema.index({ position: 1 });
CategoryProductSchema.index({ createdAt: -1 });

// Prevent model recompilation in development
export const CategoryProduct = (mongoose.models.CategoryProduct as mongoose.Model<ICategoryProduct>) || mongoose.model<ICategoryProduct>('CategoryProduct', CategoryProductSchema);

export default CategoryProduct;