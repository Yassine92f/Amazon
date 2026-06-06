# Section 4: real-time notifications & buyer/seller messaging

**Date:** 2026-06-06
**Author:** feature/notifications-messaging
**Type:** feature

## Context

Section 4 was the last unbuilt feature: real-time notifications and buyer <-> seller
messaging. The shared contracts already existed (`notification.ts`, `websocket.ts`
with typed Server/Client events and payloads), socket.io was installed, and the
`interfaces/websocket` folder was an empty placeholder. Everything else had to be
built across all layers.

## Decision

**Realtime transport.** A `SocketGateway` singleton holds the socket.io `Server`
and implements a domain port `IRealtimeGateway` (`emitToUser`, `emitToConversation`).
Use-cases depend only on the port, so application/domain never import socket.io.
The socket server (`interfaces/websocket/socketServer.ts`) authenticates each
handshake with the JWT access token, joins the user to a `user:<id>` room, and
handles `room:join/leave`, `message:send` (with ack), `message:typing`, and
`notification:mark-read`. `server.ts` now wraps Express in an `http.Server` so
socket.io shares the port.

**Notifications.** `Notification` model + repo; `NotificationUseCase`
(create/list/unread-count/mark-read/mark-all) persists and pushes `notification:new`
live. It also implements `IOrderNotifier`: `OrderUseCase.updateStatus` (optional
notifier dependency, so tests are unaffected) fires a buyer notification + an
`order:status-updated` event on confirmed/shipped/delivered.

**Messaging.** `Conversation` + `Message` models/repos; `MessagingUseCase`
(start/list/getMessages/sendMessage/unread). 1:1 buyer-seller conversations,
de-duplicated by participants. Sending persists the message, updates the
conversation, emits `message:new` to the conversation room and the recipient's
user room, and creates a `NEW_MESSAGE` notification. Opening a thread marks the
other party's messages read.

**Frontend.** socket.io-client singleton; a `RealtimeProvider` connects on auth,
loads unread badges, and routes live events into Zustand stores
(`notifications`, `messaging`). Header gains a notification bell (dropdown,
mark-all, deep links) and a messages icon, both with live unread badges. New
pages: `/messages` (conversation list) and `/messages/[id]` (thread with live
send via socket echo, typing indicator, auto-scroll, REST fallback). A
`ContactSellerButton` on the shop page starts/reuses a conversation. Full French
i18n.

## Why

- The gateway-as-port keeps the realtime mechanism out of the business layers and
  swappable, consistent with the project's hexagonal rules.
- Sending messages over the socket and rendering only the server echo means one
  source of truth and no optimistic/echo duplicates; a REST fallback covers a
  dropped socket.
- The order notifier is optional on `OrderUseCase` so the existing 69 tests keep
  passing without rewiring, while the HTTP route injects the real implementation.

## Alternatives considered

- **Optimistic append + socket echo** for messages: rejected (duplicate bubbles,
  no shared `_id` to dedupe). Echo-only is simpler and correct.
- **A separate notifications microservice / Redis pub-sub** for multi-instance
  fan-out: out of scope for a single-instance app; revisit with horizontal scaling
  (socket.io Redis adapter).

## Impact

- Server: 3 entities, 3 repos + models, `IRealtimeGateway`/`IOrderNotifier` ports,
  `SocketGateway`, `NotificationUseCase`, `MessagingUseCase`, notification +
  message controllers/routes, socket server, `server.ts` wiring, `OrderUseCase`
  notifier hook. **+8 unit tests; 77 server tests pass.** Verified end-to-end over
  HTTP: conversation + message + unread + `new_message` notification + mark-read.
- Shared: `message:typing` added to `ServerToClientEvents` (+`TypingPayload`).
- Client: socket client, realtime services, notification + messaging stores,
  `RealtimeProvider`, `NotificationBell`, `ContactSellerButton`, `/messages` pages,
  Header integration, i18n + relative-time helpers.

## Follow-ups

- Persisted notifications for `new_review` and `price_drop` (types exist; triggers
  not wired yet).
- socket.io Redis adapter when running more than one server instance.
- Message pagination / infinite scroll for very long threads (currently last 100).
