import { BaseEntity } from './common';

// Cart
export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
}

export interface Cart extends BaseEntity {
  userId: string;
  items: CartItem[];
  totalAmount: number;
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
}

// DTOs
export interface CreateOrderRequest {
  items: { productId: string; variantId: string; quantity: number }[];
  deliveryType: DeliveryType;
  shippingAddressId: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
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
