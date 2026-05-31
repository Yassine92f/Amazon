'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, GitCompare } from 'lucide-react';
import Header from '../../components/Header';
import StarRating from '../../components/StarRating';
import { t, formatPrice, formatNumber } from '../../lib/i18n';
import { useCompareStore } from '../../store/compare';
import { getProductBySlug, type ProductDto } from '../../lib/catalog';

function humanize(value: string): string {
  if (/^\d/.test(value)) return value;
  return value
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Distinct values of an attribute key across a product's variants. */
function attrValues(product: ProductDto, key: string): string[] {
  const set = new Set<string>();
  for (const v of product.variants) {
    if (v.attributes[key]) set.add(v.attributes[key]);
  }
  return [...set];
}

export default function ComparePage() {
  const items = useCompareStore((s) => s.items);
  const remove = useCompareStore((s) => s.remove);

  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    setLoading(true);
    Promise.all(items.map((i) => getProductBySlug(i.slug).catch(() => null)))
      .then((res) => {
        if (cancelled) return;
        setProducts(res.filter((p): p is ProductDto => p !== null));
        setLoading(false);
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // Refetch when the set of compared slugs changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, items.map((i) => i.slug).join(',')]);

  // Union of attribute keys across all compared products (colour, storage, …).
  const attrKeys = useMemo(() => {
    const keys: string[] = [];
    for (const p of products) {
      for (const v of p.variants) {
        for (const k of Object.keys(v.attributes)) if (!keys.includes(k)) keys.push(k);
      }
    }
    return keys;
  }, [products]);

  const bestPrice = products.length > 1 ? Math.min(...products.map((p) => p.minPrice)) : -1;
  const bestRating = products.length > 1 ? Math.max(...products.map((p) => p.rating)) : -1;

  return (
    <>
      <Header />
      <main className="container-main py-8">
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-extrabold text-brand-900 sm:text-3xl">
          <GitCompare className="h-6 w-6 text-brand-500" aria-hidden />
          {t.compare.title}
        </h1>
        <p className="mb-6 text-sm text-muted">{t.compare.subtitle}</p>

        {mounted && items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-strong bg-white p-12 text-center">
            <GitCompare
              className="mx-auto mb-3 h-10 w-10 text-brand-300"
              strokeWidth={1.5}
              aria-hidden
            />
            <h2 className="mb-1 text-base font-bold text-brand-900">{t.compare.empty}</h2>
            <p className="mb-4 text-sm text-muted">{t.compare.emptyDesc}</p>
            <Link
              href="/search"
              className="inline-block rounded-md bg-brand-500 px-5 py-2.5 text-sm font-bold text-white"
            >
              {t.compare.browse}
            </Link>
          </div>
        ) : loading ? (
          <div className="rounded-2xl border border-border bg-white p-12 text-center text-sm text-muted">
            {t.common.loading}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <tbody>
                {/* Product header row */}
                <tr className="border-b border-border">
                  <th className="w-36 p-4" />
                  {products.map((p) => (
                    <th key={p._id} className="border-l border-border p-4 text-left align-top">
                      <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-lg bg-[var(--color-bg)]">
                        {p.images[0] && (
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            sizes="200px"
                            className="object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => remove(p._id)}
                          aria-label={t.compare.remove}
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-600 shadow"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                      <Link
                        href={`/products/${p.slug}`}
                        className="line-clamp-2 font-bold text-brand-900 hover:text-brand-600"
                      >
                        {p.name}
                      </Link>
                    </th>
                  ))}
                </tr>

                <Row label={t.compare.rowPrice}>
                  {products.map((p) => (
                    <Cell key={p._id}>
                      <span className="text-base font-extrabold text-brand-900">
                        {formatPrice(p.minPrice)}
                      </span>
                      {p.minPrice === bestPrice && (
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          {t.compare.bestPrice}
                        </span>
                      )}
                    </Cell>
                  ))}
                </Row>

                <Row label={t.compare.rowRating}>
                  {products.map((p) => (
                    <Cell key={p._id}>
                      <div className="flex flex-wrap items-center gap-2">
                        <StarRating rating={p.rating} count={p.reviewCount} />
                        {p.rating === bestRating && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                            {t.compare.bestRating}
                          </span>
                        )}
                      </div>
                    </Cell>
                  ))}
                </Row>

                <Row label={t.compare.rowBrand}>
                  {products.map((p) => (
                    <Cell key={p._id}>{p.brand ?? '—'}</Cell>
                  ))}
                </Row>

                <Row label={t.compare.rowCategory}>
                  {products.map((p) => (
                    <Cell key={p._id}>{p.categoryName ?? '—'}</Cell>
                  ))}
                </Row>

                {attrKeys.map((key) => (
                  <Row key={key} label={t.product.attr[key] ?? humanize(key)}>
                    {products.map((p) => {
                      const vals = attrValues(p, key);
                      return (
                        <Cell key={p._id}>{vals.length ? vals.map(humanize).join(', ') : '—'}</Cell>
                      );
                    })}
                  </Row>
                ))}

                <Row label={t.compare.rowAvailability}>
                  {products.map((p) => (
                    <Cell key={p._id}>
                      <span
                        className={`font-semibold ${p.inStock ? 'text-green-700' : 'text-red-600'}`}
                      >
                        {p.inStock ? t.compare.inStock : t.compare.outOfStock}
                      </span>
                    </Cell>
                  ))}
                </Row>

                <Row label={t.compare.rowDescription}>
                  {products.map((p) => (
                    <Cell key={p._id}>
                      <p className="line-clamp-4 text-xs leading-relaxed text-muted">
                        {p.description}
                      </p>
                    </Cell>
                  ))}
                </Row>

                {/* CTA row */}
                <tr>
                  <td className="p-4" />
                  {products.map((p) => (
                    <td key={p._id} className="border-l border-border p-4 align-top">
                      <Link
                        href={`/products/${p.slug}`}
                        className="block rounded-md bg-brand-500 px-4 py-2 text-center text-sm font-bold text-white hover:bg-brand-600"
                      >
                        {t.compare.viewProduct}
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {mounted && items.length > 0 && (
          <p className="mt-4 text-xs text-muted">{t.compare.bar(formatNumber(items.length))}</p>
        )}
      </main>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-border last:border-0">
      <th className="bg-[var(--color-bg)] p-4 text-left align-top text-xs font-bold uppercase tracking-wide text-muted">
        {label}
      </th>
      {children}
    </tr>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="border-l border-border p-4 align-top text-text">{children}</td>;
}
