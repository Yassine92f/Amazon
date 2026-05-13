import mongoose from 'mongoose';
import { IConversationRepository } from '../../domain/repositories/IConversationRepository';
import { ConversationEntity } from '../../domain/entities/Conversation';
import { ConversationModel, ConversationDocument } from '../database/models/Conversation';

export class ConversationRepository implements IConversationRepository {
  async findById(id: string): Promise<ConversationEntity | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await ConversationModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByParticipants(userA: string, userB: string): Promise<ConversationEntity | null> {
    if (!mongoose.isValidObjectId(userA) || !mongoose.isValidObjectId(userB)) return null;
    const doc = await ConversationModel.findOne({
      participants: { $all: [userA, userB], $size: 2 },
    });
    return doc ? this.toEntity(doc) : null;
  }

  async create(participants: string[]): Promise<ConversationEntity> {
    const doc = await ConversationModel.create({
      participants: participants.map((p) => new mongoose.Types.ObjectId(p)),
    });
    return this.toEntity(doc);
  }

  async findByUser(userId: string): Promise<ConversationEntity[]> {
    if (!mongoose.isValidObjectId(userId)) return [];
    const docs = await ConversationModel.find({ participants: userId }).sort({
      lastMessageAt: -1,
      updatedAt: -1,
    });
    return docs.map((d) => this.toEntity(d));
  }

  async updateLastMessage(id: string, lastMessage: string, lastMessageAt: Date): Promise<void> {
    if (!mongoose.isValidObjectId(id)) return;
    await ConversationModel.updateOne({ _id: id }, { $set: { lastMessage, lastMessageAt } });
  }

  private toEntity(doc: ConversationDocument): ConversationEntity {
    return {
      id: (doc._id as { toString: () => string }).toString(),
      participants: doc.participants.map((p) => p.toString()),
      lastMessage: doc.lastMessage,
      lastMessageAt: doc.lastMessageAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
