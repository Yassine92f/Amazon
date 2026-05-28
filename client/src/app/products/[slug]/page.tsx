'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import Header from '../../../components/Header';
import StarRating from '../../../components/StarRating';
import ReviewsList from '../../../components/catalog/ReviewsList';
import { getProductBySlug, type ProductDto, type ProductVariantDto } from '../../../lib/catalog';

function formatPrice(value: number): string {
  return `€${value.toFixed(2).replace('.', ',')}`;
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [variant, setVariant] = useState<ProductVariantDto | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProductBySlug(slug)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        const cheapest = [...p.variants].sort((a, b) => a.price - b.price)[0];
        setVariant(cheapest ?? null);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (notFound) {
    return (
      <>
        <Header />
        <div className="container-main py-20 text-center">
          <h1 className="mb-2 text-2xl font-bold text-brand-900">Product not found</h1>
          <Link
            href="/"
            className="mt-4 inline-block rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back home
          </Link>
        </div>
      </>
    );
  }

  if (!product || !variant) {
    return (
      <>
        <Header />
        <div className="container-main py-20 text-center text-sm text-muted">Loading…</div>
      </>
    );
  }

  const discount =
    variant.compareAtPrice && variant.compareAtPrice > variant.price
      ? Math.round(((variant.compareAtPrice - variant.price) / variant.compareAtPrice) * 100)
      : null;

  return (
    <>
      <Header />
      <nav className="container-main py-3 text-xs text-muted">
        <Link href="/" className="hover:text-text">
          Home
        </Link>
        <span className="mx-2">/</span>
        {product.categorySlug && (
          <>
            <Link href={`/c/${product.categorySlug}`} className="hover:text-text">
              {product.categoryName}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-text">{product.name}</span>
      </nav>

      <main className="container-main pb-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-white">
              {product.images[activeImage] ? (
                <Image
                  src={product.images[activeImage]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 720px"
                  className="object-contain p-8"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl">📦</div>
              )}
              {discount !== null && (
                <span className="absolute top-4 left-4 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
                  -{discount}%
                </span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 bg-white ${
                      i === activeImage ? 'border-brand-500' : 'border-border'
                    }`}
                  >
                    <Image src={img} alt="" fill sizes="80px" className="object-contain p-1.5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {product.brand && (
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-600">
                {product.brand}
              </p>
            )}
            <h1 className="text-2xl font-extrabold text-brand-900 sm:text-3xl">{product.name}</h1>
            <div className="mt-2">
              <StarRating rating={product.rating} count={product.reviewCount} />
            </div>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-3">
              <span className="text-3xl font-extrabold text-brand-900">
                {formatPrice(variant.price)}
              </span>
              {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
                <span className="text-lg text-muted line-through">
                  {formatPrice(variant.compareAtPrice)}
                </span>
              )}
              {discount !== null && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                  Save €{(variant.compareAtPrice! - variant.price).toFixed(2)}
                </span>
              )}
            </div>

            {product.variants.length > 1 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold text-brand-900">
                  Variant: <span className="font-normal text-text">{variant.name}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v._id}
                      type="button"
                      onClick={() => setVariant(v)}
                      className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                        v._id === variant._id
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-border bg-white text-text hover:border-brand-300'
                      } ${v.stock === 0 ? 'opacity-60' : ''}`}
                      disabled={v.stock === 0}
                    >
                      {v.name}
                      {v.stock === 0 && <span className="ml-2 text-xs">— out</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 rounded-lg border border-border bg-white p-4">
              <p className="text-sm text-text">
                {variant.stock > 0 ? (
                  <>
                    <span className="font-bold text-green-700">In stock</span>
                    <span className="ml-2 text-muted">— ready to ship</span>
                  </>
                ) : (
                  <span className="font-bold text-red-600">Out of stock</span>
                )}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={variant.stock === 0}
              className="mt-4 flex items-center justify-center gap-2 rounded-md bg-brand-500 py-3.5 text-sm font-bold text-white shadow hover:bg-brand-600 disabled:opacity-50"
            >
              Add to cart — {formatPrice(variant.price)}
            </motion.button>
            <p className="mt-2 text-center text-xs text-muted">
              Cart functionality ships in the next branch (feature/cart-orders).
            </p>

            {product.shopName && product.shopSlug && (
              <Link
                href={`/sellers/${product.shopSlug}`}
                className="mt-6 flex items-center justify-between rounded-lg border border-border bg-white p-4 transition-colors hover:border-brand-300"
              >
                <div>
                  <p className="text-xs text-muted">Sold by</p>
                  <p className="font-bold text-brand-900">{product.shopName}</p>
                </div>
                <span className="text-sm font-semibold text-brand-600">Visit shop →</span>
              </Link>
            )}
          </div>
        </div>

        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold text-brand-900">Description</h2>
          <div className="rounded-lg border border-border bg-white p-6">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
              {product.description}
            </p>
            {product.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold text-brand-900">Customer reviews</h2>
          <ReviewsList productId={product._id} />
        </section>
      </main>
    </>
  );
}
