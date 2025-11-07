import mongoose, { Schema, type Document } from 'mongoose';

// Interface for TypeScript
export interface IEditorCategoryQRCode extends Document {
  name: string;
  display: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const EditorCategoryQRCodeSchema = new Schema<IEditorCategoryQRCode>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    display: {
      type: Number,
      default: 1,
      enum: [0, 1],
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'editor_category_qrcode',
  }
);

// Create indexes
EditorCategoryQRCodeSchema.index({ position: 1 });
EditorCategoryQRCodeSchema.index({ display: 1 });

// Export model (using delete mongoose.models first to avoid OverwriteModelError)
const modelName = 'EditorCategoryQRCode';
if (mongoose.models[modelName]) {
  delete mongoose.models[modelName];
}

export const EditorCategoryQRCode = mongoose.model<IEditorCategoryQRCode>(
  modelName,
  EditorCategoryQRCodeSchema
);
