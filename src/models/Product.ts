import mongoose, { type Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string | null;
  slug: string | null;
  cate_name: string | null;
  category_id: mongoose.Types.ObjectId | null;
  tgia_cate: number;
  tgia_product: number;
  width: number | null;
  height: number | null;
  size_dv: string | null;
  select_size: number;
  img: string | null;
  tags_template: string | null;
  tags_graphics: string | null;
  tags_textstyles: string | null;
  tags_frames: string | null;
  tags_images: string | null;
  tags_QR: string | null;
  image_bgov: string | null;
  select_bg: number;
  select_ov: number;
  page: number;
  pageContext: string | null;
  select_page: number;
  rateview: number;
  select_image_sq: number;
  image_size: string | null;
  image_quanlity: number;
  display: number;
  display_home: number;
  isShowPage: number;
  homePenci: number;
  isSocical: number;
  enableBg: number;
  enableBgmk: number;
  outline: number;
  svgContent: string | null;
  position: number;
  numPdt: number;
  numCol: number;
  sizeExport: number;
  sizeExportClient: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      default: null,
    },
    slug: {
      type: String,
      default: null,
    },
    cate_name: {
      type: String,
      default: null,
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: 'CategoryProduct',
      default: null,
    },
    tgia_cate: {
      type: Number,
      default: 0,
    },
    tgia_product: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    size_dv: {
      type: String,
      maxlength: 50,
      default: null,
    },
    select_size: {
      type: Number,
      default: 0,
    },
    img: {
      type: String,
      default: null,
    },
    tags_template: {
      type: String,
      default: null,
    },
    tags_graphics: {
      type: String,
      default: null,
    },
    tags_textstyles: {
      type: String,
      default: null,
    },
    tags_frames: {
      type: String,
      default: null,
    },
    tags_images: {
      type: String,
      default: null,
    },
    tags_QR: {
      type: String,
      default: null,
    },
    image_bgov: {
      type: String,
      default: null,
    },
    select_bg: {
      type: Number,
      default: 0,
    },
    select_ov: {
      type: Number,
      default: 0,
    },
    page: {
      type: Number,
      default: 1,
    },
    pageContext: {
      type: String,
      default: null,
    },
    select_page: {
      type: Number,
      default: 0,
    },
    rateview: {
      type: Number,
      default: 0,
    },
    select_image_sq: {
      type: Number,
      default: 0,
    },
    image_size: {
      type: String,
      default: null,
    },
    image_quanlity: {
      type: Number,
      default: 0,
    },
    display: {
      type: Number,
      default: 0,
    },
    display_home: {
      type: Number,
      default: 0,
    },
    isShowPage: {
      type: Number,
      default: 0,
    },
    homePenci: {
      type: Number,
      default: 0,
    },
    isSocical: {
      type: Number,
      default: 0,
    },
    enableBg: {
      type: Number,
      default: 0,
    },
    enableBgmk: {
      type: Number,
      default: 0,
    },
    outline: {
      type: Number,
      default: 0,
    },
    svgContent: {
      type: String,
      default: null,
    },
    position: {
      type: Number,
      default: 0,
    },
    numPdt: {
      type: Number,
      default: 0,
    },
    numCol: {
      type: Number,
      default: 0,
    },
    sizeExport: {
      type: Number,
      default: 0,
    },
    sizeExportClient: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'products',
  },
);

// Indexes for better query performance
ProductSchema.index({ slug: 1 });
ProductSchema.index({ display: 1 });
ProductSchema.index({ display_home: 1 });
ProductSchema.index({ tgia_cate: 1 });
ProductSchema.index({ position: 1 });
ProductSchema.index({ createdAt: -1 });

// Prevent model recompilation in development
export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
