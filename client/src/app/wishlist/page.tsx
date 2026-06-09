'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react';
import Header from '../../components/Header';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useWishlistStore } from '../../store/wishlist';
import { useCartStore } from '../../store/cart';
import { getProductBySlug } from '../../lib/catalog';
import { t, formatPrice } from '../../lib/i18n';

function WishlistInner() {
  const { items, count, isLoading, load, remove, pendingId } = useWishlistStore();
  const addToCart = useCartStore((s) => s.add);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  // Wishlist entries carry no variant, so resolve the product and add its
  // cheapest in-stock variant to the cart.
  const handleAddToCart = async (productId: string, slug?: string) => {
    if (!slug) return;
    setAddingId(productId);
    try {
      const product = await getProductBySlug(slug);
      const variant = [...product.variants]
        .filter((v) => v.stock > 0)
        .sort((a, b) => a.price - b.price)[0];
      if (variant) {
        await addToCart({ productId: product._id, variantId: variant._id, quantity: 1 });
      }
    } catch {
      /* ignore */
    }
    setAddingId(null);
  };

  return (
    <main className="container-main py-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold text-brand-900">{t.wishlist.title}</h1>
        {count > 0 && (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-600">
            {t.wishlist.count(count)}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">{t.wishlist.subtitle}</p>

      {isLoading && items.length === 0 ? (
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-white py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
            <Heart className="h-10 w-10 text-brand-300" aria-hidden />
          </div>
          <div>
            <p className="text-lg font-bold text-brand-900">{t.wishlist.empty}</p>
            <p className="mt-1 text-sm text-muted">{t.wishlist.emptyDesc}</p>
          </div>
          <Link
            href="/search"
            className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600"
          >
            {t.wishlist.browse}
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>
            {items.map((it) => (
              <motion.div
                key={it.productId}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white"
              >
                <Link
                  href={it.slug ? `/products/${it.slug}` : '#'}
                  className="relative aspect-square overflow-hidden bg-[var(--color-bg)]"
                >
                  {it.image ? (
                    <Image
                      src={it.image}
                      alt={it.name ?? ''}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-border-strong">
                      <Package className="h-10 w-10" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      remove(it.productId);
                    }}
                    disabled={pendingId === it.productId}
                    aria-label={t.wishlist.remove}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--color-error)] shadow-sm backdrop-blur transition-colors hover:bg-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Link>

                <div className="flex flex-1 flex-col p-3">
                  <Link
                    href={it.slug ? `/products/${it.slug}` : '#'}
                    className="line-clamp-2 text-sm font-semibold text-brand-900 hover:text-brand-600"
                  >
                    {it.name ?? '—'}
                  </Link>
                  <p className="mt-1 font-extrabold text-brand-900">
                    {it.price !== undefined ? t.wishlist.fromPrice(formatPrice(it.price)) : '—'}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(it.productId, it.slug)}
                    disabled={!it.inStock || addingId === it.productId}
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
                  >
                    {addingId === it.productId ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" aria-hidden />
                        {it.inStock ? t.wishlist.addToCart : t.wishlist.outOfStock}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}

export default function WishlistPage() {
  return (
    <ProtectedRoute>
      <Header />
      <WishlistInner />
    </ProtectedRoute>
  );
}
