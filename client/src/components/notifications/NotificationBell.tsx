'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Package, MessageSquare, Star, Tag, CheckCheck } from 'lucide-react';
import { NotificationType } from '@ecommerce/shared';
import { useNotificationStore } from '../../store/notifications';
import { t, formatRelativeTime } from '../../lib/i18n';

const ICONS: Record<NotificationType, typeof Package> = {
  [NotificationType.ORDER_CONFIRMED]: Package,
  [NotificationType.ORDER_SHIPPED]: Package,
  [NotificationType.ORDER_DELIVERED]: Package,
  [NotificationType.NEW_REVIEW]: Star,
  [NotificationType.NEW_MESSAGE]: MessageSquare,
  [NotificationType.PRICE_DROP]: Tag,
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { items, unread, isLoading, load, markRead, markAll } = useNotificationStore();

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleClick = (id: string, link?: string) => {
    markRead(id);
    setOpen(false);
    if (link) router.push(link);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.header.notifications}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-50 hover:text-brand-600"
      >
        <Bell className="h-[22px] w-[22px]" aria-hidden />
        {unread > 0 && (
          <motion.span
            key={unread}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-white shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-extrabold text-brand-900">{t.notifications.title}</span>
              {items.some((n) => !n.isRead) && (
                <button
                  type="button"
                  onClick={() => markAll()}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                  {t.notifications.markAll}
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {isLoading && items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">
                  {t.notifications.loading}
                </p>
              ) : items.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                    <Bell className="h-6 w-6 text-brand-300" aria-hidden />
                  </div>
                  <p className="text-sm font-semibold text-brand-900">{t.notifications.empty}</p>
                  <p className="mt-1 text-xs text-muted">{t.notifications.emptyDesc}</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((n) => {
                    const Icon = ICONS[n.type] ?? Bell;
                    return (
                      <li key={n._id}>
                        <button
                          type="button"
                          onClick={() => handleClick(n._id, n.link)}
                          className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50 ${
                            n.isRead ? '' : 'bg-brand-50/40'
                          }`}
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-semibold text-brand-900">
                                {n.title}
                              </span>
                              {!n.isRead && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                              )}
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-xs text-muted">
                              {n.message}
                            </span>
                            <span className="mt-1 block text-[11px] text-muted">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
