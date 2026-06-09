'use client';

import { use, useCallback, useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Package,
  MapPin,
  CreditCard,
  Clock,
  Truck,
  Home,
  XCircle,
  ArrowLeft,
  Star,
  PenLine,
} from 'lucide-react';
import Header from '../../../components/Header';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import StatusBadge from '../../../components/orders/StatusBadge';
import ReviewForm from '../../../components/orders/ReviewForm';
import {
  getOrder,
  cancelOrder,
  confirmPayment,
  getReviewedProductIds,
} from '../../../lib/commerce';
import { t, formatPrice, formatLongDate } from '../../../lib/i18n';
import { OrderStatus, DeliveryType, type Order } from '@ecommerce/shared';

const TIMELINE: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

function Timeline({ status }: { status: OrderStatus }) {
  if (status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-[var(--color-error)]">
        <XCircle className="h-5 w-5" aria-hidden />
        {t.orders.status[status]}
      </div>
    );
  }
  const currentIdx = TIMELINE.indexOf(status); // -1 when still pending
  return (
    <ol className="flex items-center">
      {TIMELINE.map((s, i) => {
        const done = i <= currentIdx;
        const Icon = [Clock, Package, Truck, Home][i];
        return (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  done ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-300'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span
                className={`text-[11px] font-semibold ${done ? 'text-brand-900' : 'text-muted'}`}
              >
                {t.orders.status[s]}
              </span>
            </div>
            {i < TIMELINE.length - 1 && (
              <span
                className={`mx-1 h-0.5 flex-1 rounded-full ${
                  i < currentIdx ? 'bg-brand-500' : 'bg-brand-100'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function OrderDetailInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const justPaid = searchParams.get('payment') === 'success';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const pollCount = useRef(0);

  const fetchOrder = useCallback(async () => {
    try {
      const o = await getOrder(id);
      setOrder(o);
      return o;
    } catch {
      setNotFound(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Once delivered, load which products the buyer has already reviewed.
  useEffect(() => {
    if (order?.status === OrderStatus.DELIVERED) {
      getReviewedProductIds(id)
        .then(setReviewedIds)
        .catch(() => setReviewedIds([]));
    }
  }, [order?.status, id]);

  // After payment, confirm the order deterministically (the checkout already
  // does this, but this is a resilient fallback if that call was missed). Then
  // poll a few times in case confirmation is still settling.
  useEffect(() => {
    if (!justPaid || !order || order.status !== OrderStatus.PENDING) return;
    if (pollCount.current >= 5) return;
    const timer = setTimeout(async () => {
      pollCount.current += 1;
      try {
        await confirmPayment(id);
      } catch {
        /* ignore — fall through to a plain refetch */
      }
      await fetchOrder();
    }, 1500);
    return () => clearTimeout(timer);
  }, [justPaid, order, fetchOrder, id]);

  const handleCancel = async () => {
    if (!order || !window.confirm(t.orders.cancelConfirm)) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await cancelOrder(order._id);
      setOrder(updated);
    } catch (err) {
      setCancelError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          t.orders.cancelError,
      );
    }
    setCancelling(false);
  };

  if (loading) {
    return (
      <div className="container-main flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="container-main py-24 text-center">
        <h1 className="text-2xl font-bold text-brand-900">{t.orders.notFound}</h1>
        <Link
          href="/orders"
          className="mt-4 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          {t.orders.backToOrders}
        </Link>
      </div>
    );
  }

  const canCancel = order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED;
  const paidOrConfirmed = order.status !== OrderStatus.PENDING;
  const awaitingPayment = order.status === OrderStatus.PENDING;

  return (
    <main className="container-main py-8">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.orders.backToOrders}
      </Link>

      {/* Success banner */}
      {justPaid && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 flex items-start gap-3 rounded-2xl border p-5 ${
            paidOrConfirmed ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
          }`}
        >
          {paidOrConfirmed ? (
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" aria-hidden />
          ) : (
            <span className="mt-0.5 h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          )}
          <div>
            <p className={`font-bold ${paidOrConfirmed ? 'text-green-800' : 'text-amber-800'}`}>
              {paidOrConfirmed ? t.orders.successTitle : t.orders.paymentPending}
            </p>
            {paidOrConfirmed && <p className="text-sm text-green-700">{t.orders.successDesc}</p>}
          </div>
        </motion.div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">{order.orderNumber}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {t.orders.placedOn} {formatLongDate(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Timeline */}
      <div className="mt-6 rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-5 text-sm font-bold text-brand-900">{t.orders.timeline}</h2>
        <Timeline status={order.status} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* Items */}
        <section className="overflow-hidden rounded-2xl border border-border bg-white">
          <h2 className="border-b border-border px-5 py-3 text-sm font-bold text-brand-900">
            {t.orders.orderItems}
          </h2>
          <ul className="divide-y divide-border">
            {order.items.map((it) => {
              const reviewed = reviewedIds.includes(it.productId);
              const canReview = order.status === OrderStatus.DELIVERED;
              return (
                <li key={`${it.productId}:${it.variantId}`} className="flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50">
                      {it.image ? (
                        <Image
                          src={it.image}
                          alt={it.productName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-brand-400" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-brand-900">{it.productName}</p>
                      <p className="text-sm text-muted">
                        {it.variantName} · {t.orders.qty(it.quantity)}
                      </p>
                    </div>
                    <span className="font-bold text-brand-900">{formatPrice(it.totalPrice)}</span>
                  </div>

                  {canReview &&
                    (reviewed ? (
                      <span className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-green-700">
                        <Star className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
                        {t.reviewForm.published}
                      </span>
                    ) : reviewingId === it.productId ? (
                      <ReviewForm
                        productId={it.productId}
                        orderId={order._id}
                        onSuccess={() => {
                          setReviewedIds((p) => [...p, it.productId]);
                          setReviewingId(null);
                        }}
                        onCancel={() => setReviewingId(null)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReviewingId(it.productId)}
                        className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:border-brand-300"
                      >
                        <PenLine className="h-3.5 w-3.5" aria-hidden />
                        {t.reviewForm.writeReview}
                      </button>
                    ))}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Sidebar: address + payment */}
        <aside className="flex flex-col gap-6">
          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-brand-900">
              <MapPin className="h-4 w-4 text-brand-500" aria-hidden />
              {t.orders.shippingAddress}
            </h2>
            <p className="text-sm text-muted">{order.shippingAddress.street}</p>
            <p className="text-sm text-muted">
              {order.shippingAddress.postalCode} {order.shippingAddress.city}
            </p>
            <p className="text-sm text-muted">{order.shippingAddress.country}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-600">
              {order.deliveryType === DeliveryType.HOME ? (
                <Home className="h-3.5 w-3.5" />
              ) : (
                <Truck className="h-3.5 w-3.5" />
              )}
              {order.deliveryType === DeliveryType.HOME
                ? t.orders.deliveryHome
                : t.orders.deliveryPickup}
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-brand-900">
              <CreditCard className="h-4 w-4 text-brand-500" aria-hidden />
              {t.orders.paymentSummary}
            </h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">{t.orders.subtotal}</dt>
                <dd className="font-semibold text-text">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">{t.orders.shipping}</dt>
                <dd className="font-semibold text-text">
                  {order.shippingCost === 0 ? t.cart.freeShipping : formatPrice(order.shippingCost)}
                </dd>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex items-center justify-between text-green-700">
                  <dt>
                    {t.orders.discount}
                    {order.couponCode ? ` · ${order.couponCode}` : ''}
                  </dt>
                  <dd className="font-semibold">−{formatPrice(order.discountAmount)}</dd>
                </div>
              )}
              <div className="my-1 h-px w-full bg-border" />
              <div className="flex items-center justify-between">
                <dt className="font-bold text-brand-900">{t.orders.total}</dt>
                <dd className="text-lg font-extrabold text-brand-900">
                  {formatPrice(order.totalAmount)}
                </dd>
              </div>
            </dl>
          </section>

          {awaitingPayment && (
            <Link
              href={`/orders/${order._id}/pay`}
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600"
            >
              <CreditCard className="h-4 w-4" aria-hidden />
              {t.orders.payNow}
            </Link>
          )}

          {canCancel && (
            <div className="flex flex-col gap-2">
              {cancelError && (
                <p className="text-xs font-medium text-[var(--color-error)]">{cancelError}</p>
              )}
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-error)] transition-colors hover:bg-red-50 disabled:opacity-60"
              >
                {cancelling ? t.orders.cancelling : t.orders.cancelOrder}
              </button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <Header />
      <Suspense
        fallback={
          <div className="container-main flex justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        }
      >
        <OrderDetailInner id={id} />
      </Suspense>
    </ProtectedRoute>
  );
}
