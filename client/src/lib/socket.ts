import { io, type Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@ecommerce/shared';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5001';

let socket: AppSocket | null = null;

/** The current socket instance (may be null before connect / after disconnect). */
export function getSocket(): AppSocket | null {
  return socket;
}

/** Connect (or reuse) the authenticated socket. The JWT travels in the handshake. */
export function connectSocket(token: string): AppSocket {
  if (socket) {
    if (!socket.connected) socket.connect();
    return socket;
  }
  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
