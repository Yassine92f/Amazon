'use client';

import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, X, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCartStore, lineKey } from '../../store/cart';
import { useAuthStore } from '../../store';
import { t, formatPrice } from '../../lib/i18n';
import { FREE_SHIPPING_THRESHOLD } from '../../lib/commerce';

export default function CartDrawer() {
  const router = useRouter();
  const { cart, isOpen, pendingKey, closeDrawer, setQuantity, remove } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const items = cart?.items ?? [];
  const subtotal = cart?.totalAmount ?? 0;
  const count = cart?.totalItems ?? 0;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const goToCheckout = () => {
    closeDrawer();
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent('/checkout')}`);
    } else {
      router.push('/checkout');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
            aria-hidden
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed right-0 top-0 z-[61] flex h-full w-full max-w-[420px] flex-col bg-[var(--color-bg)] shadow-2xl"
            role="dialog"
            aria-label={t.cart.drawerTitle}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-white px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-brand-500" aria-hidden />
                <h2 className="text-base font-extrabold text-brand-900">{t.cart.drawerTitle}</h2>
                {count > 0 && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-600">
                    {t.cart.items(count)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label={t.cart.close}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-50 hover:text-brand-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
                  <ShoppingBag className="h-8 w-8 text-brand-300" aria-hidden />
                </div>
                <div>
                  <p className="font-bold text-brand-900">{t.cart.empty}</p>
                  <p className="mt-1 text-sm text-muted">{t.cart.emptyDesc}</p>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  {t.cart.browse}
                </button>
              </div>
            ) : (
              <>
                {/* Free shipping progress */}
                <div className="border-b border-border bg-white px-5 py-3">
                  <p className="text-xs font-medium text-text">
                    {remaining > 0
                      ? t.cart.freeShippingProgress(formatPrice(remaining))
                      : t.cart.freeShippingReached}
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-50">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                      initial={false}
                      animate={{ width: `${progress}%` }}
                      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <ul className="flex flex-col gap-4">
                    {items.map((it) => {
                      const key = lineKey(it.productId, it.variantId);
                      const busy = pendingKey === key;
                      const max = it.maxStock ?? 99;
                      return (
                        <li key={key} className="flex gap-3">
                          <Link
                            href={it.productSlug ? `/products/${it.productSlug}` : '#'}
                            onClick={closeDrawer}
                            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-white"
                          >
                            {it.image ? (
                              <Image
                                src={it.image}
                                alt={it.productName ?? ''}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="flex h-full items-center justify-center text-border-strong">
                                <ShoppingBag className="h-6 w-6" />
                              </span>
                            )}
                          </Link>

                          <div className="flex min-w-0 flex-1 flex-col">
                            <Link
                              href={it.productSlug ? `/products/${it.productSlug}` : '#'}
                              onClick={closeDrawer}
                              className="line-clamp-2 text-sm font-semibold text-brand-900 hover:text-brand-600"
                            >
                              {it.productName ?? '—'}
                            </Link>
                            {it.variantName && (
                              <span className="mt-0.5 text-xs text-muted">{it.variantName}</span>
                            )}
                            <div className="mt-auto flex items-center justify-between pt-1.5">
                              <div className="flex items-center rounded-lg border border-border bg-white">
                                <button
                                  type="button"
                                  disabled={busy || it.quantity <= 1}
                                  onClick={() =>
                                    setQuantity(it.productId, it.variantId, it.quantity - 1)
                                  }
                                  aria-label={t.cart.decrease}
                                  className="flex h-7 w-7 items-center justify-center text-text disabled:opacity-30"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-7 text-center text-xs font-bold text-brand-900">
                                  {it.quantity}
                                </span>
                                <button
                                  type="button"
                                  disabled={busy || it.quantity >= max}
                                  onClick={() =>
                                    setQuantity(it.productId, it.variantId, it.quantity + 1)
                                  }
                                  aria-label={t.cart.increase}
                                  className="flex h-7 w-7 items-center justify-center text-text disabled:opacity-30"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <span className="text-sm font-extrabold text-brand-900">
                                {formatPrice(it.lineTotal ?? it.price * it.quantity)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => remove(it.productId, it.variantId)}
                            aria-label={t.cart.remove}
                            className="self-start text-muted transition-colors hover:text-[var(--color-error)] disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Footer */}
                <div className="border-t border-border bg-white px-5 py-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">{t.cart.subtotal}</span>
                    <span className="text-lg font-extrabold text-brand-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{t.cart.taxNote}</p>
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={goToCheckout}
                      className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600"
                    >
                      {t.cart.checkout}
                    </button>
                    <Link
                      href="/cart"
                      onClick={closeDrawer}
                      className="flex items-center justify-center rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:border-brand-300"
                    >
                      {t.cart.viewCart}
                    </Link>
                  </div>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
                    <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
                    {t.checkout.securedByStripe}
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
