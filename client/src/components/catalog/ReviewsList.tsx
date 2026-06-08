'use client';

import { useEffect, useState } from 'react';
import StarRating from '../StarRating';
import Pagination from './Pagination';
import { t, formatLongDate } from '../../lib/i18n';
import { listProductReviews, type ReviewListResult } from '../../lib/catalog';

export default function ReviewsList({ productId }: { productId: string }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReviewListResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listProductReviews(productId, { page, limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, page]);

  if (loading && !data) return <div className="py-6 text-sm text-muted">{t.reviews.loading}</div>;
  if (!data || data.stats.total === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong bg-white p-8 text-center text-sm text-muted">
        {t.reviews.empty}
      </div>
    );
  }

  const maxBucket = Math.max(...data.stats.distribution.map((d) => d.count), 1);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <div className="rounded-lg border border-border bg-white p-5">
        <div className="mb-3 flex items-end gap-2">
          <span className="text-4xl font-extrabold text-brand-900">
            {data.stats.averageRating.toFixed(1)}
          </span>
          <span className="pb-1 text-xs text-muted">{t.reviews.outOf5}</span>
        </div>
        <StarRating rating={data.stats.averageRating} count={data.stats.total} />
        <ul className="mt-4 flex flex-col gap-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const bucket = data.stats.distribution.find((b) => b.stars === stars);
            const count = bucket?.count ?? 0;
            const pct = (count / maxBucket) * 100;
            return (
              <li key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted">{stars}</span>
                <svg viewBox="0 0 20 20" fill="#F59E0B" className="h-3 w-3">
                  <path d="M10 1l2.6 5.4 5.9.9-4.3 4.2 1 5.9L10 14.7 4.8 17.4l1-5.9L1.5 7.3l5.9-.9L10 1z" />
                </svg>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <span className="block h-full bg-brand-400" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-8 text-right text-muted">{count}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <ul className="flex flex-col gap-5">
          {data.items.map((r) => (
            <li key={r._id} className="rounded-lg border border-border bg-white p-5">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {r.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text">{r.authorName}</p>
                  <p className="text-xs text-muted">{formatLongDate(r.createdAt)}</p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      viewBox="0 0 20 20"
                      fill={i < r.rating ? '#F59E0B' : '#D4C9BB'}
                      className="h-3.5 w-3.5"
                    >
                      <path d="M10 1l2.6 5.4 5.9.9-4.3 4.2 1 5.9L10 14.7 4.8 17.4l1-5.9L1.5 7.3l5.9-.9L10 1z" />
                    </svg>
                  ))}
                </div>
              </div>
              <h4 className="mb-1 text-sm font-bold text-brand-900">{r.title}</h4>
              <p className="text-sm leading-relaxed text-text whitespace-pre-wrap">{r.comment}</p>
              {r.sellerResponse && (
                <div className="mt-3 ml-4 rounded-lg bg-gray-50 p-3">
                  <p className="mb-1 text-xs font-semibold text-muted">
                    {t.reviews.sellerResponse}
                  </p>
                  <p className="text-sm text-text">{r.sellerResponse.comment}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
        {data.totalPages > 1 && (
          <div className="mt-6">
            <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
