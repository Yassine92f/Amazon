'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Store, BadgeCheck } from 'lucide-react';
import Header from '../../../components/Header';
import StarRating from '../../../components/StarRating';
import CatalogProductCard from '../../../components/catalog/CatalogProductCard';
import Pagination from '../../../components/catalog/Pagination';
import { t, formatNumber, formatMonthYear } from '../../../lib/i18n';
import {
  getPublicShop,
  searchProducts,
  type SellerDto,
  type ProductSearchParams,
  type ProductSearchResult,
} from '../../../lib/catalog';

const SORT_OPTIONS: { value: NonNullable<ProductSearchParams['sortBy']>; label: string }[] = [
  { value: 'totalSold', label: t.shop.sort.totalSold },
  { value: 'createdAt', label: t.shop.sort.createdAt },
  { value: 'price', label: t.shop.sort.price },
  { value: 'rating', label: t.shop.sort.rating },
];

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-extrabold leading-none text-brand-900">{value}</span>
      <span className="mt-1 text-xs font-medium text-muted">{label}</span>
    </div>
  );
}

export default function PublicShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [shop, setShop] = useState<SellerDto | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [result, setResult] = useState<ProductSearchResult | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<NonNullable<ProductSearchParams['sortBy']>>('totalSold');

  const productTotal = result?.total ?? 0;
  const products = result?.items ?? [];

  // Resolve the shop once per slug.
  useEffect(() => {
    let cancelled = false;
    setShop(null);
    setNotFound(false);
    setPage(1);
    getPublicShop(slug)
      .then((s) => {
        if (!cancelled) setShop(s);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Re-fetch this shop's products whenever the page or sort changes.
  useEffect(() => {
    if (!shop) return;
    let cancelled = false;
    setProductsLoading(true);
    searchProducts({
      sellerId: shop._id,
      page,
      limit: 12,
      sortBy,
      sortOrder: sortBy === 'price' ? 'asc' : 'desc',
    })
      .then((res) => {
        if (!cancelled) {
          setResult(res);
          setProductsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shop, page, sortBy]);

  if (notFound) {
    return (
      <>
        <Header />
        <div className="container-main py-20 text-center">
          <h1 className="mb-2 text-2xl font-bold text-brand-900">{t.shop.notFound}</h1>
          <Link
            href="/"
            className="mt-4 inline-block rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t.common.backHome}
          </Link>
        </div>
      </>
    );
  }

  if (!shop) {
    return (
      <>
        <Header />
        <div className="container-main py-20 text-center text-sm text-muted">
          {t.common.loading}
        </div>
      </>
    );
  }

  const initial = shop.shopName.charAt(0).toUpperCase();

  return (
    <>
      <Header />

      {/* ── Storefront banner ── */}
      <div className="relative h-44 overflow-hidden sm:h-56">
        {shop.banner ? (
          <>
            <Image src={shop.banner} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-500 to-brand-400" />
            <div className="absolute inset-0 [background:radial-gradient(120%_120%_at_15%_-20%,rgba(255,255,255,0.35),transparent_55%)]" />
            <span className="pointer-events-none absolute -right-2 -top-8 select-none text-[180px] font-black leading-none text-white/10">
              {initial}
            </span>
          </>
        )}
        {/* Soft fade into the page background so the banner never reads as a hard bar. */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--color-bg)] to-transparent" />
      </div>

      <div className="container-main">
        {/* ── Shop identity card ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="relative -mt-16 overflow-hidden rounded-2xl border border-border bg-white shadow-lg"
        >
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-6">
            {/* Avatar */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-brand-50 sm:h-24 sm:w-24">
              {shop.logo ? (
                <Image
                  src={shop.logo}
                  alt={shop.shopName}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-brand-300">
                  <Store className="h-10 w-10" strokeWidth={1.5} aria-hidden />
                </span>
              )}
            </div>

            {/* Identity */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-brand-900 sm:text-3xl">
                  {shop.shopName}
                </h1>
                {shop.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                    {t.shop.verified}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <StarRating rating={shop.rating} count={shop.reviewCount} size="md" />
                <span className="text-xs text-muted">
                  {t.shop.memberSince(formatMonthYear(shop.joinedAt))}
                </span>
              </div>
            </div>
          </div>

          {/* Stat strip */}
          <div className="flex items-center gap-6 border-t border-border bg-[var(--color-bg)] px-6 py-4 sm:gap-10">
            <Stat value={formatNumber(shop.totalSales)} label={t.shop.statSales} />
            <span className="h-8 w-px bg-border" aria-hidden />
            <Stat value={shop.rating.toFixed(1)} label={t.shop.statRating} />
            <span className="h-8 w-px bg-border" aria-hidden />
            <Stat value={formatNumber(shop.reviewCount)} label={t.shop.statReviews} />
            <span className="h-8 w-px bg-border" aria-hidden />
            <Stat value={formatNumber(productTotal)} label={t.shop.statProducts} />
          </div>
        </motion.section>

        {/* ── About ── */}
        {shop.description && (
          <section className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-900">
              <span className="inline-block h-5 w-1 rounded-full bg-brand-500" />
              {t.shop.about}
            </h2>
            <p className="max-w-3xl rounded-xl border border-border bg-white p-5 text-sm leading-relaxed text-text">
              {shop.description}
            </p>
          </section>
        )}

        {/* ── Products ── */}
        <section className="mb-16 mt-10">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <h2 className="flex items-center gap-2 text-xl font-bold text-brand-900">
              <span className="inline-block h-6 w-1 rounded-full bg-brand-500" />
              {t.shop.products}
              {productTotal > 0 && (
                <span className="text-sm font-medium text-muted">
                  ({formatNumber(productTotal)})
                </span>
              )}
            </h2>
            {productTotal > 1 && (
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as NonNullable<ProductSearchParams['sortBy']>);
                  setPage(1);
                }}
                className="ml-auto rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-text outline-none focus:border-brand-500"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t.shop.sortPrefix} : {o.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-lg border border-border bg-white"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-strong bg-white p-10 text-center text-sm text-muted">
              {t.shop.noProducts}
            </p>
          ) : (
            <>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
              >
                {products.map((p) => (
                  <motion.div
                    key={p._id}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      visible: { opacity: 1, y: 0, transition: spring },
                    }}
                  >
                    <CatalogProductCard product={p} />
                  </motion.div>
                ))}
              </motion.div>

              {result && result.totalPages > 1 && (
                <div className="mt-10">
                  <Pagination
                    page={page}
                    totalPages={result.totalPages}
                    onChange={(p) => {
                      setPage(p);
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  />
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
