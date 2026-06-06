import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { config } from '../../config';
import { TokenService } from '../../infrastructure/services/TokenService';
import { socketGateway } from '../../infrastructure/realtime/SocketGateway';
import { NotificationUseCase } from '../../application/use-cases/NotificationUseCase';
import { MessagingUseCase } from '../../application/use-cases/MessagingUseCase';
import { NotificationRepository } from '../../infrastructure/repositories/NotificationRepository';
import { ConversationRepository } from '../../infrastructure/repositories/ConversationRepository';
import { MessageRepository } from '../../infrastructure/repositories/MessageRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

const tokenService = new TokenService();

/**
 * Wire socket.io onto the HTTP server: authenticate each connection with the JWT
 * access token, join the user to their personal room (`user:<id>`), and handle
 * conversation rooms, live message sending, typing and read receipts. The
 * SocketGateway singleton is given the io instance so use-cases can push events.
 */
export function initSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: config.clientUrl, credentials: true },
  });
  socketGateway.setServer(io);

  const notificationUseCase = new NotificationUseCase(new NotificationRepository(), socketGateway);
  const messagingUseCase = new MessagingUseCase(
    new ConversationRepository(),
    new MessageRepository(),
    new UserRepository(),
    notificationUseCase,
    socketGateway,
  );

  // Authenticate via the access token passed in the handshake.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('unauthorized'));
    try {
      const payload = tokenService.verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on('room:join', (roomId: unknown) => {
      if (typeof roomId === 'string') socket.join(`conversation:${roomId}`);
    });

    socket.on('room:leave', (roomId: unknown) => {
      if (typeof roomId === 'string') socket.leave(`conversation:${roomId}`);
    });

    socket.on('message:send', async (payload: unknown, callback?: unknown) => {
      const ack = typeof callback === 'function' ? (callback as (ok: boolean) => void) : undefined;
      const p = payload as { conversationId?: unknown; content?: unknown } | null;
      if (!p || typeof p.conversationId !== 'string' || typeof p.content !== 'string') {
        ack?.(false);
        return;
      }
      try {
        await messagingUseCase.sendMessage(userId, p.conversationId, p.content);
        ack?.(true);
      } catch {
        ack?.(false);
      }
    });

    socket.on('message:typing', (conversationId: unknown) => {
      if (typeof conversationId === 'string') {
        socket
          .to(`conversation:${conversationId}`)
          .emit('message:typing', { conversationId, userId });
      }
    });

    socket.on('notification:mark-read', async (notificationId: unknown) => {
      if (typeof notificationId === 'string') {
        await notificationUseCase.markRead(userId, notificationId).catch(() => undefined);
      }
    });
  });

  return io;
}
