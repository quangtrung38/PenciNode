import mongoose, { Schema, Document } from 'mongoose';

export interface IEditorTemplate extends Document {
  folder_id: number;
  md5_id: string;
  name: string;
  slug: string;
  img: string | null;
  img_size: number | null;
  elements: string | null;
  tags: string | null;
  display: number;
  is_favorite: 'Y' | 'N';
  is_delete: number;
  isCustomer: number;
  isEditView: number;
  isEditViewv2: number;
  cate_dn: string | null;
  collection_id: string | null;
  user_id: number;
  star: number;
  UrlOrderFile: string | null;
  is_confirm: number;
  approved_at: Date | null;
  views: number;
  img_download_count: number;
  pdf_download_count: number;
  use_count: number;
  homePenci: number;
  position: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const EditorTemplateSchema = new Schema<IEditorTemplate>(
  {
    folder_id: {
      type: Number,
      default: 0,
    },
    md5_id: {
      type: String,
      required: false,
      default: '',
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
    },
    slug: {
      type: String,
      default: '',
    },
    img: {
      type: String,
      default: null,
    },
    img_size: {
      type: Number,
      default: null,
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
      enum: [0, 1],
      default: 1,
    },
    is_favorite: {
      type: String,
      enum: ['Y', 'N'],
      default: 'N',
    },
    is_delete: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    isCustomer: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    isEditView: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    isEditViewv2: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    cate_dn: {
      type: String,
      default: null,
    },
    collection_id: {
      type: String,
      default: null,
    },
    user_id: {
      type: Number,
      default: 0,
    },
    star: {
      type: Number,
      default: 0,
    },
    UrlOrderFile: {
      type: String,
      default: null,
    },
    is_confirm: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
      comment: '0 bình thường, 1 đã gửi duyệt, 2 đã duyệt',
    },
    approved_at: {
      type: Date,
      default: null,
    },
    views: {
      type: Number,
      default: 0,
    },
    img_download_count: {
      type: Number,
      default: 0,
    },
    pdf_download_count: {
      type: Number,
      default: 0,
    },
    use_count: {
      type: Number,
      default: 0,
    },
    homePenci: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    position: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
EditorTemplateSchema.index({ img_download_count: 1 });
EditorTemplateSchema.index({ pdf_download_count: 1 });
EditorTemplateSchema.index({ img_download_count: 1, pdf_download_count: 1 });
EditorTemplateSchema.index({ use_count: 1 });
EditorTemplateSchema.index({ display: 1 });
EditorTemplateSchema.index({ cate_dn: 1 });
EditorTemplateSchema.index({ is_delete: 1 });
EditorTemplateSchema.index({ createdAt: -1 });

// Delete existing model if it exists to avoid OverwriteModelError
if (mongoose.models.EditorTemplate) {
  delete mongoose.models.EditorTemplate;
}

export const EditorTemplate = mongoose.model<IEditorTemplate>('EditorTemplate', EditorTemplateSchema);
