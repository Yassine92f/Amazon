export interface ConversationEntity {
  id: string;
  // Exactly two user ids for a 1:1 buyer <-> seller conversation.
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageEntity {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
