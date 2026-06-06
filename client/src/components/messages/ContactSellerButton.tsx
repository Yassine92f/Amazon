'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store';
import { startConversation } from '../../lib/realtime';
import { t } from '../../lib/i18n';

interface Props {
  sellerUserId: string;
  className?: string;
}

/** Opens (or reuses) a conversation with a seller and navigates to the thread. */
export default function ContactSellerButton({ sellerUserId, className }: Props) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Don't let a seller message their own shop.
  if (isAuthenticated && user?._id === sellerUserId) return null;

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent('/messages')}`);
      return;
    }
    setLoading(true);
    try {
      const conversation = await startConversation(sellerUserId);
      router.push(`/messages/${conversation._id}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        'inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-text transition-colors hover:border-brand-300 disabled:opacity-60'
      }
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      ) : (
        <MessageSquare className="h-4 w-4 text-brand-500" aria-hidden />
      )}
      {t.messages.contactSeller}
    </button>
  );
}
