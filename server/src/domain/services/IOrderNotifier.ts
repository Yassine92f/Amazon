import { OrderStatus } from '@ecommerce/shared';

export interface OrderStatusChange {
  userId: string;
  orderId: string;
  orderNumber: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
}

// Port the OrderUseCase depends on to fire buyer notifications on status changes,
// without knowing about persistence or sockets. Implemented by NotificationUseCase.
export interface IOrderNotifier {
  orderStatusChanged(change: OrderStatusChange): Promise<void>;
}
