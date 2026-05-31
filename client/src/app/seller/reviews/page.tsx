'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Send } from 'lucide-react';
import StarRating from '../../../components/StarRating';
import Pagination from '../../../components/catalog/Pagination';
import { t, formatLongDate, formatNumber } from '../../../lib/i18n';
import {
  listMyReviews,
  replyToReview,
  type SellerReviewDto,
  type SellerReviewListResult,
} from '../../../lib/catalog';

export default function SellerReviewsPage() {
  const [data, setData] = useState<SellerReviewListResult | null>(null);
  const [page, setPage] = useState(1);
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReviews = () => {
    setLoading(true);
    listMyReviews({ page, limit: 10, onlyUnanswered })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, onlyUnanswered]);

  const onReplied = (updated: SellerReviewDto) => {
    setData((d) =>
      d ? { ...d, items: d.items.map((r) => (r._id === updated._id ? updated : r)) } : d,
    );
  };

  return (
    <div className="container-main py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">{t.seller.reviewsHub.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.seller.reviewsHub.subtitle}</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
          {[
            { label: t.seller.reviewsHub.filterAll, value: false },
            { label: t.seller.reviewsHub.filterUnanswered, value: true },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => {
                setOnlyUnanswered(opt.value);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                onlyUnanswered === opt.value
                  ? 'bg-brand-500 text-white'
                  : 'text-text hover:bg-brand-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {data && !loading && (
        <p className="mb-4 text-sm text-muted">
          {t.seller.reviewsHub.count(formatNumber(data.total))}
        </p>
      )}

      {loading && !data ? (
        <div className="rounded-lg border border-border bg-white p-12 text-center text-sm text-muted">
          {t.seller.reviewsHub.loading}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-white p-12 text-center">
          <MessageSquare
            className="mx-auto mb-3 h-10 w-10 text-brand-300"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="text-sm text-muted">
            {onlyUnanswered ? t.seller.reviewsHub.emptyUnanswered : t.seller.reviewsHub.empty}
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {data.items.map((review) => (
              <ReviewCard key={review._id} review={review} onReplied={onReplied} />
            ))}
          </ul>
          {data.totalPages > 1 && (
            <div className="mt-8">
              <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  onReplied,
}: {
  review: SellerReviewDto;
  onReplied: (r: SellerReviewDto) => void;
}) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (comment.trim().length < 2) return;
    setSending(true);
    setError('');
    try {
      const updated = await replyToReview(review._id, comment.trim());
      onReplied(updated);
      setOpen(false);
      setComment('');
    } catch {
      setError(t.seller.reviewsHub.replyError);
    }
    setSending(false);
  };

  return (
    <li className="rounded-xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/products/${review.productSlug}`}
            target="_blank"
            className="text-sm font-bold text-brand-900 hover:text-brand-600"
          >
            {review.productName}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="font-semibold text-text">{review.authorName}</span>
            <span aria-hidden>·</span>
            <span>{formatLongDate(review.createdAt)}</span>
          </div>
        </div>
        <StarRating rating={review.rating} size="md" />
      </div>

      <h3 className="mt-3 text-sm font-bold text-brand-900">{review.title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-text">{review.comment}</p>

      {review.sellerResponse ? (
        <div className="mt-4 rounded-lg border-l-2 border-brand-500 bg-brand-50 p-3">
          <p className="mb-1 text-xs font-bold text-brand-700">{t.seller.reviewsHub.yourReply}</p>
          <p className="text-sm text-text">{review.sellerResponse.comment}</p>
          <p className="mt-1 text-[11px] text-muted">
            {t.seller.reviewsHub.respondedOn(formatLongDate(review.sellerResponse.respondedAt))}
          </p>
        </div>
      ) : open ? (
        <div className="mt-4">
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            placeholder={t.seller.reviewsHub.replyPlaceholder}
            className="w-full resize-y rounded-lg border border-border bg-[var(--color-bg)] px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError('');
              }}
              className="rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-text"
            >
              {t.seller.reviewsHub.cancel}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={sending || comment.trim().length < 2}
              className="flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden />
              {sending ? t.seller.reviewsHub.sending : t.seller.reviewsHub.send}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:border-brand-300"
        >
          <MessageSquare className="h-4 w-4" aria-hidden />
          {t.seller.reviewsHub.reply}
        </button>
      )}
    </li>
  );
}
