import mongoose, { Schema, Document } from 'mongoose';

export interface WishlistItemSubdoc {
  productId: mongoose.Types.ObjectId;
  addedAt: Date;
}

export interface WishlistDocument extends Document {
  userId: mongoose.Types.ObjectId;
  items: WishlistItemSubdoc[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistItemSchema = new Schema<WishlistItemSubdoc>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const wishlistSchema = new Schema<WishlistDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [wishlistItemSchema], default: [] },
  },
  { timestamps: true },
);

export const WishlistModel = mongoose.model<WishlistDocument>('Wishlist', wishlistSchema);
