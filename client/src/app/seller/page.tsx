'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  TrendingUp,
  Calendar,
  ShoppingBag,
  Package,
  Plus,
  ExternalLink,
  BadgeCheck,
  type LucideIcon,
} from 'lucide-react';
import {
  getMyShop,
  listMyProducts,
  type SellerDto,
  type ProductSummaryDto,
} from '../../lib/catalog';
import { t, formatPrice, formatNumber, formatMonthYear } from '../../lib/i18n';

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
    return (
      <div className="container-main py-20 text-center text-sm text-muted">
        {t.seller.dash.loading}
      </div>
    );
  }

  return (
    <div className="container-main py-6">
      <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
          {shop.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logo} alt="" className="h-full w-full rounded-lg object-cover" />
          ) : (
            <Store className="h-8 w-8" aria-hidden />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-brand-900">{shop.shopName}</h1>
            {shop.isVerified && (
              <span className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                {t.seller.dash.verified}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            {t.seller.dash.meta(
              shop.rating.toFixed(1),
              formatNumber(shop.reviewCount),
              formatNumber(stats.total),
              formatMonthYear(shop.joinedAt),
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/sellers/${shop.shopSlug}`}
            className="rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-text hover:border-brand-300"
          >
            {t.seller.dash.viewPublic}
          </Link>
          <Link
            href="/seller/settings"
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600"
          >
            {t.seller.dash.editShop}
          </Link>
        </div>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t.seller.dash.statRevenue}
          value="—"
          hint={t.seller.dash.soon}
          Icon={TrendingUp}
        />
        <StatCard
          label={t.seller.dash.statMonth}
          value="—"
          hint={t.seller.dash.soon}
          Icon={Calendar}
        />
        <StatCard
          label={t.seller.dash.statOrders}
          value="—"
          hint={t.seller.dash.soon}
          Icon={ShoppingBag}
        />
        <StatCard
          label={t.seller.dash.statProducts}
          value={formatNumber(stats.total)}
          hint={t.seller.dash.outOfStockHint(formatNumber(stats.outOfStock))}
          Icon={Package}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-brand-900">{t.seller.dash.recent}</h2>
            <Link href="/seller/products" className="text-xs font-semibold text-brand-600">
              {t.seller.dash.viewAll}
            </Link>
          </div>
          {products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-strong bg-bg p-8 text-center">
              <p className="mb-3 text-sm text-muted">{t.seller.dash.empty}</p>
              <Link
                href="/seller/products/new"
                className="inline-block rounded-md bg-brand-500 px-5 py-2 text-sm font-bold text-white"
              >
                {t.seller.dash.addFirst}
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
                        {p.brand ?? '—'} · {formatPrice(p.price)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {p.inStock ? t.seller.dash.inStock : t.seller.dash.out}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
            <h3 className="mb-3 text-sm font-bold text-brand-900">{t.seller.dash.quickActions}</h3>
            <Link
              href="/seller/products/new"
              className="mb-2 flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t.seller.dash.addNew}
            </Link>
            <Link
              href="/seller/products"
              className="mb-2 flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text"
            >
              <Package className="h-4 w-4 text-brand-500" aria-hidden />
              {t.seller.dash.manageProducts}
            </Link>
            <Link
              href={`/sellers/${shop.shopSlug}`}
              className="flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text"
            >
              <ExternalLink className="h-4 w-4 text-brand-500" aria-hidden />
              {t.seller.dash.visitPublic}
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
  Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  Icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-50 text-brand-600">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="text-2xl font-extrabold text-brand-900">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
