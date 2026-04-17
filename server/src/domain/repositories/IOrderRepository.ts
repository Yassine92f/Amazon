import { OrderStatus } from '@ecommerce/shared';
import { OrderEntity, OrderItemEntity, OrderShippingAddress } from '../entities/Order';

export interface CreateOrderData {
  userId: string;
  orderNumber: string;
  items: OrderItemEntity[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  deliveryType: OrderEntity['deliveryType'];
  shippingAddress: OrderShippingAddress;
}

export interface OrderListFilters {
  page: number;
  limit: number;
  status?: OrderStatus;
  fromDate?: Date;
  toDate?: Date;
}

export interface OrderListResult {
  orders: OrderEntity[];
  total: number;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  paymentIntentId?: string;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
}

export interface IOrderRepository {
  create(data: CreateOrderData): Promise<OrderEntity>;
  findById(id: string): Promise<OrderEntity | null>;
  findByUser(userId: string, filters: OrderListFilters): Promise<OrderListResult>;
  // Orders that contain at least one of the given product ids (seller scope).
  findByProductIds(productIds: string[], filters: OrderListFilters): Promise<OrderListResult>;
  updateById(id: string, data: UpdateOrderData): Promise<OrderEntity | null>;
  countByUser(userId: string): Promise<number>;
}
