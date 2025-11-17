import mongoose, { Schema, Document } from 'mongoose';

export interface IEditorCollection extends Document {
  name: string;
  slug: string;
  img: string | null;
  position: number;
  display: number;
  createdAt: Date;
  updatedAt: Date;
}

const EditorCollectionSchema = new Schema<IEditorCollection>(
  {
    name: {
      type: String,
      required: [true, 'Collection name is required'],
    },
    slug: {
      type: String,
      default: '',
    },
    img: {
      type: String,
      default: null,
    },
    position: {
      type: Number,
      default: 0,
    },
    display: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
EditorCollectionSchema.index({ position: 1 });
EditorCollectionSchema.index({ display: 1 });
EditorCollectionSchema.index({ createdAt: -1 });

// Delete existing model if it exists to avoid OverwriteModelError
if (mongoose.models.EditorCollection) {
  delete mongoose.models.EditorCollection;
}

export const EditorCollection = mongoose.model<IEditorCollection>('EditorCollection', EditorCollectionSchema);
