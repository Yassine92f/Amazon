/**
 * Port for pushing real-time events to connected clients. The infrastructure
 * adapter (socket.io) implements it; use-cases depend only on this interface so
 * the application/domain layers never import socket.io.
 *
 * Event names and payload shapes are the shared WebSocket contract
 * (ServerToClientEvents in @ecommerce/shared).
 */
export interface IRealtimeGateway {
  // Emit to every socket the user has open (room `user:<id>`).
  emitToUser(userId: string, event: string, payload: unknown): void;
  // Emit to everyone in a conversation room (`conversation:<id>`).
  emitToConversation(conversationId: string, event: string, payload: unknown): void;
}
