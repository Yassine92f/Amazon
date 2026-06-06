/**
 * REST services for notifications and messaging. Live updates arrive over the
 * socket (see lib/socket.ts); these endpoints load history and counts and
 * persist reads/sends.
 */
import type { Notification } from '@ecommerce/shared';
import { api } from './api';
import type { PaginatedResponse } from './catalog';

/* ── Notifications ─────────────────────────────────────────────────────── */

export async function listNotifications(
  params: { page?: number; limit?: number; unreadOnly?: boolean } = {},
): Promise<PaginatedResponse<Notification>> {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.unreadOnly) query.unreadOnly = 'true';
  const { data } = await api.get('/notifications', { params: query });
  return data.data;
}

export async function notificationsUnreadCount(): Promise<number> {
  const { data } = await api.get('/notifications/unread-count');
  return data.data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

/* ── Messaging ─────────────────────────────────────────────────────────── */

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

export async function listConversations(): Promise<ConversationDto[]> {
  const { data } = await api.get('/messages/conversations');
  return data.data;
}

export async function startConversation(userId: string): Promise<ConversationDto> {
  const { data } = await api.post('/messages/conversations', { userId });
  return data.data;
}

export async function getMessages(
  conversationId: string,
  params: { page?: number; limit?: number } = {},
): Promise<MessagesResult> {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  const { data } = await api.get(`/messages/conversations/${conversationId}`, { params: query });
  return data.data;
}

export async function sendMessage(conversationId: string, content: string): Promise<MessageDto> {
  const { data } = await api.post(`/messages/conversations/${conversationId}`, { content });
  return data.data;
}

export async function messagesUnreadCount(): Promise<number> {
  const { data } = await api.get('/messages/unread-count');
  return data.data.count;
}
