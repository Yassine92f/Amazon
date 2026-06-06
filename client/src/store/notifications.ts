import { create } from 'zustand';
import type { Notification, NotificationPayload } from '@ecommerce/shared';
import {
  listNotifications,
  notificationsUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../lib/realtime';

interface NotificationState {
  items: Notification[];
  unread: number;
  isLoading: boolean;
  loaded: boolean;

  load: () => Promise<void>;
  refreshUnread: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAll: () => Promise<void>;
  /** Apply a live notification pushed over the socket. */
  pushLive: (payload: NotificationPayload) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unread: 0,
  isLoading: false,
  loaded: false,

  load: async () => {
    set({ isLoading: true });
    try {
      const res = await listNotifications({ limit: 30 });
      set({ items: res.items, isLoading: false, loaded: true });
    } catch {
      set({ isLoading: false });
    }
  },

  refreshUnread: async () => {
    try {
      set({ unread: await notificationsUnreadCount() });
    } catch {
      /* ignore */
    }
  },

  markRead: async (id) => {
    const item = get().items.find((n) => n._id === id);
    if (item && item.isRead) return;
    set((s) => ({
      items: s.items.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      unread: Math.max(0, s.unread - 1),
    }));
    try {
      await markNotificationRead(id);
    } catch {
      /* optimistic; ignore */
    }
  },

  markAll: async () => {
    set((s) => ({ items: s.items.map((n) => ({ ...n, isRead: true })), unread: 0 }));
    try {
      await markAllNotificationsRead();
    } catch {
      /* ignore */
    }
  },

  pushLive: (payload) => {
    const notif: Notification = {
      _id: payload.id,
      userId: '',
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link,
      isRead: false,
      createdAt: payload.createdAt,
      updatedAt: payload.createdAt,
    };
    set((s) => ({
      items: [notif, ...s.items.filter((n) => n._id !== notif._id)].slice(0, 50),
      unread: s.unread + 1,
    }));
  },

  reset: () => set({ items: [], unread: 0, loaded: false }),
}));
