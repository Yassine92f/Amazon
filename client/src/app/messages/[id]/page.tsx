'use client';

import { use, useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, Send } from 'lucide-react';
import type { MessagePayload } from '@ecommerce/shared';
import Header from '../../../components/Header';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { useAuthStore } from '../../../store';
import { useMessagingStore } from '../../../store/messaging';
import {
  getMessages,
  sendMessage as restSend,
  type MessageDto,
  type ConversationDto,
} from '../../../lib/realtime';
import { getSocket } from '../../../lib/socket';
import { t, formatTime } from '../../../lib/i18n';

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `live-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

function ThreadInner({ id }: { id: string }) {
  const currentUserId = useAuthStore((s) => s.user?._id);
  const { setActive, refreshUnread, loadConversations } = useMessagingStore();

  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [conversation, setConversation] = useState<ConversationDto | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }, []);

  // Load history + mark read, register as the active thread.
  useEffect(() => {
    let cancelled = false;
    setActive(id);
    getMessages(id, { limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setMessages(res.items);
        setConversation(res.conversation);
        setLoading(false);
        refreshUnread();
        scrollToBottom();
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      setActive(null);
      refreshUnread();
      loadConversations();
    };
  }, [id, setActive, refreshUnread, loadConversations, scrollToBottom]);

  // Live message + typing for this conversation.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('room:join', id);

    const onMessage = (payload: MessagePayload) => {
      if (payload.conversationId !== id) return;
      setMessages((prev) => [
        ...prev,
        {
          _id: uid(),
          conversationId: id,
          senderId: payload.senderId,
          content: payload.content,
          isRead: true,
          createdAt: payload.createdAt,
        },
      ]);
      scrollToBottom();
    };
    const onTyping = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId !== id || payload.userId === currentUserId) return;
      setOtherTyping(true);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setOtherTyping(false), 2500);
    };

    socket.on('message:new', onMessage as never);
    socket.on('message:typing', onTyping as never);
    return () => {
      socket.emit('room:leave', id);
      socket.off('message:new', onMessage as never);
      socket.off('message:typing', onTyping as never);
    };
  }, [id, currentUserId, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    setInput('');
    setError(null);
    const socket = getSocket();
    if (socket && socket.connected) {
      // The server echoes message:new to the room, so we don't append here.
      socket.emit('message:send', { conversationId: id, content }, (ok: boolean) => {
        if (!ok) setError(t.messages.sendError);
      });
    } else {
      try {
        const msg = await restSend(id, content);
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      } catch {
        setError(t.messages.sendError);
      }
    }
  };

  const handleTyping = (value: string) => {
    setInput(value);
    const socket = getSocket();
    const now = Date.now();
    if (socket && socket.connected && now - lastTypingSent.current > 1500) {
      lastTypingSent.current = now;
      socket.emit('message:typing', id);
    }
  };

  if (loading) {
    return (
      <div className="container-main flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container-main py-24 text-center">
        <p className="text-lg font-bold text-brand-900">{t.messages.empty}</p>
        <Link
          href="/messages"
          className="mt-4 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          {t.messages.back}
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4 sm:px-6">
      {/* Thread header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border py-4">
        <Link
          href="/messages"
          aria-label={t.messages.back}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-brand-50 hover:text-brand-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
          {conversation?.otherUser.name.charAt(0).toUpperCase() ?? '?'}
        </span>
        <div>
          <p className="font-bold text-brand-900">{conversation?.otherUser.name}</p>
          {otherTyping && <p className="text-xs text-brand-600">{t.messages.typing}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto py-5">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">{t.messages.threadEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((m) => {
              const mine = m.senderId === currentUserId;
              return (
                <li key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                      mine
                        ? 'rounded-br-sm bg-brand-500 text-white'
                        : 'rounded-bl-sm border border-border bg-white text-text'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <span
                      className={`mt-0.5 block text-right text-[10px] ${
                        mine ? 'text-white/70' : 'text-muted'
                      }`}
                    >
                      {formatTime(m.createdAt)}
                    </span>
                  </motion.div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer — always pinned at the bottom of the viewport */}
      <form onSubmit={handleSend} className="shrink-0 border-t border-border py-4">
        {error && <p className="mb-2 text-xs font-medium text-[var(--color-error)]">{error}</p>}
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder={t.messages.placeholder}
            className="h-11 flex-1 rounded-full border border-border bg-white px-4 text-sm outline-none focus:border-brand-400"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label={t.messages.send}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            <Send className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </form>
    </main>
  );
}

export default function MessageThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      {/* Lock the viewport height so the composer stays pinned and only the
          message list scrolls. */}
      <div className="flex h-[100dvh] flex-col overflow-hidden">
        <div className="shrink-0">
          <Header />
        </div>
        <ThreadInner id={id} />
      </div>
    </ProtectedRoute>
  );
}
