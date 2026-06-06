import { NotificationType } from '@ecommerce/shared';
import { NotificationEntity } from '../entities/Notification';

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export interface NotificationListResult {
  notifications: NotificationEntity[];
  total: number;
}

export interface INotificationRepository {
  create(data: CreateNotificationData): Promise<NotificationEntity>;
  findByUser(
    userId: string,
    filters: { page: number; limit: number; unreadOnly?: boolean },
  ): Promise<NotificationListResult>;
  countUnread(userId: string): Promise<number>;
  markRead(userId: string, id: string): Promise<NotificationEntity | null>;
  markAllRead(userId: string): Promise<void>;
}
