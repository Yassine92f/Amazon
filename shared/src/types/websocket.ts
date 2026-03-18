import { OrderStatus } from './order';
import { NotificationType } from './notification';

// ── Server → Client events ──────────────────────────────────

export interface ServerToClientEvents {
  'notification:new': (payload: NotificationPayload) => void;
  'order:status-updated': (payload: OrderStatusPayload) => void;
  'cart:updated': (payload: CartUpdatedPayload) => void;
  'message:new': (payload: MessagePayload) => void;
  'product:price-drop': (payload: PriceDropPayload) => void;
}

// ── Client → Server events ──────────────────────────────────

export interface ClientToServerEvents {
  'notification:mark-read': (notificationId: string) => void;
  'message:send': (payload: SendMessagePayload, callback: (success: boolean) => void) => void;
  'message:typing': (conversationId: string) => void;
  'room:join': (roomId: string) => void;
  'room:leave': (roomId: string) => void;
}

// ── Event payloads ──────────────────────────────────────────

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  createdAt: string;
}

export interface OrderStatusPayload {
  orderId: string;
  orderNumber: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  updatedAt: string;
}

export interface CartUpdatedPayload {
  itemCount: number;
  totalAmount: number;
}

export interface MessagePayload {
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface PriceDropPayload {
  productId: string;
  productName: string;
  previousPrice: number;
  newPrice: number;
  image?: string;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
}
