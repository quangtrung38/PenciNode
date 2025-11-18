import mongoose, { Document, Schema } from 'mongoose';

export interface IEditorCategoryNews extends Document {
  name: string;
  slug: string;
  img?: string;
  display: number;
  position: number;
  parent_id?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const EditorCategoryNewsSchema = new Schema<IEditorCategoryNews>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Ensures slug uniqueness
    },
    img: {
      type: String,
      default: null,
    },
    display: {
      type: Number,
      default: 1,
      index: true,
    },
    position: {
      type: Number,
      default: 0,
      index: true,
    },
    parent_id: {
      type: Schema.Types.ObjectId,
      ref: 'EditorCategoryNews',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'editor_category_news',
  },
);

// Index for sorting
EditorCategoryNewsSchema.index({ position: 1, createdAt: -1 });

const EditorCategoryNews =
  mongoose.models.EditorCategoryNews ||
  mongoose.model<IEditorCategoryNews>('EditorCategoryNews', EditorCategoryNewsSchema);

export default EditorCategoryNews;
