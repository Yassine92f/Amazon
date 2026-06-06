import { Notification, NotificationType, OrderStatus, PaginatedResponse } from '@ecommerce/shared';
import {
  INotificationRepository,
  CreateNotificationData,
} from '../../domain/repositories/INotificationRepository';
import { IRealtimeGateway } from '../../domain/services/IRealtimeGateway';
import { IOrderNotifier, OrderStatusChange } from '../../domain/services/IOrderNotifier';
import { NotificationEntity } from '../../domain/entities/Notification';

export class NotificationUseCase implements IOrderNotifier {
  constructor(
    private repo: INotificationRepository,
    private gateway: IRealtimeGateway,
  ) {}

  // Persist a notification and push it live to its owner.
  async create(data: CreateNotificationData): Promise<Notification> {
    const n = await this.repo.create(data);
    this.gateway.emitToUser(n.userId, 'notification:new', this.toPayload(n));
    return this.toDto(n);
  }

  async list(
    userId: string,
    filters: { page: number; limit: number; unreadOnly?: boolean },
  ): Promise<PaginatedResponse<Notification>> {
    const { notifications, total } = await this.repo.findByUser(userId, filters);
    const totalPages = Math.ceil(total / filters.limit);
    return {
      items: notifications.map((n) => this.toDto(n)),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
      hasNext: filters.page < totalPages,
      hasPrev: filters.page > 1,
    };
  }

  async unreadCount(userId: string): Promise<number> {
    return this.repo.countUnread(userId);
  }

  async markRead(userId: string, id: string): Promise<Notification | null> {
    const n = await this.repo.markRead(userId, id);
    return n ? this.toDto(n) : null;
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.markAllRead(userId);
  }

  // ── IOrderNotifier ────────────────────────────────────────────────────
  async orderStatusChanged(change: OrderStatusChange): Promise<void> {
    const meta = this.orderMeta(change.newStatus, change.orderNumber);
    if (meta) {
      await this.create({
        userId: change.userId,
        type: meta.type,
        title: meta.title,
        message: meta.message,
        link: `/orders/${change.orderId}`,
      });
    }
    this.gateway.emitToUser(change.userId, 'order:status-updated', {
      orderId: change.orderId,
      orderNumber: change.orderNumber,
      previousStatus: change.previousStatus,
      newStatus: change.newStatus,
      updatedAt: new Date().toISOString(),
    });
  }

  // Only customer-meaningful transitions get a persisted notification.
  private orderMeta(
    status: OrderStatus,
    orderNumber: string,
  ): { type: NotificationType; title: string; message: string } | null {
    switch (status) {
      case OrderStatus.CONFIRMED:
        return {
          type: NotificationType.ORDER_CONFIRMED,
          title: 'Commande confirmée',
          message: `Votre commande ${orderNumber} a été confirmée.`,
        };
      case OrderStatus.SHIPPED:
        return {
          type: NotificationType.ORDER_SHIPPED,
          title: 'Commande expédiée',
          message: `Votre commande ${orderNumber} a été expédiée.`,
        };
      case OrderStatus.DELIVERED:
        return {
          type: NotificationType.ORDER_DELIVERED,
          title: 'Commande livrée',
          message: `Votre commande ${orderNumber} a été livrée.`,
        };
      default:
        return null;
    }
  }

  private toPayload(n: NotificationEntity) {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      createdAt: n.createdAt.toISOString(),
    };
  }

  private toDto(n: NotificationEntity): Notification {
    return {
      _id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    };
  }
}
