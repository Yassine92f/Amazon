import { BaseEntity } from './common';

export enum NotificationType {
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  NEW_REVIEW = 'new_review',
  NEW_MESSAGE = 'new_message',
  PRICE_DROP = 'price_drop',
}

export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
}

// Messaging
export interface Message extends BaseEntity {
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
}

export interface Conversation extends BaseEntity {
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
}
