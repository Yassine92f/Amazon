'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Search, BadgeCheck, Store, ShoppingBag } from 'lucide-react';
import Header from '../../components/Header';
import StarRating from '../../components/StarRating';
import Pagination from '../../components/catalog/Pagination';
import { t, formatNumber } from '../../lib/i18n';
import { listSellers, type SellerDto, type PaginatedResponse } from '../../lib/catalog';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export default function ShopsDirectoryPage() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<SellerDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debounced, verifiedOnly]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listSellers({
      page,
      limit: 12,
      query: debounced || undefined,
      isVerified: verifiedOnly || undefined,
    })
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(t.shops.loadError);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [page, debounced, verifiedOnly]);

  return (
    <>
      <Header />

      <div className="container-main py-8">
        <nav className="mb-4 text-xs text-muted">
          <Link href="/" className="hover:text-text">
            {t.shops.breadcrumbHome}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text">{t.shop.breadcrumbShops}</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-brand-900 sm:text-4xl">{t.shops.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{t.shops.subtitle}</p>
        </header>

        {/* ── Controls ── */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.shops.searchPlaceholder}
              className="w-full rounded-lg border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-text outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setVerifiedOnly((v) => !v)}
            aria-pressed={verifiedOnly}
            className={`flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
              verifiedOnly
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-border bg-white text-text hover:border-brand-300'
            }`}
          >
            <BadgeCheck className="h-4 w-4" aria-hidden />
            {t.shops.verifiedOnly}
          </button>
        </div>

        {data && !loading && !error && (
          <p className="mb-4 text-sm text-muted">{t.shops.count(data.total)}</p>
        )}

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-border bg-white"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            {error}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-strong bg-white p-12 text-center">
            <Store
              className="mx-auto mb-3 h-10 w-10 text-brand-300"
              strokeWidth={1.5}
              aria-hidden
            />
            <h3 className="mb-1 text-base font-bold text-brand-900">{t.shops.emptyTitle}</h3>
            <p className="text-sm text-muted">{t.shops.emptyDesc}</p>
          </div>
        ) : (
          <>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {data.items.map((shop) => (
                <motion.div
                  key={shop._id}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0, transition: spring },
                  }}
                >
                  <ShopCard shop={shop} />
                </motion.div>
              ))}
            </motion.div>

            {data.totalPages > 1 && (
              <div className="mt-10">
                <Pagination
                  page={page}
                  totalPages={data.totalPages}
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
      </div>
    </>
  );
}

function ShopCard({ shop }: { shop: SellerDto }) {
  const initial = shop.shopName.charAt(0).toUpperCase();
  return (
    <Link
      href={`/sellers/${shop.shopSlug}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-white transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      {/* Banner / gradient strip */}
      <div className="relative h-20 overflow-hidden">
        {shop.banner ? (
          <Image src={shop.banner} alt="" fill sizes="400px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-500 to-brand-400" />
        )}
      </div>

      <div className="px-5 pb-5">
        {/* Avatar overlaps the banner */}
        <div className="relative -mt-8 mb-3 flex items-end justify-between">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-brand-50 shadow-sm">
            {shop.logo ? (
              <Image
                src={shop.logo}
                alt={shop.shopName}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-black text-brand-300">
                {initial}
              </span>
            )}
          </div>
          {shop.isVerified && (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
              <BadgeCheck className="h-3 w-3" aria-hidden />
              {t.shop.verified}
            </span>
          )}
        </div>

        <h2 className="truncate text-base font-bold text-brand-900 group-hover:text-brand-700">
          {shop.shopName}
        </h2>
        <div className="mt-1.5">
          <StarRating rating={shop.rating} count={shop.reviewCount} size="sm" />
        </div>

        {shop.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">{shop.description}</p>
        )}

        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
          <ShoppingBag className="h-3.5 w-3.5 text-brand-500" aria-hidden />
          {t.shops.salesLabel(formatNumber(shop.totalSales))}
        </div>
      </div>
    </Link>
  );
}
