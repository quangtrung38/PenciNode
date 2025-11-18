import mongoose, { Schema, Document } from 'mongoose';

export interface INews extends Document {
  title: string;
  category_id: mongoose.Types.ObjectId | null;
  summary: string | null;
  user_id: number;
  tags: string | null;
  author: string | null;
  image: string | null;
  img: string | null;
  slug: string;
  content: string | null;
  display: number;
  view_count: number;
  page_title: string | null;
  page_keyword: string | null;
  page_description: string | null;
  enable: number;
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema = new Schema<INews>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: 'EditorCategoryNews',
      default: null,
    },
    summary: {
      type: String,
      default: null,
    },
    user_id: {
      type: Number,
      default: null,
    },
    tags: {
      type: String,
      default: null,
    },
    author: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    img: {
      type: String,
      default: null,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      default: null,
    },
    display: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    view_count: {
      type: Number,
      default: 0,
    },
    page_title: {
      type: String,
      default: null,
    },
    page_keyword: {
      type: String,
      default: null,
    },
    page_description: {
      type: String,
      default: null,
    },
    enable: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes - slug already has unique index from field definition
NewsSchema.index({ category_id: 1 });
NewsSchema.index({ user_id: 1 });
NewsSchema.index({ display: 1 });
NewsSchema.index({ enable: 1 });
NewsSchema.index({ createdAt: -1 });
NewsSchema.index({ view_count: -1 });

// Delete existing model if it exists
if (mongoose.models.News) {
  delete mongoose.models.News;
}

export const News = mongoose.model<INews>('News', NewsSchema);
