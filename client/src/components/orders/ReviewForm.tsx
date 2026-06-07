'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { createReview } from '../../lib/commerce';
import { t } from '../../lib/i18n';

interface Props {
  productId: string;
  orderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ReviewForm({ productId, orderId, onSuccess, onCancel }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      setError(t.reviewForm.error);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createReview({
        productId,
        orderId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      onSuccess();
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          t.reviewForm.error,
      );
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      onSubmit={submit}
      className="mt-3 flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-[var(--color-bg)] p-4"
    >
      <span className="text-sm font-bold text-brand-900">{t.reviewForm.title}</span>

      {/* Star rating */}
      <div className="flex items-center gap-1" aria-label={t.reviewForm.ratingLabel}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n}`}
            className="p-0.5"
          >
            <Star
              className="h-6 w-6 transition-colors"
              style={{
                color: (hover || rating) >= n ? 'var(--color-star)' : 'var(--color-border-strong)',
              }}
              fill={(hover || rating) >= n ? 'currentColor' : 'none'}
              aria-hidden
            />
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t.reviewForm.titlePlaceholder}
        maxLength={140}
        required
        className="h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-brand-400"
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t.reviewForm.commentPlaceholder}
        rows={3}
        maxLength={5000}
        required
        className="resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
      />

      {error && <p className="text-xs font-medium text-[var(--color-error)]">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting ? t.reviewForm.submitting : t.reviewForm.submit}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text"
        >
          {t.reviewForm.cancel}
        </button>
      </div>
    </motion.form>
  );
}
