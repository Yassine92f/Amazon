import { NotificationType, PaginatedResponse } from '@ecommerce/shared';
import { IConversationRepository } from '../../domain/repositories/IConversationRepository';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IRealtimeGateway } from '../../domain/services/IRealtimeGateway';
import { ConversationEntity, MessageEntity } from '../../domain/entities/Conversation';
import { NotificationUseCase } from './NotificationUseCase';

export interface ConversationDto {
  _id: string;
  otherUser: { id: string; name: string; avatar?: string };
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface MessageDto {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export type MessagesResult = PaginatedResponse<MessageDto> & { conversation: ConversationDto };

export class MessagingUseCase {
  constructor(
    private conversationRepo: IConversationRepository,
    private messageRepo: IMessageRepository,
    private userRepo: IUserRepository,
    private notifications: NotificationUseCase,
    private gateway: IRealtimeGateway,
  ) {}

  async startConversation(userId: string, otherUserId: string): Promise<ConversationDto> {
    if (userId === otherUserId) {
      throw new MessagingError(400, 'Vous ne pouvez pas démarrer une conversation avec vous-même');
    }
    const other = await this.userRepo.findById(otherUserId);
    if (!other) throw new MessagingError(404, 'Utilisateur introuvable');

    const existing = await this.conversationRepo.findByParticipants(userId, otherUserId);
    const conversation = existing ?? (await this.conversationRepo.create([userId, otherUserId]));
    return this.toConversationDto(conversation, userId);
  }

  async listConversations(userId: string): Promise<ConversationDto[]> {
    const conversations = await this.conversationRepo.findByUser(userId);
    return Promise.all(conversations.map((c) => this.toConversationDto(c, userId)));
  }

  async getMessages(
    userId: string,
    conversationId: string,
    filters: { page: number; limit: number },
  ): Promise<MessagesResult> {
    const conversation = await this.requireParticipant(conversationId, userId);
    const { messages, total } = await this.messageRepo.findByConversation(conversationId, filters);
    // Opening the thread marks the other party's messages as read.
    await this.messageRepo.markReadForReader(conversationId, userId);

    const totalPages = Math.ceil(total / filters.limit);
    return {
      conversation: await this.toConversationDto(conversation, userId, 0),
      items: messages.map((m) => this.toMessageDto(m)),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
      hasNext: filters.page < totalPages,
      hasPrev: filters.page > 1,
    };
  }

  async sendMessage(userId: string, conversationId: string, content: string): Promise<MessageDto> {
    const trimmed = content.trim();
    if (!trimmed) throw new MessagingError(400, 'Le message ne peut pas être vide');
    const conversation = await this.requireParticipant(conversationId, userId);

    const message = await this.messageRepo.create({
      conversationId,
      senderId: userId,
      content: trimmed,
    });
    const now = message.createdAt;
    await this.conversationRepo.updateLastMessage(conversationId, trimmed, now);

    const sender = await this.userRepo.findById(userId);
    const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Utilisateur';
    const recipientId = conversation.participants.find((p) => p !== userId);

    // Live delivery: to everyone viewing the thread and to the recipient's user room.
    const payload = {
      conversationId,
      senderId: userId,
      senderName,
      content: trimmed,
      createdAt: now.toISOString(),
    };
    this.gateway.emitToConversation(conversationId, 'message:new', payload);
    if (recipientId) {
      this.gateway.emitToUser(recipientId, 'message:new', payload);
      // Persistent notification for the recipient (also pushes notification:new).
      await this.notifications.create({
        userId: recipientId,
        type: NotificationType.NEW_MESSAGE,
        title: `Nouveau message de ${senderName}`,
        message: trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed,
        link: `/messages/${conversationId}`,
      });
    }

    return this.toMessageDto(message);
  }

  async totalUnread(userId: string): Promise<number> {
    const conversations = await this.conversationRepo.findByUser(userId);
    const counts = await Promise.all(
      conversations.map((c) => this.messageRepo.countUnread(c.id, userId)),
    );
    return counts.reduce((sum, n) => sum + n, 0);
  }

  private async requireParticipant(
    conversationId: string,
    userId: string,
  ): Promise<ConversationEntity> {
    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) throw new MessagingError(404, 'Conversation introuvable');
    if (!conversation.participants.includes(userId)) {
      throw new MessagingError(403, 'Vous ne faites pas partie de cette conversation');
    }
    return conversation;
  }

  private async toConversationDto(
    c: ConversationEntity,
    userId: string,
    unreadOverride?: number,
  ): Promise<ConversationDto> {
    const otherId = c.participants.find((p) => p !== userId) ?? '';
    const other = otherId ? await this.userRepo.findById(otherId) : null;
    const unreadCount =
      unreadOverride !== undefined
        ? unreadOverride
        : await this.messageRepo.countUnread(c.id, userId);
    return {
      _id: c.id,
      otherUser: {
        id: otherId,
        name: other ? `${other.firstName} ${other.lastName}` : 'Utilisateur supprimé',
        avatar: other?.avatar,
      },
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt?.toISOString(),
      unreadCount,
    };
  }

  private toMessageDto(m: MessageEntity): MessageDto {
    return {
      _id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      isRead: m.isRead,
      createdAt: m.createdAt.toISOString(),
    };
  }
}

export class MessagingError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, MessagingError.prototype);
  }
}
