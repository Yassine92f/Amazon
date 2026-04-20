'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '../../lib/i18n';

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-text hover:bg-gray-50 disabled:opacity-40"
        aria-label={t.common.previous}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ell-${i}`} className="px-1.5 text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`flex h-9 min-w-[36px] items-center justify-center rounded-md px-3 text-sm ${
              p === page
                ? 'bg-brand-500 font-bold text-white'
                : 'border border-border bg-white font-semibold text-text hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-text hover:bg-gray-50 disabled:opacity-40"
        aria-label={t.common.next}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function buildPageList(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, page, page - 1, page + 1]);
  const sorted = Array.from(set)
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    out.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) out.push('…');
  }
  return out;
}
