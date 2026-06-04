'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import Header from '../../components/Header';
import { useCartStore, lineKey } from '../../store/cart';
import { useAuthStore } from '../../store';
import { t, formatPrice } from '../../lib/i18n';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../../lib/commerce';
import { DeliveryType } from '@ecommerce/shared';

export default function CartPage() {
  const router = useRouter();
  const { cart, isLoading, pendingKey, setQuantity, remove, clear } = useCartStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const items = cart?.items ?? [];
  const subtotal = cart?.totalAmount ?? 0;
  const count = cart?.totalItems ?? 0;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const estShipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST[DeliveryType.HOME];

  const goToCheckout = () => {
    if (!isAuthenticated) router.push(`/login?redirect=${encodeURIComponent('/checkout')}`);
    else router.push('/checkout');
  };

  return (
    <>
      <Header />
      <main className="container-main py-8">
        <nav className="mb-5 text-xs text-muted">
          <Link href="/" className="hover:text-text">
            {t.product.breadcrumbHome}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text">{t.cart.title}</span>
        </nav>

        <h1 className="mb-6 text-2xl font-extrabold text-brand-900">{t.cart.title}</h1>

        {isLoading && items.length === 0 ? (
          <div className="flex justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-white py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
              <ShoppingBag className="h-10 w-10 text-brand-300" aria-hidden />
            </div>
            <div>
              <p className="text-lg font-bold text-brand-900">{t.cart.empty}</p>
              <p className="mt-1 text-sm text-muted">{t.cart.emptyDesc}</p>
            </div>
            <Link
              href="/search"
              className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600"
            >
              {t.cart.browse}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Items */}
            <div className="overflow-hidden rounded-2xl border border-border bg-white">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <span className="text-sm font-semibold text-text">{t.cart.items(count)}</span>
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs font-medium text-muted transition-colors hover:text-[var(--color-error)]"
                >
                  {t.cart.clear}
                </button>
              </div>
              <ul className="divide-y divide-border">
                {items.map((it) => {
                  const key = lineKey(it.productId, it.variantId);
                  const busy = pendingKey === key;
                  const max = it.maxStock ?? 99;
                  return (
                    <li key={key} className="flex gap-4 p-5">
                      <Link
                        href={it.productSlug ? `/products/${it.productSlug}` : '#'}
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-white"
                      >
                        {it.image ? (
                          <Image
                            src={it.image}
                            alt={it.productName ?? ''}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-border-strong">
                            <ShoppingBag className="h-7 w-7" />
                          </span>
                        )}
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={it.productSlug ? `/products/${it.productSlug}` : '#'}
                              className="line-clamp-2 font-semibold text-brand-900 hover:text-brand-600"
                            >
                              {it.productName ?? '—'}
                            </Link>
                            {it.variantName && (
                              <p className="mt-0.5 text-sm text-muted">{it.variantName}</p>
                            )}
                            {it.inStock === false && (
                              <p className="mt-1 text-xs font-semibold text-[var(--color-error)]">
                                {t.cart.outOfStock}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => remove(it.productId, it.variantId)}
                            aria-label={t.cart.remove}
                            className="text-muted transition-colors hover:text-[var(--color-error)] disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex items-center rounded-lg border border-border bg-white">
                            <button
                              type="button"
                              disabled={busy || it.quantity <= 1}
                              onClick={() =>
                                setQuantity(it.productId, it.variantId, it.quantity - 1)
                              }
                              aria-label="−"
                              className="flex h-9 w-9 items-center justify-center text-text disabled:opacity-30"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-9 text-center text-sm font-bold text-brand-900">
                              {it.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={busy || it.quantity >= max}
                              onClick={() =>
                                setQuantity(it.productId, it.variantId, it.quantity + 1)
                              }
                              aria-label="+"
                              className="flex h-9 w-9 items-center justify-center text-text disabled:opacity-30"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold text-brand-900">
                              {formatPrice(it.lineTotal ?? it.price * it.quantity)}
                            </p>
                            {it.quantity > 1 && (
                              <p className="text-xs text-muted">{formatPrice(it.price)} / u</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-6 flex flex-col gap-4 rounded-2xl border border-border bg-white p-5">
              <h2 className="text-base font-extrabold text-brand-900">{t.cart.summary}</h2>

              {remaining > 0 ? (
                <div className="flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-xs text-brand-700">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{t.cart.freeShippingProgress(formatPrice(remaining))}</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-700">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{t.cart.freeShippingReached}</span>
                </div>
              )}

              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted">{t.cart.subtotal}</dt>
                  <dd className="font-semibold text-text">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted">{t.cart.shipping}</dt>
                  <dd className="font-semibold text-text">
                    {estShipping === 0 ? t.cart.freeShipping : formatPrice(estShipping)}
                  </dd>
                </div>
                <div className="my-1 h-px w-full bg-border" />
                <div className="flex items-center justify-between">
                  <dt className="font-bold text-brand-900">{t.cart.estimatedTotal}</dt>
                  <dd className="text-xl font-extrabold text-brand-900">
                    {formatPrice(subtotal + estShipping)}
                  </dd>
                </div>
              </dl>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={goToCheckout}
                className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600"
              >
                {t.cart.checkout}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </motion.button>

              <Link
                href="/search"
                className="text-center text-sm font-medium text-brand-600 hover:underline"
              >
                {t.cart.continueShopping}
              </Link>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
                {t.checkout.securedByStripe}
              </p>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
