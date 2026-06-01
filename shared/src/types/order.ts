import { BaseEntity } from './common';

// Cart
export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  // Display fields enriched by the API (optional — not persisted on guest carts)
  productName?: string;
  productSlug?: string;
  image?: string;
  variantName?: string;
  inStock?: boolean;
  maxStock?: number;
  lineTotal?: number;
}

export interface Cart extends BaseEntity {
  userId: string;
  items: CartItem[];
  totalAmount: number;
  totalItems?: number;
}

// Order
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum DeliveryType {
  HOME = 'home',
  PICKUP_POINT = 'pickup_point',
}

export interface OrderItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  // Image snapshot taken at purchase time (variant image, else product image).
  image?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order extends BaseEntity {
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  status: OrderStatus;
  deliveryType: DeliveryType;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentIntentId?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

// DTOs

export interface AddToCartRequest {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CreateOrderRequest {
  items: { productId: string; variantId: string; quantity: number }[];
  deliveryType: DeliveryType;
  shippingAddressId: string;
  couponCode?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface OrderSummary {
  _id: string;
  orderNumber: string;
  itemCount: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface ApplyCouponRequest {
  code: string;
}

export interface CouponValidation {
  valid: boolean;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountedAmount: number;
  message?: string;
}

// Seller-facing order view: a buyer order narrowed to the line items that
// belong to the authenticated seller, plus the seller's own subtotal. A single
// buyer order can appear for several sellers (multi-vendor), each seeing only
// their slice.
export interface SellerOrderDto {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
  sellerSubtotal: number;
  sellerItemCount: number;
  buyerOrderTotal: number;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

// Wishlist
export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export interface Wishlist extends BaseEntity {
  userId: string;
  items: WishlistItem[];
}
