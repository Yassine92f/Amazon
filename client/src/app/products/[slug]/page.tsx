'use client';

import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Package, ShoppingCart } from 'lucide-react';
import Header from '../../../components/Header';
import StarRating from '../../../components/StarRating';
import ReviewsList from '../../../components/catalog/ReviewsList';
import CatalogProductCard from '../../../components/catalog/CatalogProductCard';
import { t, formatPrice, formatNumber } from '../../../lib/i18n';
import {
  getProductBySlug,
  searchProducts,
  type ProductDto,
  type ProductVariantDto,
  type ProductSummaryDto,
} from '../../../lib/catalog';

/* ── Variant option model ────────────────────────────────────────────
 * Variants carry a free-form `attributes` map (e.g. { color, storage,
 * size }). We derive one selectable dimension per distinct attribute key
 * so a product can expose any combination of axes — colour, storage,
 * size, region… — instead of a single flat list of variant names.       */

interface OptionGroup {
  key: string;
  values: string[];
}

// Preferred display order; unknown keys fall to the end, alphabetically stable.
const ATTR_ORDER = ['color', 'storage', 'capacity', 'size', 'band', 'region', 'material', 'style'];

// Solid colour chips. Dual colourways render as a split gradient below.
const COLOR_SWATCH: Record<string, string> = {
  black: '#1c1c1e',
  silver: '#c9ccce',
  white: '#f3f3f0',
  violet: '#8a7bd8',
  graphite: '#3a3a3c',
  'pale-grey': '#d9d8d2',
  titanium: '#8e8e93',
  gold: '#e6c79b',
  blue: '#3b6fb0',
  red: '#c0392b',
  green: '#2e9e63',
};

const DUAL_COLOR: Record<string, [string, string]> = {
  'white-black': ['#f3f3f0', '#1c1c1e'],
};

/** Humanizes an attribute slug for display (`pale-grey` → `Pale Grey`). */
function humanizeValue(value: string): string {
  if (/^\d/.test(value)) return value; // keep "256GB", "42", "512GB" verbatim
  return value
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** French label for an attribute key, falling back to a capitalized key. */
function attrLabel(key: string): string {
  return t.product.attr[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

/** Collapses every variant's attributes into ordered, de-duplicated axes. */
function deriveOptionGroups(variants: ProductVariantDto[]): OptionGroup[] {
  const map = new Map<string, string[]>();
  for (const v of variants) {
    for (const [key, value] of Object.entries(v.attributes)) {
      if (!map.has(key)) map.set(key, []);
      const values = map.get(key)!;
      if (!values.includes(value)) values.push(value);
    }
  }
  return [...map.entries()]
    .map(([key, values]) => ({ key, values }))
    .sort((a, b) => {
      const ia = ATTR_ORDER.indexOf(a.key);
      const ib = ATTR_ORDER.indexOf(b.key);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [related, setRelated] = useState<ProductSummaryDto[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setProduct(null);
    setNotFound(false);
    getProductBySlug(slug)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        const cheapest = [...p.variants].sort((a, b) => a.price - b.price)[0];
        setVariantId(cheapest?._id ?? null);
        setActiveImage(0);
        setQuantity(1);
        return searchProducts({ categoryId: p.categoryId, page: 1, limit: 6 });
      })
      .then((res) => {
        if (cancelled || !res) return;
        setRelated(res.items.filter((r) => r.slug !== slug).slice(0, 5));
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const groups = useMemo(() => (product ? deriveOptionGroups(product.variants) : []), [product]);

  const variant = useMemo(
    () => product?.variants.find((v) => v._id === variantId) ?? product?.variants[0] ?? null,
    [product, variantId],
  );

  const selected = variant?.attributes ?? {};

  // Keep the requested quantity within the selected variant's stock.
  useEffect(() => {
    if (variant) setQuantity((q) => Math.min(Math.max(1, q), Math.max(1, variant.stock)));
  }, [variant]);

  if (notFound) {
    return (
      <>
        <Header />
        <div className="container-main py-20 text-center">
          <h1 className="mb-2 text-2xl font-bold text-brand-900">{t.product.notFound}</h1>
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

  if (!product || !variant) {
    return (
      <>
        <Header />
        <div className="container-main py-20 text-center text-sm text-muted">
          {t.common.loading}
        </div>
      </>
    );
  }

  const gallery = variant.images.length > 0 ? variant.images : product.images;
  const discount =
    variant.compareAtPrice && variant.compareAtPrice > variant.price
      ? Math.round(((variant.compareAtPrice - variant.price) / variant.compareAtPrice) * 100)
      : null;
  const maxQty = Math.min(variant.stock, 10);

  /** Switch to the variant matching a chosen value, keeping other axes if possible. */
  function selectValue(key: string, value: string) {
    if (!product) return;
    const others = groups.filter((g) => g.key !== key);
    const exact = product.variants.find(
      (v) =>
        v.attributes[key] === value && others.every((g) => v.attributes[g.key] === selected[g.key]),
    );
    const target =
      exact ??
      product.variants.find((v) => v.attributes[key] === value && v.stock > 0) ??
      product.variants.find((v) => v.attributes[key] === value);
    if (target) {
      setVariantId(target._id);
      setActiveImage(0);
    }
  }

  /** Is there an in-stock variant for this value given the other current choices? */
  function isValueAvailable(key: string, value: string): boolean {
    const others = groups.filter((g) => g.key !== key);
    return product!.variants.some(
      (v) =>
        v.attributes[key] === value &&
        v.stock > 0 &&
        others.every((g) => v.attributes[g.key] === selected[g.key]),
    );
  }

  const specs: [string, string][] = [];
  if (product.brand) specs.push([t.product.specBrand, product.brand]);
  if (product.categoryName) specs.push([t.product.specCategory, product.categoryName]);
  for (const g of groups) {
    if (selected[g.key]) specs.push([attrLabel(g.key), humanizeValue(selected[g.key])]);
  }
  specs.push([t.product.specSku, variant.sku]);
  specs.push([
    t.product.specAvailability,
    variant.stock > 0 ? t.product.inStock : t.product.outOfStock,
  ]);
  if (product.totalSold > 0) specs.push([t.product.specSold, formatNumber(product.totalSold)]);

  return (
    <>
      <Header />
      <nav className="container-main py-3 text-xs text-muted">
        <Link href="/" className="hover:text-text">
          {t.product.breadcrumbHome}
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
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* ── Gallery ── */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-white">
              {gallery[activeImage] ? (
                <Image
                  src={gallery[activeImage]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 640px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-border-strong">
                  <Package className="h-20 w-20" strokeWidth={1.25} aria-hidden />
                </div>
              )}
              {discount !== null && (
                <span className="absolute left-4 top-4 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  -{discount}%
                </span>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {gallery.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-colors ${
                      i === activeImage
                        ? 'border-brand-500'
                        : 'border-border hover:border-brand-300'
                    }`}
                  >
                    <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Buy box ── */}
          <div className="flex flex-col">
            {product.brand && (
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-600">
                {product.brand}
              </p>
            )}
            <h1 className="text-2xl font-extrabold leading-tight text-brand-900 sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <StarRating rating={product.rating} count={product.reviewCount} />
              {product.totalSold > 0 && (
                <span className="text-xs text-muted">
                  · {t.product.unitsSold(formatNumber(product.totalSold))}
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-extrabold text-brand-900">
                {formatPrice(variant.price)}
              </span>
              {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
                <span className="text-lg text-muted line-through">
                  {formatPrice(variant.compareAtPrice)}
                </span>
              )}
              {discount !== null && (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                  {t.product.save(formatPrice(variant.compareAtPrice! - variant.price))}
                </span>
              )}
            </div>

            {/* ── Variant selectors (one row per attribute axis) ── */}
            {groups.length > 0 ? (
              <div className="mt-6 flex flex-col gap-5">
                {groups.map((group) => (
                  <div key={group.key}>
                    <h3 className="mb-2 text-sm font-bold text-brand-900">
                      {attrLabel(group.key)} :{' '}
                      <span className="font-normal text-text">
                        {humanizeValue(selected[group.key] ?? '')}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      {group.values.map((value) => {
                        const isSelected = selected[group.key] === value;
                        const available = isValueAvailable(group.key, value);

                        if (group.key === 'color') {
                          const dual = DUAL_COLOR[value];
                          const solid = COLOR_SWATCH[value] ?? '#d9d8d2';
                          return (
                            <button
                              key={value}
                              type="button"
                              title={humanizeValue(value)}
                              aria-label={humanizeValue(value)}
                              aria-pressed={isSelected}
                              onClick={() => selectValue(group.key, value)}
                              className={`relative h-10 w-10 rounded-full border transition-all ${
                                isSelected
                                  ? 'border-transparent ring-2 ring-brand-500 ring-offset-2 ring-offset-[var(--color-bg)]'
                                  : 'border-border hover:ring-2 hover:ring-brand-200 hover:ring-offset-2 hover:ring-offset-[var(--color-bg)]'
                              } ${available ? '' : 'opacity-40'}`}
                              style={
                                dual
                                  ? {
                                      backgroundImage: `linear-gradient(135deg, ${dual[0]} 0 50%, ${dual[1]} 50% 100%)`,
                                    }
                                  : { backgroundColor: solid }
                              }
                            >
                              {!available && (
                                <span className="absolute inset-0 m-auto h-px w-7 rotate-45 bg-red-400" />
                              )}
                            </button>
                          );
                        }

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => selectValue(group.key, value)}
                            aria-pressed={isSelected}
                            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                              isSelected
                                ? 'border-brand-500 bg-brand-50 text-brand-700'
                                : 'border-border bg-white text-text hover:border-brand-300'
                            } ${available ? '' : 'text-muted opacity-50'}`}
                          >
                            {humanizeValue(value)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              product.variants.length > 1 && (
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-bold text-brand-900">
                    {t.product.variant} :{' '}
                    <span className="font-normal text-text">{variant.name}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {product.variants.map((v) => (
                      <button
                        key={v._id}
                        type="button"
                        onClick={() => setVariantId(v._id)}
                        disabled={v.stock === 0}
                        className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                          v._id === variant._id
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-border bg-white text-text hover:border-brand-300'
                        } ${v.stock === 0 ? 'opacity-50' : ''}`}
                      >
                        {v.name}
                        {v.stock === 0 && (
                          <span className="ml-2 text-xs">{t.product.outShort}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* ── Stock state ── */}
            <div className="mt-6 flex items-center gap-2 text-sm">
              {variant.stock > 0 ? (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                  {variant.stock <= 5 ? (
                    <span className="font-semibold text-orange-600">
                      {t.product.lowStock(variant.stock)}
                    </span>
                  ) : (
                    <span className="font-semibold text-green-700">
                      {t.product.inStock}
                      <span className="ml-1 font-normal text-muted">· {t.product.readyToShip}</span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                  <span className="font-semibold text-red-600">{t.product.outOfStock}</span>
                </>
              )}
            </div>

            {/* ── Quantity + add to cart ── */}
            <div className="mt-5 flex items-stretch gap-3">
              <div className="flex items-center rounded-lg border border-border bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="−"
                  className="flex h-12 w-11 items-center justify-center text-lg font-bold text-text disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-bold text-brand-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty}
                  aria-label="+"
                  className="flex h-12 w-11 items-center justify-center text-lg font-bold text-text disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <motion.button
                whileHover={{ scale: variant.stock === 0 ? 1 : 1.01 }}
                whileTap={{ scale: variant.stock === 0 ? 1 : 0.98 }}
                disabled={variant.stock === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:opacity-50"
              >
                <ShoppingCart className="h-5 w-5" aria-hidden />
                {t.product.addToCart}
                <span className="opacity-90">· {formatPrice(variant.price * quantity)}</span>
              </motion.button>
            </div>
            <p className="mt-2 text-center text-xs text-muted">{t.product.cartComingSoon}</p>

            {/* ── Trust strip ── */}
            <div className="mt-6 grid grid-cols-3 gap-2 rounded-xl border border-border bg-white p-4">
              <TrustItem
                title={t.product.trust.shippingTitle}
                desc={t.product.trust.shippingDesc}
                icon={
                  <path
                    d="M3 7h11v8H3V7Zm11 3h4l3 3v2h-7V10ZM7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                }
              />
              <TrustItem
                title={t.product.trust.returnsTitle}
                desc={t.product.trust.returnsDesc}
                icon={
                  <path
                    d="M4 12a8 8 0 1 1 2.3 5.6M4 12V7m0 5h5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                }
              />
              <TrustItem
                title={t.product.trust.secureTitle}
                desc={t.product.trust.secureDesc}
                icon={
                  <path
                    d="M12 3l7 3v5c0 4.4-3 8.3-7 9-4-0.7-7-4.6-7-9V6l7-3Zm-2.5 8.5 2 2 3.5-3.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                }
              />
            </div>

            {/* ── Seller ── */}
            {product.shopName && product.shopSlug && (
              <Link
                href={`/sellers/${product.shopSlug}`}
                className="mt-4 flex items-center justify-between rounded-xl border border-border bg-white p-4 transition-colors hover:border-brand-300"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {product.shopName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-muted">{t.product.soldBy}</p>
                    <p className="font-bold text-brand-900">{product.shopName}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-brand-600">
                  {t.product.visitShop} →
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* ── Description + specifications ── */}
        <div className="mt-14 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-brand-900">
              <span className="inline-block h-6 w-1 rounded-full bg-brand-500" />
              {t.product.description}
            </h2>
            <div className="rounded-xl border border-border bg-white p-6">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
                {product.description}
              </p>
              {product.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-brand-900">
              <span className="inline-block h-6 w-1 rounded-full bg-brand-500" />
              {t.product.specs}
            </h2>
            <dl className="overflow-hidden rounded-xl border border-border bg-white">
              {specs.map(([label, value], i) => (
                <div
                  key={label}
                  className={`flex items-center justify-between gap-4 px-5 py-3 text-sm ${
                    i % 2 === 1 ? 'bg-[var(--color-bg)]' : ''
                  }`}
                >
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-semibold text-text">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* ── Related products ── */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-brand-900">
              <span className="inline-block h-6 w-1 rounded-full bg-brand-500" />
              {t.product.relatedTitle}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {related.map((p) => (
                <CatalogProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Reviews ── */}
        <section className="mt-14">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-brand-900">
            <span className="inline-block h-6 w-1 rounded-full bg-brand-500" />
            {t.product.customerReviews}
          </h2>
          <ReviewsList productId={product._id} />
        </section>
      </main>
    </>
  );
}

function TrustItem({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-1 text-center">
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-brand-500" aria-hidden>
        {icon}
      </svg>
      <span className="text-xs font-bold leading-tight text-brand-900">{title}</span>
      <span className="text-[11px] leading-tight text-muted">{desc}</span>
    </div>
  );
}
