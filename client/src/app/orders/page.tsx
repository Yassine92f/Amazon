'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import Header from '../../components/Header';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import StatusBadge from '../../components/orders/StatusBadge';
import { listOrders } from '../../lib/commerce';
import { t, formatPrice, formatLongDate } from '../../lib/i18n';
import type { OrderSummary } from '@ecommerce/shared';

function OrdersInner() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listOrders({ limit: 50 })
      .then((res) => setOrders(res.items))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container-main py-8">
      <h1 className="text-2xl font-extrabold text-brand-900">{t.orders.title}</h1>
      <p className="mt-1 text-sm text-muted">{t.orders.subtitle}</p>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-white py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
            <Package className="h-10 w-10 text-brand-300" aria-hidden />
          </div>
          <div>
            <p className="text-lg font-bold text-brand-900">{t.orders.empty}</p>
            <p className="mt-1 text-sm text-muted">{t.orders.emptyDesc}</p>
          </div>
          <Link
            href="/search"
            className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600"
          >
            {t.orders.startShopping}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {orders.map((o) => (
            <li key={o._id}>
              <Link
                href={`/orders/${o._id}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 transition-colors hover:border-brand-300"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  <Package className="h-6 w-6 text-brand-500" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-brand-900">{o.orderNumber}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {t.orders.placedOn} {formatLongDate(o.createdAt)} ·{' '}
                    {t.orders.items(o.itemCount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-brand-900">{formatPrice(o.totalAmount)}</p>
                  <span className="flex items-center justify-end gap-0.5 text-xs font-semibold text-brand-600">
                    {t.orders.viewDetails}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <Header />
      <OrdersInner />
    </ProtectedRoute>
  );
}
