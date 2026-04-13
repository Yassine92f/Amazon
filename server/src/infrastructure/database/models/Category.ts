import mongoose, { Schema, Document } from 'mongoose';

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  image?: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    image: String,
    icon: String,
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const CategoryModel = mongoose.model<CategoryDocument>('Category', categorySchema);
