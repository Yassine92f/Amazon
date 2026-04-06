'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import FiltersSidebar, { type FilterState } from './FiltersSidebar';
import CatalogProductCard from './CatalogProductCard';
import Pagination from './Pagination';
import {
  searchProducts,
  type ProductSearchParams,
  type ProductSearchResult,
} from '../../lib/catalog';

const SORT_OPTIONS: { value: NonNullable<ProductSearchParams['sortBy']>; label: string }[] = [
  { value: 'relevance', label: 'Best match' },
  { value: 'price', label: 'Price' },
  { value: 'rating', label: 'Customer rating' },
  { value: 'totalSold', label: 'Best sellers' },
  { value: 'createdAt', label: 'Newest' },
];

const EMPTY_FACETS: ProductSearchResult['facets'] = {
  categories: [],
  brands: [],
  priceRange: { min: 0, max: 0 },
  ratingDistribution: [],
};

interface Props {
  title: string;
  subtitle?: string;
  fixedQuery?: string;
  fixedCategoryId?: string;
  hideCategorySection?: boolean;
}

export default function CatalogShell({
  title,
  subtitle,
  fixedQuery,
  fixedCategoryId,
  hideCategorySection,
}: Props) {
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    inStock: false,
    categoryId: fixedCategoryId,
  });
  const [sortBy, setSortBy] = useState<NonNullable<ProductSearchParams['sortBy']>>(
    fixedQuery ? 'relevance' : 'totalSold',
  );
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ProductSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFilters((s) => ({ ...s, categoryId: fixedCategoryId }));
    setPage(1);
  }, [fixedCategoryId]);

  useEffect(() => {
    setPage(1);
  }, [fixedQuery]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchProducts({
      page,
      limit: 20,
      query: fixedQuery,
      categoryId: filters.categoryId,
      brand: filters.brands.length ? filters.brands : undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minRating: filters.minRating,
      inStock: filters.inStock || undefined,
      sortBy,
      sortOrder: sortBy === 'price' ? 'asc' : 'desc',
    })
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const m =
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Failed to load products';
        setError(m);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, sortBy, filters, fixedQuery]);

  const reset = () => setFilters({ brands: [], inStock: false, categoryId: fixedCategoryId });

  const activeChips: { label: string; clear: () => void }[] = [];
  for (const b of filters.brands) {
    activeChips.push({
      label: b,
      clear: () => setFilters((s) => ({ ...s, brands: s.brands.filter((x) => x !== b) })),
    });
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    activeChips.push({
      label: `€${filters.minPrice ?? 0} — €${filters.maxPrice ?? '∞'}`,
      clear: () => setFilters((s) => ({ ...s, minPrice: undefined, maxPrice: undefined })),
    });
  }
  if (filters.minRating) {
    activeChips.push({
      label: `${filters.minRating}★ & up`,
      clear: () => setFilters((s) => ({ ...s, minRating: undefined })),
    });
  }
  if (filters.inStock) {
    activeChips.push({
      label: 'In stock',
      clear: () => setFilters((s) => ({ ...s, inStock: false })),
    });
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="container-main py-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-900">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            {result && (
              <p className="mt-1 text-sm text-muted">
                {result.total.toLocaleString('fr-FR')} products
              </p>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as NonNullable<ProductSearchParams['sortBy']>)
            }
            className="rounded-md border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text outline-none focus:border-brand-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
        </div>

        {activeChips.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted">Active:</span>
            {activeChips.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={c.clear}
                className="flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-200"
              >
                {c.label}
                <span aria-hidden>×</span>
              </button>
            ))}
            <button
              type="button"
              onClick={reset}
              className="px-2 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-6 items-start">
          <FiltersSidebar
            facets={result?.facets ?? EMPTY_FACETS}
            state={filters}
            onChange={(s) => {
              setFilters(s);
              setPage(1);
            }}
            onReset={reset}
            hideCategorySection={hideCategorySection}
          />

          <div className="flex-1">
            {loading ? (
              <GridSkeleton />
            ) : error ? (
              <ErrorPanel message={error} />
            ) : !result || result.items.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                >
                  {result.items.map((p) => (
                    <CatalogProductCard key={p._id} product={p} />
                  ))}
                </motion.div>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] animate-pulse rounded-lg border border-border bg-white"
        />
      ))}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
      {message}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-white p-12 text-center">
      <div className="mb-3 text-4xl">🔍</div>
      <h3 className="mb-1 text-base font-bold text-brand-900">No products found</h3>
      <p className="text-sm text-muted">
        Try adjusting your filters or browse a different category.
      </p>
    </div>
  );
}
