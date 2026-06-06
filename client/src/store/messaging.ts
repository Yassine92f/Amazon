import { create } from 'zustand';
import type { MessagePayload } from '@ecommerce/shared';
import { listConversations, messagesUnreadCount, type ConversationDto } from '../lib/realtime';

interface MessagingState {
  conversations: ConversationDto[];
  unreadTotal: number;
  isLoading: boolean;
  /** The thread currently open (messages there are marked read on arrival). */
  activeConversationId: string | null;

  setActive: (id: string | null) => void;
  loadConversations: () => Promise<void>;
  refreshUnread: () => Promise<void>;
  /** Apply a live incoming message pushed over the socket. */
  applyIncoming: (payload: MessagePayload, currentUserId: string) => void;
  reset: () => void;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  conversations: [],
  unreadTotal: 0,
  isLoading: false,
  activeConversationId: null,

  setActive: (id) => set({ activeConversationId: id }),

  loadConversations: async () => {
    set({ isLoading: true });
    try {
      const conversations = await listConversations();
      set({ conversations, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  refreshUnread: async () => {
    try {
      set({ unreadTotal: await messagesUnreadCount() });
    } catch {
      /* ignore */
    }
  },

  applyIncoming: (payload, currentUserId) => {
    const fromOther = payload.senderId !== currentUserId;
    const isActive = payload.conversationId === get().activeConversationId;
    const countsAsUnread = fromOther && !isActive;

    set((s) => {
      const existing = s.conversations.find((c) => c._id === payload.conversationId);
      let conversations = s.conversations;
      if (existing) {
        const updated: ConversationDto = {
          ...existing,
          lastMessage: payload.content,
          lastMessageAt: payload.createdAt,
          unreadCount: countsAsUnread ? existing.unreadCount + 1 : existing.unreadCount,
        };
        conversations = [
          updated,
          ...s.conversations.filter((c) => c._id !== payload.conversationId),
        ];
      }
      return {
        conversations,
        unreadTotal: countsAsUnread ? s.unreadTotal + 1 : s.unreadTotal,
      };
    });

    // If the conversation isn't in the list yet (brand-new), pull a fresh list.
    if (!get().conversations.some((c) => c._id === payload.conversationId)) {
      get().loadConversations();
    }
  },

  reset: () => set({ conversations: [], unreadTotal: 0, activeConversationId: null }),
}));
