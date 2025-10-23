import mongoose, { Schema, type Document } from 'mongoose';

export interface IEditorTag extends Document {
  name: string;
  slug: string;
  display: number;
  display_cate: number;
  position: number;
  is_cate: boolean;
  img?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EditorTagSchema = new Schema<IEditorTag>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      maxlength: [255, 'Name cannot exceed 255 characters'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      maxlength: [255, 'Slug cannot exceed 255 characters'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    display: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
    display_cate: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
    position: {
      type: Number,
      default: 0,
    },
    is_cate: {
      type: Boolean,
      default: false,
    },
    img: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'editor_tags',
  },
);

// Indexes
EditorTagSchema.index({ display: 1 });
EditorTagSchema.index({ display_cate: 1 });
EditorTagSchema.index({ position: 1 });
EditorTagSchema.index({ is_cate: 1 });
EditorTagSchema.index({ slug: 1 }, { unique: true });

// Methods
EditorTagSchema.methods.toJSON = function () {
  const editorTag = this.toObject();
  editorTag.id = editorTag._id.toString();
  delete editorTag._id;
  delete editorTag.__v;
  return editorTag;
};

// Prevent model recompilation in development
if (mongoose.models.EditorTag) {
  delete mongoose.models.EditorTag;
}
export const EditorTag = mongoose.model<IEditorTag>('EditorTag', EditorTagSchema);