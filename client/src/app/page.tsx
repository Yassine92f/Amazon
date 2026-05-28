'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import Header from '@/components/Header';
import MobileTabBar from '@/components/MobileTabBar';
import CatalogProductCard from '@/components/catalog/CatalogProductCard';
import { t } from '@/lib/i18n';
import {
  searchProducts,
  listCategories,
  type ProductSummaryDto,
  type CategoryDto,
} from '@/lib/catalog';

/* ── Spring presets ──────────────────────────────────────────── */
const springs = {
  smooth: { type: 'spring' as const, stiffness: 300, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 15 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: springs.smooth },
};

/* ── Static branding data ─────────────────────────────────────── */
const CATEGORY_GRADIENTS = [
  'from-brand-50 to-brand-100',
  'from-pink-50 to-pink-100',
  'from-green-50 to-green-100',
  'from-amber-50 to-amber-100',
  'from-blue-50 to-blue-100',
  'from-violet-50 to-violet-100',
  'from-rose-50 to-rose-100',
  'from-emerald-50 to-emerald-100',
];

const trustSignals = [
  { icon: '🚚', title: t.home.trust.shippingTitle, desc: t.home.trust.shippingDesc },
  { icon: '🛡️', title: t.home.trust.paymentTitle, desc: t.home.trust.paymentDesc },
  { icon: '🔄', title: t.home.trust.returnsTitle, desc: t.home.trust.returnsDesc },
  { icon: '💬', title: t.home.trust.supportTitle, desc: t.home.trust.supportDesc },
];

function SectionHeader({
  title,
  href,
  actionLabel,
  extra,
}: {
  title: string;
  href?: string;
  actionLabel?: string;
  // Optional content (e.g. a countdown) shown right after the title.
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2">
      <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-brand-900">
        <span className="inline-block h-6 w-1 rounded-full bg-brand-500" />
        {title}
      </h2>
      {extra}
      {href && actionLabel && (
        <Link
          href={href}
          className="ml-auto flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
        >
          {actionLabel}
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      )}
    </div>
  );
}

function ProductRow({ products, loading }: { products: ProductSummaryDto[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-lg border border-border bg-white"
          />
        ))}
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <p className="mt-5 rounded-lg border border-dashed border-border-strong bg-white p-6 text-center text-sm text-muted">
        {t.home.emptyProducts}
      </p>
    );
  }
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={staggerContainer}
      className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
    >
      {products.map((p) => (
        <motion.div key={p._id} variants={fadeUp}>
          <CatalogProductCard product={p} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function Home() {
  const [flashDeals, setFlashDeals] = useState<ProductSummaryDto[]>([]);
  const [trending, setTrending] = useState<ProductSummaryDto[]>([]);
  const [newArrivals, setNewArrivals] = useState<ProductSummaryDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      searchProducts({ page: 1, limit: 10, sortBy: 'totalSold', sortOrder: 'desc' }),
      searchProducts({ page: 1, limit: 5, sortBy: 'totalSold', sortOrder: 'desc' }),
      searchProducts({ page: 1, limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
      listCategories(),
    ])
      .then(([deals, trend, fresh, cats]) => {
        if (cancelled) return;
        setFlashDeals(
          deals.items.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price).slice(0, 5),
        );
        setTrending(trend.items);
        setNewArrivals(fresh.items);
        setCategories(cats.filter((c) => !c.parentId).slice(0, 8));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Header />

      <main className="pb-24 md:pb-0">
        {/* ── Hero Section ── */}
        <section className="container-main py-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col md:flex-row gap-5"
          >
            <motion.div
              variants={fadeUp}
              className="relative flex-1 overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 via-brand-400 to-gold-400 p-8 md:p-12"
            >
              <div className="relative z-10 max-w-md">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                  {t.home.heroEyebrow}
                </span>
                <h1 className="mt-4 text-3xl font-extrabold leading-tight text-white md:text-4xl">
                  {t.home.heroTitle}
                </h1>
                <p className="mt-3 text-base leading-relaxed text-white/80 max-w-sm">
                  {t.home.heroSubtitle}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={springs.bouncy}
                  >
                    <Link
                      href="/search"
                      className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[15px] font-bold text-brand-600 shadow-md transition-shadow hover:shadow-lg"
                    >
                      {t.home.heroShopSale}
                      <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                        <path
                          fillRule="evenodd"
                          d="M2 8a.75.75 0 01.75-.75h8.69L8.22 4.03a.75.75 0 011.06-1.06l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H2.75A.75.75 0 012 8z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Link>
                  </motion.div>
                  <Link
                    href="/c/electronics"
                    className="inline-flex items-center rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-[15px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    {t.home.heroNewArrivals}
                  </Link>
                </div>
              </div>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[120px] opacity-20 select-none hidden lg:block">
                🛍️
              </span>
            </motion.div>

            <div className="hidden lg:flex w-[320px] flex-col gap-5">
              <motion.div variants={fadeUp} className="relative flex-1 overflow-hidden rounded-xl">
                <Link
                  href="/c/audio"
                  className="block h-full bg-gradient-to-br from-brand-100 to-brand-200 p-5"
                >
                  <p className="text-xs font-semibold text-brand-600">{t.home.sideNewInTech}</p>
                  <p className="mt-1 text-xl font-extrabold text-brand-900">
                    AirPods
                    <br />
                    Pro 2
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-500">
                    {t.home.sideFrom('249 €')}
                  </p>
                  <span className="pointer-events-none absolute right-3 bottom-3 text-5xl opacity-50 select-none">
                    🎧
                  </span>
                </Link>
              </motion.div>
              <motion.div variants={fadeUp} className="relative flex-1 overflow-hidden rounded-xl">
                <Link
                  href="/c/fashion"
                  className="block h-full bg-gradient-to-br from-gold-300 to-gold-400 p-5"
                >
                  <p className="text-xs font-semibold text-brand-800">{t.home.sideTrending}</p>
                  <p className="mt-1 text-xl font-extrabold text-brand-900">
                    Mode
                    <br />
                    Printemps
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-700">
                    {t.home.sideFrom('19 €')}
                  </p>
                  <span className="pointer-events-none absolute right-3 bottom-3 text-5xl opacity-50 select-none">
                    👟
                  </span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ── Flash Deals ── */}
        <div className="bg-white py-8">
          <section className="container-main">
            <SectionHeader
              title={t.home.flashDeals}
              href="/search?sale=true"
              actionLabel={t.common.viewAll}
              extra={
                <div className="flex items-center gap-2 text-sm">
                  <span className="hidden sm:inline text-muted font-medium">{t.home.endsIn}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-brand-900 px-2 py-1 text-sm font-bold text-white">
                      02
                    </span>
                    <span className="font-bold text-brand-900">:</span>
                    <span className="rounded-md bg-brand-900 px-2 py-1 text-sm font-bold text-white">
                      14
                    </span>
                    <span className="font-bold text-brand-900">:</span>
                    <span className="rounded-md bg-brand-900 px-2 py-1 text-sm font-bold text-white">
                      37
                    </span>
                  </div>
                </div>
              }
            />
            <ProductRow products={flashDeals} loading={loading} />
          </section>
        </div>

        {/* ── Shop by Category ── */}
        <section className="container-main py-10">
          <SectionHeader title={t.home.shopByCategory} />
          {loading ? (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[130px] animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="mt-5 rounded-lg border border-dashed border-border-strong bg-white p-6 text-center text-sm text-muted">
              {t.home.emptyCategories}
            </p>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={staggerContainer}
              className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
            >
              {categories.map((cat, i) => (
                <motion.div key={cat._id} variants={fadeUp}>
                  <Link
                    href={`/c/${cat.slug}`}
                    className={`flex h-[130px] flex-col items-start justify-end rounded-xl bg-gradient-to-br ${
                      CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length]
                    } p-5 transition-all hover:-translate-y-1 hover:shadow-md sm:h-[140px]`}
                  >
                    <span className="text-3xl">{cat.icon ?? '📦'}</span>
                    <p className="mt-1.5 text-[15px] font-bold text-brand-900">{cat.name}</p>
                    <p className="text-xs text-muted">{t.home.browseAll}</p>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* ── Trending Now ── */}
        <div className="bg-white py-8">
          <section className="container-main">
            <SectionHeader
              title={t.home.trendingNow}
              href="/search?sortBy=totalSold"
              actionLabel={t.common.viewAll}
            />
            <ProductRow products={trending} loading={loading} />
          </section>
        </div>

        {/* ── New Arrivals ── */}
        <section className="container-main py-10">
          <SectionHeader
            title={t.home.newArrivals}
            href="/search?sortBy=createdAt"
            actionLabel={t.common.viewAll}
          />
          <ProductRow products={newArrivals} loading={loading} />
        </section>

        {/* ── Promo Banner ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springs.gentle}
          className="bg-gradient-to-r from-brand-800 via-brand-600 to-brand-500"
        >
          <div className="container-main flex flex-col sm:flex-row items-center justify-between gap-6 py-8 sm:py-10">
            <div className="flex items-center gap-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-3xl">
                🎁
              </span>
              <div>
                <p className="text-lg sm:text-xl font-bold text-white">{t.home.promoTitle}</p>
                <p className="mt-1 text-sm text-white/60">{t.home.promoSubtitle}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={springs.bouncy}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-brand-600 shadow-md"
            >
              {t.home.promoCta}
            </motion.button>
          </div>
        </motion.section>

        {/* ── Trust Signals ── */}
        <section className="container-main py-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {trustSignals.map((sig) => (
              <motion.div
                key={sig.title}
                variants={fadeUp}
                className="flex items-center gap-4 rounded-xl border border-border bg-white p-5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl">
                  {sig.icon}
                </span>
                <div>
                  <p className="text-[15px] font-bold text-brand-900">{sig.title}</p>
                  <p className="text-xs text-muted">{sig.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>

      <footer className="bg-brand-900 text-white">
        <div className="container-main py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-extrabold text-white">
                  A
                </span>
                <span className="text-lg font-extrabold">Abracadabra</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/50 max-w-[260px]">
                {t.footer.tagline}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-3">{t.footer.shop}</h4>
              <nav className="flex flex-col gap-2">
                <Link href="/search" className="text-sm text-white/50 hover:text-white">
                  {t.footer.allProducts}
                </Link>
                <Link href="/c/electronics" className="text-sm text-white/50 hover:text-white">
                  {t.categories.electronics}
                </Link>
                <Link href="/c/fashion" className="text-sm text-white/50 hover:text-white">
                  {t.categories.fashion}
                </Link>
                <Link href="/c/gaming" className="text-sm text-white/50 hover:text-white">
                  {t.categories.gaming}
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-3">{t.footer.sellers}</h4>
              <nav className="flex flex-col gap-2">
                <Link href="/become-seller" className="text-sm text-white/50 hover:text-white">
                  {t.footer.becomeSeller}
                </Link>
                <Link href="/seller" className="text-sm text-white/50 hover:text-white">
                  {t.footer.sellerHub}
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-3">{t.footer.company}</h4>
              <nav className="flex flex-col gap-2">
                <a href="#" className="text-sm text-white/50 hover:text-white">
                  {t.footer.about}
                </a>
                <a href="#" className="text-sm text-white/50 hover:text-white">
                  {t.footer.careers}
                </a>
                <a href="#" className="text-sm text-white/50 hover:text-white">
                  {t.footer.press}
                </a>
              </nav>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-3">{t.footer.legal}</h4>
              <nav className="flex flex-col gap-2">
                <a href="#" className="text-sm text-white/50 hover:text-white">
                  {t.footer.privacy}
                </a>
                <a href="#" className="text-sm text-white/50 hover:text-white">
                  {t.footer.terms}
                </a>
              </nav>
            </div>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40">
            <span>{t.footer.rights}</span>
            <div className="flex items-center gap-4">
              <span>{t.common.currency}</span>
              <span>{t.common.language}</span>
            </div>
          </div>
        </div>
      </footer>

      <MobileTabBar />
    </>
  );
}
