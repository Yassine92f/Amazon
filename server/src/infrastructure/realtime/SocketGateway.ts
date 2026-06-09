import type { Server } from 'socket.io';
import { IRealtimeGateway } from '../../domain/services/IRealtimeGateway';

/**
 * Singleton adapter over the socket.io server. The server instance is injected
 * once at bootstrap (`setServer`); use-cases receive this gateway through the
 * IRealtimeGateway port and never import socket.io. Emits are no-ops until the
 * server is wired (e.g. in unit tests), so callers never need to guard.
 */
class SocketGateway implements IRealtimeGateway {
  private io: Server | null = null;

  setServer(io: Server): void {
    this.io = io;
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.io?.to(`user:${userId}`).emit(event, payload);
  }

  emitToConversation(conversationId: string, event: string, payload: unknown): void {
    this.io?.to(`conversation:${conversationId}`).emit(event, payload);
  }
}

export const socketGateway = new SocketGateway();
