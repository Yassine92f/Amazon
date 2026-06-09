import { MessageEntity } from '../entities/Conversation';

export interface MessageListResult {
  messages: MessageEntity[];
  total: number;
}

export interface IMessageRepository {
  create(data: {
    conversationId: string;
    senderId: string;
    content: string;
  }): Promise<MessageEntity>;
  findByConversation(
    conversationId: string,
    filters: { page: number; limit: number },
  ): Promise<MessageListResult>;
  // Mark every message in the conversation NOT sent by `readerId` as read.
  markReadForReader(conversationId: string, readerId: string): Promise<void>;
  // Unread messages in a conversation for a given user (messages from the other party).
  countUnread(conversationId: string, userId: string): Promise<number>;
}
