import { OrderStatus, DeliveryType } from '@ecommerce/shared';

export interface OrderItemEntity {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderShippingAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderEntity {
  id: string;
  userId: string;
  orderNumber: string;
  items: OrderItemEntity[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  status: OrderStatus;
  deliveryType: DeliveryType;
  shippingAddress: OrderShippingAddress;
  paymentIntentId?: string;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
