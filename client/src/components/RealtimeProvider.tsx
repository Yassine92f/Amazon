'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store';
import { useNotificationStore } from '../store/notifications';
import { useMessagingStore } from '../store/messaging';
import { connectSocket, disconnectSocket } from '../lib/socket';

/**
 * Owns the realtime lifecycle: when a user is authenticated it opens the socket,
 * loads unread badges, and routes live `notification:new` / `message:new` events
 * into the notification and messaging stores. On logout it tears everything down.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?._id);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      useNotificationStore.getState().reset();
      useMessagingStore.getState().reset();
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    const socket = connectSocket(token);

    // Initial badge counts.
    useNotificationStore.getState().refreshUnread();
    useMessagingStore.getState().refreshUnread();

    const onNotification = (payload: Parameters<Parameters<typeof socket.on>[1]>[0]) => {
      useNotificationStore.getState().pushLive(payload as never);
    };
    const onMessage = (payload: unknown) => {
      if (userId) useMessagingStore.getState().applyIncoming(payload as never, userId);
    };

    socket.on('notification:new', onNotification as never);
    socket.on('message:new', onMessage as never);

    return () => {
      socket.off('notification:new', onNotification as never);
      socket.off('message:new', onMessage as never);
    };
  }, [isAuthenticated, userId]);

  return <>{children}</>;
}
