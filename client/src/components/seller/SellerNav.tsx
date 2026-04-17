'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { t } from '../../lib/i18n';

const TABS = [
  { href: '/seller', label: t.seller.dashboard },
  { href: '/seller/products', label: t.seller.products },
  { href: '/seller/orders', label: t.seller.orders },
  { href: '/seller/reviews', label: t.seller.reviews },
  { href: '/seller/settings', label: t.seller.settings },
];

export default function SellerNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/seller') return pathname === '/seller';
    return pathname.startsWith(href);
  };

  return (
    <nav className="border-b border-border bg-white">
      <div className="container-main flex items-center gap-1 overflow-x-auto px-2">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`shrink-0 border-b-2 px-3 py-3.5 text-sm font-semibold ${
                active
                  ? 'border-brand-500 text-brand-700'
                  : 'border-transparent text-text hover:text-brand-700'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
