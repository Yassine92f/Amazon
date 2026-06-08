'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, GitCompare, ArrowRight } from 'lucide-react';
import { useCompareStore } from '../../store/compare';
import { t, formatNumber } from '../../lib/i18n';

export default function CompareBar() {
  const items = useCompareStore((s) => s.items);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || items.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-3 md:bottom-4">
      <div className="container-main">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3 shadow-lg">
          <span className="hidden shrink-0 items-center gap-2 pl-1 text-sm font-bold text-brand-900 sm:flex">
            <GitCompare className="h-4 w-4 text-brand-500" aria-hidden />
            {t.compare.bar(formatNumber(items.length))}
          </span>

          <ul className="flex flex-1 items-center gap-2 overflow-x-auto">
            {items.map((p) => (
              <li
                key={p._id}
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-[var(--color-bg)]"
              >
                <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => remove(p._id)}
                  aria-label={t.compare.remove}
                  className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl-md bg-black/60 text-white"
                >
                  <X className="h-2.5 w-2.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={clear}
            className="hidden shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-muted hover:text-text sm:block"
          >
            {t.compare.clear}
          </button>
          <Link
            href="/compare"
            className="flex shrink-0 items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600"
          >
            {t.compare.view}
            <span className="rounded-full bg-white/25 px-1.5 text-xs">{items.length}</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
