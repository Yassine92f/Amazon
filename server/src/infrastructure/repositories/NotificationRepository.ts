import mongoose from 'mongoose';
import {
  INotificationRepository,
  CreateNotificationData,
  NotificationListResult,
} from '../../domain/repositories/INotificationRepository';
import { NotificationEntity } from '../../domain/entities/Notification';
import { NotificationModel, NotificationDocument } from '../database/models/Notification';

export class NotificationRepository implements INotificationRepository {
  async create(data: CreateNotificationData): Promise<NotificationEntity> {
    const doc = await NotificationModel.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
    });
    return this.toEntity(doc);
  }

  async findByUser(
    userId: string,
    filters: { page: number; limit: number; unreadOnly?: boolean },
  ): Promise<NotificationListResult> {
    if (!mongoose.isValidObjectId(userId)) return { notifications: [], total: 0 };
    const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
    if (filters.unreadOnly) query.isRead = false;
    const skip = (filters.page - 1) * filters.limit;
    const [docs, total] = await Promise.all([
      NotificationModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(filters.limit),
      NotificationModel.countDocuments(query),
    ]);
    return { notifications: docs.map((d) => this.toEntity(d)), total };
  }

  async countUnread(userId: string): Promise<number> {
    if (!mongoose.isValidObjectId(userId)) return 0;
    return NotificationModel.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    });
  }

  async markRead(userId: string, id: string): Promise<NotificationEntity | null> {
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(userId)) return null;
    const doc = await NotificationModel.findOneAndUpdate(
      { _id: id, userId: new mongoose.Types.ObjectId(userId) },
      { $set: { isRead: true } },
      { new: true },
    );
    return doc ? this.toEntity(doc) : null;
  }

  async markAllRead(userId: string): Promise<void> {
    if (!mongoose.isValidObjectId(userId)) return;
    await NotificationModel.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } },
    );
  }

  private toEntity(doc: NotificationDocument): NotificationEntity {
    return {
      id: (doc._id as { toString: () => string }).toString(),
      userId: doc.userId.toString(),
      type: doc.type,
      title: doc.title,
      message: doc.message,
      link: doc.link,
      isRead: doc.isRead,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
