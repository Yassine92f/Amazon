'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getMyShop,
  listMyProducts,
  type SellerDto,
  type ProductSummaryDto,
} from '../../lib/catalog';

function formatEUR(value: number): string {
  return `€${value.toFixed(2).replace('.', ',')}`;
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const [shop, setShop] = useState<SellerDto | null>(null);
  const [products, setProducts] = useState<ProductSummaryDto[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, drafts: 0, outOfStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getMyShop().catch(() => null),
      listMyProducts({ page: 1, limit: 5 }).catch(() => null),
      listMyProducts({ page: 1, limit: 1, isFeatured: undefined }).catch(() => null),
    ]).then(([s, recent, full]) => {
      if (cancelled) return;
      if (!s) {
        router.replace('/become-seller');
        return;
      }
      setShop(s);
      setProducts(recent?.items ?? []);
      const items = full?.items ?? recent?.items ?? [];
      setStats({
        total: full?.total ?? recent?.total ?? 0,
        active: items.filter((p) => p.inStock).length,
        drafts: 0,
        outOfStock: items.filter((p) => !p.inStock).length,
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || !shop) {
    return <div className="container-main py-20 text-center text-sm text-muted">Loading…</div>;
  }

  return (
    <div className="container-main py-6">
      <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-3xl">
          🎧
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-brand-900">{shop.shopName}</h1>
            {shop.isVerified && (
              <span className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            ⭐ {shop.rating.toFixed(1)} ({shop.reviewCount} reviews) · {stats.total} products ·
            Joined{' '}
            {new Date(shop.joinedAt).toLocaleDateString('fr-FR', {
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/sellers/${shop.shopSlug}`}
            className="rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-text hover:border-brand-300"
          >
            View public page
          </Link>
          <Link
            href="/seller/settings"
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600"
          >
            Edit shop
          </Link>
        </div>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value="€—" hint="cart-orders branch" icon="📈" />
        <StatCard label="This Month" value="€—" hint="cart-orders branch" icon="📅" />
        <StatCard label="Orders" value="—" hint="cart-orders branch" icon="🛍" />
        <StatCard
          label="Products"
          value={`${stats.total}`}
          hint={`${stats.outOfStock} out of stock`}
          icon="📦"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-brand-900">Recent products</h2>
            <Link href="/seller/products" className="text-xs font-semibold text-brand-600">
              View all →
            </Link>
          </div>
          {products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-strong bg-bg p-8 text-center">
              <p className="mb-3 text-sm text-muted">You haven&apos;t added any product yet.</p>
              <Link
                href="/seller/products/new"
                className="inline-block rounded-md bg-brand-500 px-5 py-2 text-sm font-bold text-white"
              >
                + Add your first product
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {products.map((p) => (
                <li key={p._id}>
                  <Link
                    href={`/seller/products/${p._id}/edit`}
                    className="flex items-center gap-4 py-3 hover:bg-brand-50"
                  >
                    <div className="h-12 w-12 shrink-0 rounded-md bg-brand-100" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text">{p.name}</p>
                      <p className="text-xs text-muted">
                        {p.brand ?? '—'} · {formatEUR(p.price)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {p.inStock ? 'In stock' : 'Out'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
            <h3 className="mb-3 text-sm font-bold text-brand-900">Quick actions</h3>
            <Link
              href="/seller/products/new"
              className="mb-2 flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
            >
              + Add new product
            </Link>
            <Link
              href="/seller/products"
              className="mb-2 flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text"
            >
              📦 Manage products
            </Link>
            <Link
              href={`/sellers/${shop.shopSlug}`}
              className="flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text"
            >
              🔗 Visit public shop
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-50 text-base">
          {icon}
        </span>
      </div>
      <p className="text-2xl font-extrabold text-brand-900">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
