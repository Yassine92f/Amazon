import { ConversationEntity } from '../entities/Conversation';

export interface IConversationRepository {
  findById(id: string): Promise<ConversationEntity | null>;
  // Existing 1:1 conversation between exactly these two users, if any.
  findByParticipants(userA: string, userB: string): Promise<ConversationEntity | null>;
  create(participants: string[]): Promise<ConversationEntity>;
  // All conversations a user takes part in, most recently active first.
  findByUser(userId: string): Promise<ConversationEntity[]>;
  updateLastMessage(id: string, lastMessage: string, lastMessageAt: Date): Promise<void>;
}
