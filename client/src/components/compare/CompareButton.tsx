'use client';

import { useEffect, useState } from 'react';
import { GitCompare, Check } from 'lucide-react';
import { useCompareStore, MAX_COMPARE } from '../../store/compare';
import { t } from '../../lib/i18n';
import type { ProductSummaryDto } from '../../lib/catalog';

export default function CompareButton({
  product,
  className = '',
}: {
  product: ProductSummaryDto;
  className?: string;
}) {
  const items = useCompareStore((s) => s.items);
  const toggle = useCompareStore((s) => s.toggle);

  // The store is persisted to localStorage; only trust it after hydration to
  // avoid a server/client markup mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = mounted && items.some((i) => i._id === product._id);
  const full = mounted && !active && items.length >= MAX_COMPARE;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(product);
      }}
      disabled={full}
      aria-pressed={active}
      title={full ? t.compare.full : active ? t.compare.remove : t.compare.add}
      className={`flex items-center justify-center gap-1.5 rounded-full border text-xs font-semibold shadow-sm transition-colors disabled:opacity-40 ${
        active
          ? 'border-brand-500 bg-brand-500 text-white'
          : 'border-border bg-white/90 text-brand-700 backdrop-blur hover:border-brand-300'
      } ${className}`}
    >
      {active ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <GitCompare className="h-3.5 w-3.5" aria-hidden />
      )}
    </button>
  );
}
