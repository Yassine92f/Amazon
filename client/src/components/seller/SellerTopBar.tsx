'use client';

import Link from 'next/link';
import { useAuthStore } from '../../store';
import { t } from '../../lib/i18n';

export default function SellerTopBar() {
  const user = useAuthStore((s) => s.user);
  const initial = user?.firstName?.charAt(0).toUpperCase() ?? 'S';

  return (
    <header className="border-b border-border bg-white">
      <div className="container-main flex items-center gap-4 py-3 md:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-lg font-extrabold text-white">
            A
          </span>
          <span className="hidden text-xl font-extrabold text-brand-900 sm:flex">Abracadabra</span>
        </Link>
        <span className="flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M3 6h14l-1 8H4L3 6zM5 4a2 2 0 014 0v2H5V4zm6 0a2 2 0 014 0v2h-4V4z" />
          </svg>
          {t.seller.hub}
        </span>
        <div className="flex-1" />
        <Link
          href="/"
          className="hidden text-xs font-semibold text-muted hover:text-brand-700 md:block"
        >
          {t.seller.backToMarketplace}
        </Link>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
          {initial}
        </span>
      </div>
    </header>
  );
}
