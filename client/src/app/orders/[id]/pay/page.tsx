'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Header from '../../../../components/Header';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import PaymentForm from '../../../../components/checkout/PaymentForm';
import { getStripe } from '../../../../lib/stripe';
import { getOrder, createPaymentIntent, confirmPayment } from '../../../../lib/commerce';
import { t, formatPrice } from '../../../../lib/i18n';
import { OrderStatus, type Order } from '@ecommerce/shared';

const stripePromise = getStripe();
const hasStripeKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;

function PayInner({ id }: { id: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const o = await getOrder(id);
        if (cancelled) return;
        if (o.status !== OrderStatus.PENDING) {
          router.replace(`/orders/${id}`);
          return;
        }
        setOrder(o);
        const intent = await createPaymentIntent(id);
        if (cancelled) return;
        setClientSecret(intent.clientSecret);
      } catch (err) {
        setError(
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            t.checkout.orderError,
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const handleSuccess = async () => {
    try {
      await confirmPayment(id);
    } catch {
      /* order page will reconcile */
    }
    router.push(`/orders/${id}?payment=success`);
  };

  if (loading) {
    return (
      <div className="container-main flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-main py-24 text-center">
        <p className="text-lg font-bold text-brand-900">{error ?? t.orders.notFound}</p>
        <Link
          href="/orders"
          className="mt-4 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          {t.orders.backToOrders}
        </Link>
      </div>
    );
  }

  return (
    <main className="container-main max-w-2xl py-8">
      <Link
        href={`/orders/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {order.orderNumber}
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-extrabold text-brand-900">{t.orders.payTitle}</h1>
      <p className="mb-6 text-sm text-muted">{t.orders.payHint}</p>

      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
          <span className="text-sm text-muted">{t.checkout.total}</span>
          <span className="text-xl font-extrabold text-brand-900">
            {formatPrice(order.totalAmount)}
          </span>
        </div>

        {!hasStripeKey && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-[var(--color-error)]">
            {t.checkout.stripeKeyMissing}
          </p>
        )}
        {clientSecret && hasStripeKey ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              fonts: [
                {
                  cssSrc:
                    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
                },
              ],
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#f07d1a',
                  colorText: '#1f1710',
                  colorTextSecondary: '#7a6e62',
                  colorDanger: '#dc3545',
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  borderRadius: '10px',
                  fontSizeBase: '15px',
                },
              },
            }}
          >
            <PaymentForm amount={order.totalAmount} orderId={id} onSuccess={handleSuccess} />
          </Elements>
        ) : (
          hasStripeKey && (
            <p className="flex items-center justify-center gap-1.5 py-6 text-xs text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
              {t.checkout.securedByStripe}
            </p>
          )
        )}
      </div>
    </main>
  );
}

export default function OrderPayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <Header />
      <PayInner id={id} />
    </ProtectedRoute>
  );
}
