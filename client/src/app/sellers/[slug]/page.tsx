'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';
import StarRating from '../../../components/StarRating';
import CatalogProductCard from '../../../components/catalog/CatalogProductCard';
import {
  getPublicShop,
  searchProducts,
  type SellerDto,
  type ProductSummaryDto,
} from '../../../lib/catalog';

export default function PublicShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [shop, setShop] = useState<SellerDto | null>(null);
  const [products, setProducts] = useState<ProductSummaryDto[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPublicShop(slug)
      .then((s) => {
        if (cancelled) return;
        setShop(s);
        return searchProducts({ sellerId: s._id, page: 1, limit: 20 });
      })
      .then((res) => {
        if (cancelled || !res) return;
        setProducts(res.items);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
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
          <h1 className="mb-2 text-2xl font-bold text-brand-900">Shop not found</h1>
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

  if (!shop) {
    return (
      <>
        <Header />
        <div className="container-main py-20 text-center text-sm text-muted">Loading…</div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div
        className="relative h-40 bg-gradient-to-r from-brand-600 to-brand-800"
        style={
          shop.banner
            ? {
                backgroundImage: `url(${shop.banner})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      />
      <div className="container-main">
        <div className="-mt-12 mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-3xl">
            🏪
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-brand-900">{shop.shopName}</h1>
              {shop.isVerified && (
                <span className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
                  Verified
                </span>
              )}
            </div>
            <div className="mt-1">
              <StarRating rating={shop.rating} count={shop.reviewCount} />
            </div>
            <p className="mt-1 text-xs text-muted">
              {shop.totalSales} sales · Joined{' '}
              {new Date(shop.joinedAt).toLocaleDateString('fr-FR', {
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {shop.description && (
          <p className="mb-8 max-w-3xl rounded-lg border border-border bg-white p-5 text-sm leading-relaxed text-text">
            {shop.description}
          </p>
        )}

        <h2 className="mb-4 text-xl font-bold text-brand-900">Products</h2>
        {loading ? (
          <p className="text-sm text-muted">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border-strong bg-white p-8 text-center text-sm text-muted">
            This shop has no published products yet.
          </p>
        ) : (
          <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <CatalogProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
