'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Package, MapPin, ArrowRight } from 'lucide-react';
import StatusBadge from '../../../components/orders/StatusBadge';
import { listSellerOrders, updateOrderStatus } from '../../../lib/commerce';
import { t, formatPrice, formatLongDate } from '../../../lib/i18n';
import { OrderStatus, type SellerOrderDto } from '@ecommerce/shared';

// Primary forward transition a seller can apply from each state.
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
  [OrderStatus.CONFIRMED]: OrderStatus.PROCESSING,
  [OrderStatus.PROCESSING]: OrderStatus.SHIPPED,
  [OrderStatus.SHIPPED]: OrderStatus.DELIVERED,
};

const FILTERS: (OrderStatus | 'all')[] = [
  'all',
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listSellerOrders({ limit: 100 });
      setOrders(res.items);
    } catch {
      setError(t.sellerOrders.loadError);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAdvance = async (order: SellerOrderDto) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdatingId(order._id);
    try {
      const updated = await updateOrderStatus(order._id, next);
      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? { ...o, status: updated.status } : o)),
      );
    } catch {
      setError(t.sellerOrders.updateError);
    }
    setUpdatingId(null);
  };

  const visible = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  const revenue = useMemo(
    () =>
      orders
        .filter((o) => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.REFUNDED)
        .reduce((s, o) => s + o.sellerSubtotal, 0),
    [orders],
  );

  return (
    <div className="container-main py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">{t.sellerOrders.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.sellerOrders.subtitle}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white px-5 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t.sellerOrders.revenue}
          </p>
          <p className="text-xl font-extrabold text-brand-900">{formatPrice(revenue)}</p>
          <p className="text-[11px] text-muted">
            {t.sellerOrders.ordersCount(String(orders.length))}
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-brand-500 text-white'
                : 'border border-border bg-white text-text hover:border-brand-300'
            }`}
          >
            {f === 'all' ? t.sellerOrders.filterAll : t.orders.status[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-[var(--color-error)]">
          {error}
        </p>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-white py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
            <Package className="h-8 w-8 text-brand-300" aria-hidden />
          </div>
          <div>
            <p className="font-bold text-brand-900">{t.sellerOrders.empty}</p>
            <p className="mt-1 text-sm text-muted">{t.sellerOrders.emptyDesc}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((o) => {
            const next = NEXT_STATUS[o.status];
            return (
              <div
                key={o._id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 lg:flex-row lg:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-brand-900">{o.orderNumber}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    {formatLongDate(o.createdAt)}
                    <span className="text-border-strong">·</span>
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {o.shippingAddress.city}, {o.shippingAddress.country}
                  </p>
                  {/* Seller's own line items */}
                  <ul className="mt-3 flex flex-col gap-1">
                    {o.items.map((it) => (
                      <li
                        key={`${it.productId}:${it.variantId}`}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0 truncate text-text">
                          <span className="font-semibold text-brand-900">{it.quantity}×</span>{' '}
                          {it.productName}
                          <span className="text-muted"> · {it.variantName}</span>
                        </span>
                        <span className="shrink-0 font-semibold text-text">
                          {formatPrice(it.totalPrice)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border pt-4 lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {t.sellerOrders.colTotal}
                    </p>
                    <p className="text-lg font-extrabold text-brand-900">
                      {formatPrice(o.sellerSubtotal)}
                    </p>
                    <p className="text-[11px] text-muted">
                      {t.sellerOrders.yourItems(o.sellerItemCount)}
                    </p>
                  </div>
                  {next ? (
                    <button
                      type="button"
                      onClick={() => handleAdvance(o)}
                      disabled={updatingId === o._id}
                      className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
                    >
                      {updatingId === o._id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          {t.sellerOrders.advanceTo(t.orders.status[next])}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-muted">
                      {t.sellerOrders.noTransition}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
