import { NotificationType, OrderStatus } from '@ecommerce/shared';
import { NotificationUseCase } from '../../src/application/use-cases/NotificationUseCase';
import { MessagingUseCase } from '../../src/application/use-cases/MessagingUseCase';
import { INotificationRepository } from '../../src/domain/repositories/INotificationRepository';
import { IConversationRepository } from '../../src/domain/repositories/IConversationRepository';
import { IMessageRepository } from '../../src/domain/repositories/IMessageRepository';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';
import { IRealtimeGateway } from '../../src/domain/services/IRealtimeGateway';
import { NotificationEntity } from '../../src/domain/entities/Notification';
import { ConversationEntity, MessageEntity } from '../../src/domain/entities/Conversation';

function makeGateway(): IRealtimeGateway & {
  emitToUser: jest.Mock;
  emitToConversation: jest.Mock;
} {
  return { emitToUser: jest.fn(), emitToConversation: jest.fn() };
}

function makeNotifRepo(): INotificationRepository {
  const store: NotificationEntity[] = [];
  let seq = 0;
  return {
    create: jest.fn(async (data) => {
      const n: NotificationEntity = {
        id: `n-${++seq}`,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.push(n);
      return n;
    }),
    findByUser: jest.fn(async (userId) => {
      const items = store.filter((n) => n.userId === userId);
      return { notifications: items, total: items.length };
    }),
    countUnread: jest.fn(
      async (userId) => store.filter((n) => n.userId === userId && !n.isRead).length,
    ),
    markRead: jest.fn(async (userId, id) => {
      const n = store.find((x) => x.id === id && x.userId === userId);
      if (!n) return null;
      n.isRead = true;
      return n;
    }),
    markAllRead: jest.fn(async (userId) => {
      store.filter((n) => n.userId === userId).forEach((n) => (n.isRead = true));
    }),
  };
}

function makeConversationRepo(): IConversationRepository {
  const store: ConversationEntity[] = [];
  let seq = 0;
  return {
    findById: jest.fn(async (id) => store.find((c) => c.id === id) ?? null),
    findByParticipants: jest.fn(
      async (a, b) =>
        store.find((c) => c.participants.includes(a) && c.participants.includes(b)) ?? null,
    ),
    create: jest.fn(async (participants) => {
      const c: ConversationEntity = {
        id: `c-${++seq}`,
        participants,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.push(c);
      return c;
    }),
    findByUser: jest.fn(async (userId) => store.filter((c) => c.participants.includes(userId))),
    updateLastMessage: jest.fn(async (id, lastMessage, lastMessageAt) => {
      const c = store.find((x) => x.id === id);
      if (c) {
        c.lastMessage = lastMessage;
        c.lastMessageAt = lastMessageAt;
      }
    }),
  };
}

function makeMessageRepo(): IMessageRepository {
  const store: MessageEntity[] = [];
  let seq = 0;
  return {
    create: jest.fn(async (data) => {
      const m: MessageEntity = {
        id: `m-${++seq}`,
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.push(m);
      return m;
    }),
    findByConversation: jest.fn(async (conversationId) => {
      const messages = store.filter((m) => m.conversationId === conversationId);
      return { messages, total: messages.length };
    }),
    markReadForReader: jest.fn(async (conversationId, readerId) => {
      store
        .filter((m) => m.conversationId === conversationId && m.senderId !== readerId)
        .forEach((m) => (m.isRead = true));
    }),
    countUnread: jest.fn(
      async (conversationId, userId) =>
        store.filter(
          (m) => m.conversationId === conversationId && m.senderId !== userId && !m.isRead,
        ).length,
    ),
  };
}

function makeUserRepo(): IUserRepository {
  return {
    findById: jest.fn(async (id: string) =>
      id === 'ghost'
        ? null
        : ({ id, firstName: 'Jean', lastName: 'Test', email: `${id}@x.fr` } as never),
    ),
  } as unknown as IUserRepository;
}

describe('NotificationUseCase', () => {
  it('persists a notification and pushes it live', async () => {
    const gateway = makeGateway();
    const useCase = new NotificationUseCase(makeNotifRepo(), gateway);
    const dto = await useCase.create({
      userId: 'u1',
      type: NotificationType.NEW_MESSAGE,
      title: 'Hi',
      message: 'Hello',
    });
    expect(dto.title).toBe('Hi');
    expect(gateway.emitToUser).toHaveBeenCalledWith('u1', 'notification:new', expect.any(Object));
  });

  it('creates a notification + emits status event on a meaningful order change', async () => {
    const gateway = makeGateway();
    const repo = makeNotifRepo();
    const useCase = new NotificationUseCase(repo, gateway);
    await useCase.orderStatusChanged({
      userId: 'u1',
      orderId: 'o1',
      orderNumber: 'ORD-1',
      previousStatus: OrderStatus.CONFIRMED,
      newStatus: OrderStatus.SHIPPED,
    });
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(gateway.emitToUser).toHaveBeenCalledWith(
      'u1',
      'order:status-updated',
      expect.any(Object),
    );
  });

  it('emits status event but persists nothing for a non-customer-facing transition', async () => {
    const gateway = makeGateway();
    const repo = makeNotifRepo();
    const useCase = new NotificationUseCase(repo, gateway);
    await useCase.orderStatusChanged({
      userId: 'u1',
      orderId: 'o1',
      orderNumber: 'ORD-1',
      previousStatus: OrderStatus.CONFIRMED,
      newStatus: OrderStatus.PROCESSING,
    });
    expect(repo.create).not.toHaveBeenCalled();
    expect(gateway.emitToUser).toHaveBeenCalledWith(
      'u1',
      'order:status-updated',
      expect.any(Object),
    );
  });
});

describe('MessagingUseCase', () => {
  function setup() {
    const gateway = makeGateway();
    const conversationRepo = makeConversationRepo();
    const messageRepo = makeMessageRepo();
    const userRepo = makeUserRepo();
    const notifications = new NotificationUseCase(makeNotifRepo(), gateway);
    const useCase = new MessagingUseCase(
      conversationRepo,
      messageRepo,
      userRepo,
      notifications,
      gateway,
    );
    return { useCase, gateway, conversationRepo };
  }

  it('reuses an existing conversation instead of creating a duplicate', async () => {
    const { useCase, conversationRepo } = setup();
    const first = await useCase.startConversation('a', 'b');
    const second = await useCase.startConversation('a', 'b');
    expect(first._id).toBe(second._id);
    expect(conversationRepo.create).toHaveBeenCalledTimes(1);
  });

  it('rejects a conversation with oneself', async () => {
    const { useCase } = setup();
    await expect(useCase.startConversation('a', 'a')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects a conversation with an unknown user', async () => {
    const { useCase } = setup();
    await expect(useCase.startConversation('a', 'ghost')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('sends a message, emits it live and notifies the recipient', async () => {
    const { useCase, gateway } = setup();
    const conv = await useCase.startConversation('a', 'b');
    const msg = await useCase.sendMessage('a', conv._id, '  Bonjour  ');

    expect(msg.content).toBe('Bonjour'); // trimmed
    expect(gateway.emitToConversation).toHaveBeenCalledWith(
      conv._id,
      'message:new',
      expect.any(Object),
    );
    expect(gateway.emitToUser).toHaveBeenCalledWith('b', 'message:new', expect.any(Object));
    // NEW_MESSAGE notification to the recipient also pushes notification:new
    expect(gateway.emitToUser).toHaveBeenCalledWith('b', 'notification:new', expect.any(Object));
  });

  it('forbids sending to a conversation you are not part of', async () => {
    const { useCase } = setup();
    const conv = await useCase.startConversation('a', 'b');
    await expect(useCase.sendMessage('intruder', conv._id, 'hi')).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
