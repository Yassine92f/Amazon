'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'motion/react';
import { Lock, ShieldCheck } from 'lucide-react';
import { t, formatPrice } from '../../lib/i18n';

interface Props {
  amount: number;
  orderId: string;
  onSuccess: () => void;
}

/**
 * Stripe Payment Element + confirmation. Rendered inside an <Elements> provider
 * that already holds the PaymentIntent clientSecret. Uses `redirect: 'if_required'`
 * so card payments resolve inline; redirect-based methods fall back to return_url.
 */
export default function PaymentForm({ amount, orderId, onSuccess }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? t.checkout.paymentError);
      setSubmitting(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}?payment=success`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? t.checkout.paymentError);
      setSubmitting(false);
      return;
    }

    if (
      paymentIntent &&
      (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')
    ) {
      onSuccess();
      return;
    }

    setError(t.checkout.paymentError);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-white p-4">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      <p className="rounded-lg bg-brand-50 px-3 py-2 text-[11px] leading-relaxed text-brand-700">
        {t.checkout.testCardHint}
      </p>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-[var(--color-error)]">
          {error}
        </p>
      )}

      <motion.button
        type="submit"
        whileTap={{ scale: 0.98 }}
        disabled={!stripe || submitting}
        className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {t.checkout.processing}
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" aria-hidden />
            {t.checkout.payAmount(formatPrice(amount))}
          </>
        )}
      </motion.button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
        <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
        {t.checkout.securedByStripe}
      </p>
    </form>
  );
}
