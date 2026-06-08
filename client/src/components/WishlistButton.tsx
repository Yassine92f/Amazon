'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useAuthStore } from '../store';
import { useWishlistStore } from '../store/wishlist';
import { t } from '../lib/i18n';

export default function WishlistButton({
  productId,
  className = '',
}: {
  productId: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const ids = useWishlistStore((s) => s.ids);
  const toggle = useWishlistStore((s) => s.toggle);
  const pendingId = useWishlistStore((s) => s.pendingId);

  const active = ids.has(productId);
  const pending = pendingId === productId;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        toggle(productId).catch(() => {});
      }}
      disabled={pending}
      aria-pressed={active}
      title={active ? t.wishlist.added : t.wishlist.add}
      aria-label={active ? t.wishlist.added : t.wishlist.add}
      className={`flex items-center justify-center rounded-full border shadow-sm transition-colors disabled:opacity-40 ${
        active
          ? 'border-brand-500 bg-brand-500 text-white'
          : 'border-border bg-white/90 text-brand-700 backdrop-blur hover:border-brand-300'
      } ${className}`}
    >
      <Heart className="h-3.5 w-3.5" fill={active ? 'currentColor' : 'none'} aria-hidden />
    </button>
  );
}
