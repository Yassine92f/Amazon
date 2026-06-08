import mongoose, { Schema, Document } from 'mongoose';

export interface ProductVariantSubdoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: Map<string, string>;
  images: string[];
}

export interface ProductDocument extends Document {
  sellerId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  categoryId: mongoose.Types.ObjectId;
  brand?: string;
  tags: string[];
  variants: ProductVariantSubdoc[];
  images: string[];
  rating: number;
  reviewCount: number;
  totalSold: number;
  isActive: boolean;
  isFeatured: boolean;
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    attributes: { type: Map, of: String, default: {} },
    images: { type: [String], default: [] },
  },
  { _id: true },
);

const productSchema = new Schema<ProductDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    brand: { type: String, trim: true, index: true },
    tags: { type: [String], default: [], index: true },
    variants: { type: [variantSchema], default: [] },
    images: { type: [String], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5, index: true },
    reviewCount: { type: Number, default: 0, min: 0 },
    totalSold: { type: Number, default: 0, min: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    minPrice: { type: Number, default: 0, min: 0, index: true },
    maxPrice: { type: Number, default: 0, min: 0 },
    inStock: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

// Full-text search across name, description, brand, tags
productSchema.index(
  { name: 'text', description: 'text', brand: 'text', tags: 'text' },
  { weights: { name: 10, brand: 5, tags: 3, description: 1 }, name: 'product_text_index' },
);

// Recompute denormalized minPrice/maxPrice/inStock before save
productSchema.pre('save', function (next) {
  if (this.variants && this.variants.length > 0) {
    const prices = this.variants.map((v) => v.price);
    this.minPrice = Math.min(...prices);
    this.maxPrice = Math.max(...prices);
    this.inStock = this.variants.some((v) => v.stock > 0);
  } else {
    this.minPrice = 0;
    this.maxPrice = 0;
    this.inStock = false;
  }
  next();
});

export const ProductModel = mongoose.model<ProductDocument>('Product', productSchema);
