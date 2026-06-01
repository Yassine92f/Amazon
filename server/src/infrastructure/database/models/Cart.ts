import mongoose, { Schema, Document } from 'mongoose';

export interface CartItemSubdoc {
  productId: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface CartDocument extends Document {
  userId: mongoose.Types.ObjectId;
  items: CartItemSubdoc[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<CartItemSubdoc>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const cartSchema = new Schema<CartDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

export const CartModel = mongoose.model<CartDocument>('Cart', cartSchema);
