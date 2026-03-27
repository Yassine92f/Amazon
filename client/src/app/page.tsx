'use client';

import { motion } from 'motion/react';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import MobileTabBar from '@/components/MobileTabBar';

/* ── Spring presets ──────────────────────────────────────────── */
const springs = {
  smooth: { type: 'spring' as const, stiffness: 300, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 15 },
};

/* ── Stagger animation variants ──────────────────────────────── */
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: springs.smooth },
};

/* ── Data ────────────────────────────────────────────────────── */
const flashDeals = [
  {
    name: 'Sony WH-1000XM5 Wireless Headphones',
    price: 209,
    originalPrice: 349.99,
    rating: 4.7,
    reviewCount: 2341,
    image: '/products/sony-wh1000xm5-sm.jpg',
    seller: 'TechStore Official',
    freeShipping: true,
    badge: '-40%',
  },
  {
    name: 'Samsung Galaxy S24 Ultra 256GB',
    price: 899,
    originalPrice: 1299,
    rating: 4.8,
    reviewCount: 5672,
    image: '/products/samsung-s24ultra-sm.jpg',
    seller: 'Samsung Store',
    freeShipping: true,
    badge: '-30%',
  },
  {
    name: 'Logitech MX Keys S Keyboard',
    price: 89,
    originalPrice: 119,
    rating: 4.6,
    reviewCount: 1893,
    image: '/products/logitech-mxkeys-sm.jpg',
    seller: 'LogiShop',
    freeShipping: true,
    badge: '-25%',
  },
  {
    name: 'LG UltraGear 27" Gaming Monitor',
    price: 279,
    originalPrice: 399,
    rating: 4.9,
    reviewCount: 8234,
    image: '/products/lg-ultragear-sm.jpg',
    seller: 'LG Official',
    freeShipping: true,
    badge: '-30%',
  },
  {
    name: 'Sony DualSense Edge Controller',
    price: 179,
    originalPrice: 249,
    rating: 4.4,
    reviewCount: 1456,
    image: '/products/sony-dualsense-sm.jpg',
    seller: 'Sony Store',
    freeShipping: true,
    badge: '-28%',
  },
];

const trending = [
  {
    name: 'Nike Air Max 90 Sneakers',
    price: 139.99,
    rating: 4.6,
    reviewCount: 3421,
    image: '/products/nike-airmax90-sm.jpg',
    seller: 'Nike Official',
    freeShipping: true,
    badge: 'Best Seller',
  },
  {
    name: 'Apple Watch Ultra 2',
    price: 799,
    rating: 4.8,
    reviewCount: 2876,
    image: '/products/apple-watch-ultra2-sm.jpg',
    seller: 'Apple Store',
    freeShipping: true,
    badge: 'Best Seller',
  },
  {
    name: 'Apple AirPods Pro 2nd Gen',
    price: 249,
    rating: 4.8,
    reviewCount: 12453,
    image: '/products/airpods-pro2-sm.jpg',
    seller: 'Apple Store',
    freeShipping: true,
    badge: 'Best Seller',
  },
  {
    name: 'LEGO Technic Porsche 911 GT3 RS',
    price: 379.99,
    originalPrice: 449.99,
    rating: 4.9,
    reviewCount: 7654,
    image: '/products/lego-porsche-sm.jpg',
    seller: 'LEGO Store',
    freeShipping: true,
    badge: '-15%',
  },
  {
    name: 'CeraVe Moisturizing Cream 340g',
    price: 14.99,
    rating: 4.7,
    reviewCount: 24876,
    image: '/products/cerave-cream-sm.jpg',
    seller: 'CeraVe Official',
    freeShipping: false,
    badge: 'Best Seller',
  },
];

const newArrivals = [
  {
    name: "De'Longhi Magnifica Evo Coffee Machine",
    price: 379,
    rating: 4.6,
    reviewCount: 892,
    image: '/products/delonghi-coffee-sm.jpg',
    seller: "De'Longhi Official",
    freeShipping: true,
    badge: 'New',
  },
  {
    name: 'Atomic Habits by James Clear',
    price: 12.99,
    rating: 4.9,
    reviewCount: 48234,
    image: '/products/atomic-habits-sm.jpg',
    seller: 'BookStore',
    freeShipping: false,
    badge: 'Best Seller',
  },
  {
    name: 'Adjustable Dumbbells Set 20kg',
    price: 89.99,
    rating: 4.4,
    reviewCount: 3456,
    image: '/products/dumbbells-sm.jpg',
    seller: 'FitGear Pro',
    freeShipping: true,
    badge: 'New',
  },
  {
    name: 'Marshall Acton III Speaker',
    price: 269,
    rating: 4.7,
    reviewCount: 1234,
    emoji: '🎶',
    gradientFrom: 'from-stone-100',
    gradientTo: 'to-neutral-200',
    seller: 'Marshall Audio',
    freeShipping: true,
    badge: 'New',
  },
  {
    name: 'Ray-Ban Wayfarer Classic',
    price: 154,
    rating: 4.8,
    reviewCount: 5432,
    emoji: '🕶️',
    gradientFrom: 'from-stone-100',
    gradientTo: 'to-stone-200',
    seller: 'Ray-Ban Official',
    freeShipping: true,
    badge: 'New',
  },
];

const categories = [
  { emoji: '📱', name: 'Electronics', count: '12,400+', gradient: 'from-brand-50 to-brand-100' },
  { emoji: '👗', name: 'Fashion', count: '8,750+', gradient: 'from-pink-50 to-pink-100' },
  { emoji: '🏠', name: 'Home & Garden', count: '6,200+', gradient: 'from-green-50 to-green-100' },
  { emoji: '💎', name: 'Beauty', count: '4,100+', gradient: 'from-amber-50 to-amber-100' },
  { emoji: '⚽', name: 'Sports', count: '3,300+', gradient: 'from-blue-50 to-blue-100' },
  { emoji: '🎮', name: 'Gaming', count: '2,900+', gradient: 'from-violet-50 to-violet-100' },
];

const trustSignals = [
  { icon: '🚚', title: 'Free Shipping', desc: 'On orders over €29' },
  { icon: '🛡️', title: 'Secure Payment', desc: '256-bit SSL encryption' },
  { icon: '🔄', title: 'Easy Returns', desc: '30-day return policy' },
  { icon: '💬', title: '24/7 Support', desc: 'Chat, email & phone' },
];

/* ── Section Header ──────────────────────────────────────────── */
function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-brand-900">
        <span className="inline-block h-6 w-1 rounded-full bg-brand-500" />
        {title}
      </h2>
      {action && (
        <a
          href="#"
          className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
        >
          {action}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function Home() {
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
            {/* Main hero banner */}
            <motion.div
              variants={fadeUp}
              className="relative flex-1 overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 via-brand-400 to-gold-400 p-8 md:p-12"
            >
              <div className="relative z-10 max-w-md">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                  ✨ Spring Collection 2026
                </span>
                <h1 className="mt-4 text-3xl font-extrabold leading-tight text-white md:text-4xl">
                  Find Everything You Love
                </h1>
                <p className="mt-3 text-base leading-relaxed text-white/80 max-w-sm">
                  Millions of products from trusted sellers. Free shipping on orders over €29.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <motion.a
                    href="#"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={springs.bouncy}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[15px] font-bold text-brand-600 shadow-md transition-shadow hover:shadow-lg"
                  >
                    Shop the Sale
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2 8a.75.75 0 01.75-.75h8.69L8.22 4.03a.75.75 0 011.06-1.06l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H2.75A.75.75 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.a>
                  <a
                    href="#"
                    className="inline-flex items-center rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-[15px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    New Arrivals
                  </a>
                </div>
              </div>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[120px] opacity-20 select-none hidden lg:block">
                🛍️
              </span>
            </motion.div>

            {/* Side cards (desktop only) */}
            <div className="hidden lg:flex w-[320px] flex-col gap-5">
              <motion.div
                variants={fadeUp}
                className="relative flex-1 overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 p-5"
              >
                <p className="text-xs font-semibold text-brand-600">New in Tech</p>
                <p className="mt-1 text-xl font-extrabold text-brand-900">
                  AirPods
                  <br />
                  Max 2
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-500">From €199</p>
                <span className="pointer-events-none absolute right-3 bottom-3 text-5xl opacity-50 select-none">
                  🎧
                </span>
              </motion.div>
              <motion.div
                variants={fadeUp}
                className="relative flex-1 overflow-hidden rounded-xl bg-gradient-to-br from-gold-300 to-gold-400 p-5"
              >
                <p className="text-xs font-semibold text-brand-800">Trending</p>
                <p className="mt-1 text-xl font-extrabold text-brand-900">
                  Spring
                  <br />
                  Fashion
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-700">From €19</p>
                <span className="pointer-events-none absolute right-3 bottom-3 text-5xl opacity-50 select-none">
                  👗
                </span>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ── Flash Deals ── */}
        <div className="bg-white py-8">
          <section className="container-main">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <SectionHeader title="⚡ Flash Deals" />
              <div className="flex items-center gap-2 text-sm">
                <span className="hidden sm:inline text-muted font-medium">Ends in</span>
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
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
              className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              {flashDeals.map((product) => (
                <motion.div key={product.name} variants={fadeUp}>
                  <ProductCard {...product} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        </div>

        {/* ── Shop by Category ── */}
        <section className="container-main py-10">
          <SectionHeader title="Shop by Category" action="All categories" />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {categories.map((cat) => (
              <motion.div
                key={cat.name}
                variants={fadeUp}
                whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(31,23,16,0.08)' }}
                transition={springs.smooth}
                className={`flex cursor-pointer flex-col items-start justify-end rounded-xl bg-gradient-to-br ${cat.gradient} p-5 h-[130px] sm:h-[140px] transition-all`}
              >
                <span className="text-3xl">{cat.emoji}</span>
                <p className="mt-1.5 text-[15px] font-bold text-brand-900">{cat.name}</p>
                <p className="text-xs text-muted">{cat.count} items</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Trending Now ── */}
        <div className="bg-white py-8">
          <section className="container-main">
            <SectionHeader title="🔥 Trending Now" action="View all" />
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
              className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              {trending.map((product) => (
                <motion.div key={product.name} variants={fadeUp}>
                  <ProductCard {...product} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        </div>

        {/* ── New Arrivals ── */}
        <section className="container-main py-10">
          <SectionHeader title="✨ New Arrivals" action="See all" />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {newArrivals.map((product) => (
              <motion.div key={product.name} variants={fadeUp}>
                <ProductCard {...product} />
              </motion.div>
            ))}
          </motion.div>
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
                <p className="text-lg sm:text-xl font-bold text-white">
                  Download our app — Get €10 off your first order!
                </p>
                <p className="mt-1 text-sm text-white/60">
                  Use code HELLO10 at checkout. Valid for new customers only.
                </p>
              </div>
            </div>
            <motion.a
              href="#"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={springs.bouncy}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-brand-600 shadow-md"
            >
              Get the App
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M8.75 2.75a.75.75 0 00-1.5 0v5.69L5.03 6.22a.75.75 0 00-1.06 1.06l3.5 3.5a.75.75 0 001.06 0l3.5-3.5a.75.75 0 00-1.06-1.06L8.75 8.44V2.75z" />
                <path d="M3.5 9.75a.75.75 0 00-1.5 0v1.5A2.75 2.75 0 004.75 14h6.5A2.75 2.75 0 0014 11.25v-1.5a.75.75 0 00-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-1.5z" />
              </svg>
            </motion.a>
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

      {/* ── Footer ── */}
      <footer className="bg-brand-900 text-white">
        <div className="container-main py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-extrabold text-white">
                  M
                </span>
                <span className="text-lg font-extrabold">Marché.io</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/50 max-w-[260px]">
                Your trusted marketplace for millions of products from verified sellers worldwide.
              </p>
            </div>

            {/* Shop */}
            <div>
              <h4 className="text-sm font-bold mb-3">Shop</h4>
              <nav className="flex flex-col gap-2">
                {['All Categories', 'Flash Deals', 'New Arrivals', 'Best Sellers'].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </nav>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-bold mb-3">Support</h4>
              <nav className="flex flex-col gap-2">
                {['Help Center', 'Track Order', 'Returns & Refunds', 'Contact Us'].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </nav>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-bold mb-3">Company</h4>
              <nav className="flex flex-col gap-2">
                {['About Us', 'Careers', 'Press', 'Affiliate Program'].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </nav>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-bold mb-3">Legal</h4>
              <nav className="flex flex-col gap-2">
                {['Privacy Policy', 'Terms of Service', 'Cookie Settings'].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40">
            <span>© 2026 Marché.io — All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span>€ EUR</span>
              <span>🇫🇷 Français</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Mobile Tab Bar ── */}
      <MobileTabBar />
    </>
  );
}
