import mongoose, { Schema, type Document } from 'mongoose';

export interface IEditorImage extends Document {
  name?: string;
  parent_id?: number;
  category_id?: string; // Changed from number to string to store Product._id
  img: string; // Main image URL
  img_thumb: string; // Thumbnail image URL
  img_process?: string; // Processed image URL
  display: number; // 0 or 1
  group_img?: string; // Group image URL
  group_imgThumb?: string; // Group thumbnail URL
  group_name?: string; // Group name
  is_background: number; // 0 or 1
  description?: string;
  user_id?: number;
  createdAt: Date;
  updatedAt: Date;
}

const EditorImageSchema = new Schema<IEditorImage>(
  {
    name: {
      type: String,
      default: null,
      maxlength: [220, 'Name cannot exceed 220 characters'],
    },
    parent_id: {
      type: Number,
      default: 0,
    },
    category_id: {
      type: String,
      default: null,
    },
    img: {
      type: String,
      required: [true, 'Main image URL is required'],
      maxlength: [200, 'Image URL cannot exceed 200 characters'],
    },
    img_thumb: {
      type: String,
      required: [true, 'Thumbnail image URL is required'],
      maxlength: [200, 'Thumbnail URL cannot exceed 200 characters'],
    },
    img_process: {
      type: String,
      default: null,
      maxlength: [200, 'Processed image URL cannot exceed 200 characters'],
    },
    display: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
    group_img: {
      type: String,
      default: null,
      maxlength: [200, 'Group image URL cannot exceed 200 characters'],
    },
    group_imgThumb: {
      type: String,
      default: null,
      maxlength: [200, 'Group thumbnail URL cannot exceed 200 characters'],
    },
    group_name: {
      type: String,
      default: null,
      maxlength: [200, 'Group name cannot exceed 200 characters'],
    },
    is_background: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
    description: {
      type: String,
      default: null,
    },
    user_id: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'editor_images',
  },
);

// Indexes
EditorImageSchema.index({ display: 1 });
EditorImageSchema.index({ is_background: 1 });
EditorImageSchema.index({ category_id: 1 });
EditorImageSchema.index({ parent_id: 1 });
EditorImageSchema.index({ name: 1 });

// Methods
EditorImageSchema.methods.toJSON = function () {
  const editorImage = this.toObject();
  editorImage.id = editorImage._id.toString();
  delete editorImage._id;
  delete editorImage.__v;
  return editorImage;
};

// Prevent model recompilation in development
if (mongoose.models.EditorImage) {
  delete mongoose.models.EditorImage;
}
export const EditorImage = mongoose.model<IEditorImage>('EditorImage', EditorImageSchema);