import mongoose from 'mongoose';
import {
  IMessageRepository,
  MessageListResult,
} from '../../domain/repositories/IMessageRepository';
import { MessageEntity } from '../../domain/entities/Conversation';
import { MessageModel, MessageDocument } from '../database/models/Conversation';

export class MessageRepository implements IMessageRepository {
  async create(data: {
    conversationId: string;
    senderId: string;
    content: string;
  }): Promise<MessageEntity> {
    const doc = await MessageModel.create({
      conversationId: new mongoose.Types.ObjectId(data.conversationId),
      senderId: new mongoose.Types.ObjectId(data.senderId),
      content: data.content,
    });
    return this.toEntity(doc);
  }

  async findByConversation(
    conversationId: string,
    filters: { page: number; limit: number },
  ): Promise<MessageListResult> {
    if (!mongoose.isValidObjectId(conversationId)) return { messages: [], total: 0 };
    const query = { conversationId: new mongoose.Types.ObjectId(conversationId) };
    const skip = (filters.page - 1) * filters.limit;
    const [docs, total] = await Promise.all([
      MessageModel.find(query).sort({ createdAt: 1 }).skip(skip).limit(filters.limit),
      MessageModel.countDocuments(query),
    ]);
    return { messages: docs.map((d) => this.toEntity(d)), total };
  }

  async markReadForReader(conversationId: string, readerId: string): Promise<void> {
    if (!mongoose.isValidObjectId(conversationId) || !mongoose.isValidObjectId(readerId)) return;
    await MessageModel.updateMany(
      {
        conversationId: new mongoose.Types.ObjectId(conversationId),
        senderId: { $ne: new mongoose.Types.ObjectId(readerId) },
        isRead: false,
      },
      { $set: { isRead: true } },
    );
  }

  async countUnread(conversationId: string, userId: string): Promise<number> {
    if (!mongoose.isValidObjectId(conversationId) || !mongoose.isValidObjectId(userId)) return 0;
    return MessageModel.countDocuments({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      senderId: { $ne: new mongoose.Types.ObjectId(userId) },
      isRead: false,
    });
  }

  private toEntity(doc: MessageDocument): MessageEntity {
    return {
      id: (doc._id as { toString: () => string }).toString(),
      conversationId: doc.conversationId.toString(),
      senderId: doc.senderId.toString(),
      content: doc.content,
      isRead: doc.isRead,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
