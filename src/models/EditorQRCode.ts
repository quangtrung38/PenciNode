import mongoose, { Schema, type Document } from 'mongoose';

export interface IEditorQRCode extends Document {
  md5_id: string;
  name: string;
  img?: string;
  elements?: string; // JSON string
  tags?: string;
  display: number;
  cate_dn: string; // Category ID (MongoDB ObjectId)
  user_id: number;
  createdAt: Date;
  updatedAt: Date;
}

const EditorQRCodeSchema = new Schema<IEditorQRCode>(
  {
    md5_id: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    img: {
      type: String,
      default: null,
      maxlength: [1024, 'Image URL cannot exceed 1024 characters'],
    },
    elements: {
      type: String,
      default: null,
    },
    tags: {
      type: String,
      default: null,
    },
    display: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
    cate_dn: {
      type: String,
      default: '0',
    },
    user_id: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'editor_qrcodes',
  },
);

// Indexes
EditorQRCodeSchema.index({ display: 1 });
EditorQRCodeSchema.index({ cate_dn: 1 });
EditorQRCodeSchema.index({ user_id: 1 });
EditorQRCodeSchema.index({ md5_id: 1 });

// Methods
EditorQRCodeSchema.methods.toJSON = function () {
  const editorQRCode = this.toObject();
  editorQRCode.id = editorQRCode._id.toString();
  delete editorQRCode._id;
  delete editorQRCode.__v;
  return editorQRCode;
};

// Prevent model recompilation in development
if (mongoose.models.EditorQRCode) {
  delete mongoose.models.EditorQRCode;
}
export const EditorQRCode = mongoose.model<IEditorQRCode>('EditorQRCode', EditorQRCodeSchema);