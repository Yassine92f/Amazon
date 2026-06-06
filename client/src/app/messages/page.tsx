'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import Header from '../../components/Header';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useMessagingStore } from '../../store/messaging';
import { t, formatRelativeTime } from '../../lib/i18n';

function ConversationsInner() {
  const { conversations, isLoading, loadConversations } = useMessagingStore();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <main className="container-main py-8">
      <h1 className="text-2xl font-extrabold text-brand-900">{t.messages.title}</h1>
      <p className="mt-1 text-sm text-muted">{t.messages.subtitle}</p>

      {isLoading && conversations.length === 0 ? (
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-white py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
            <MessageSquare className="h-10 w-10 text-brand-300" aria-hidden />
          </div>
          <div>
            <p className="text-lg font-bold text-brand-900">{t.messages.empty}</p>
            <p className="mt-1 text-sm text-muted">{t.messages.emptyDesc}</p>
          </div>
          <Link
            href="/sellers"
            className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600"
          >
            {t.messages.browseSellers}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {conversations.map((c) => (
            <li key={c._id}>
              <Link
                href={`/messages/${c._id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-300"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {c.otherUser.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-brand-900">
                      {c.otherUser.name}
                    </span>
                    {c.lastMessageAt && (
                      <span className="shrink-0 text-[11px] text-muted">
                        {formatRelativeTime(c.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-0.5 truncate text-sm ${
                      c.unreadCount > 0 ? 'font-semibold text-brand-900' : 'text-muted'
                    }`}
                  >
                    {c.lastMessage ?? '—'}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="flex h-[20px] min-w-[20px] shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">
                    {c.unreadCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <Header />
      <ConversationsInner />
    </ProtectedRoute>
  );
}
