'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import Header from '@/components/Header';
import StarRating from '@/components/StarRating';
import Badge from '@/components/Badge';
import ProductCard from '@/components/ProductCard';
import MobileTabBar from '@/components/MobileTabBar';

/* ── Spring presets (consistent with homepage) ─────────────── */
const springs = {
  smooth: { type: 'spring' as const, stiffness: 300, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 15 },
  snappy: { type: 'spring' as const, stiffness: 500, damping: 30 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: springs.smooth },
};

/* ── Mock data ─────────────────────────────────────────────── */
const product = {
  _id: '1',
  sellerId: 'seller-1',
  name: 'Samsung Galaxy S24 Ultra',
  slug: 'samsung-galaxy-s24-ultra',
  description:
    "The Samsung Galaxy S24 Ultra redefines what a smartphone can do. Powered by the latest Snapdragon 8 Gen 3 processor and Samsung's custom AI engine, it delivers unmatched performance for gaming, productivity, and creative work. The stunning 6.8-inch Dynamic AMOLED 2X display with 120Hz adaptive refresh rate brings every detail to life with vibrant, true-to-life colors.",
  categoryId: 'electronics',
  brand: 'Samsung',
  tags: ['smartphone', 'flagship', '5G', 'AI'],
  images: [
    '/products/samsung-s24ultra-sm.jpg',
    '/products/samsung-s24ultra-sm.jpg',
    '/products/samsung-s24ultra-sm.jpg',
    '/products/samsung-s24ultra-sm.jpg',
    '/products/samsung-s24ultra-sm.jpg',
  ],
  rating: 4.8,
  reviewCount: 5672,
  isActive: true,
  variants: [
    {
      _id: 'v1',
      name: '256GB Titanium Gray',
      sku: 'S24U-256-TG',
      price: 899,
      compareAtPrice: 1299,
      stock: 35,
      attributes: { color: 'Titanium Gray', storage: '256 GB' },
      images: [],
    },
    {
      _id: 'v2',
      name: '512GB Titanium Gray',
      sku: 'S24U-512-TG',
      price: 1049,
      compareAtPrice: 1459,
      stock: 18,
      attributes: { color: 'Titanium Gray', storage: '512 GB' },
      images: [],
    },
    {
      _id: 'v3',
      name: '1TB Titanium Gray',
      sku: 'S24U-1TB-TG',
      price: 1299,
      compareAtPrice: 1659,
      stock: 5,
      attributes: { color: 'Titanium Gray', storage: '1 TB' },
      images: [],
    },
  ],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-03-20T00:00:00.000Z',
};

const colorOptions = [
  { name: 'Titanium Gray', hex: '#2D2D2D' },
  { name: 'Titanium Black', hex: '#8A8A8A' },
  { name: 'Titanium Gold', hex: '#D4B896' },
  { name: 'Titanium Violet', hex: '#E8D5F5' },
];

const specifications = [
  { label: 'Display', value: '6.8" Dynamic AMOLED 2X, 120Hz, 3120x1440' },
  { label: 'Processor', value: 'Snapdragon 8 Gen 3 for Galaxy' },
  { label: 'RAM / Storage', value: '12 GB / 256 GB' },
  { label: 'Camera', value: '200MP Main + 12MP Ultra Wide + 50MP Telephoto + 10MP Telephoto' },
  { label: 'Battery', value: '5,000 mAh, 45W Fast Charging' },
  { label: 'OS', value: 'Android 14, One UI 6.1' },
];

const relatedProducts = [
  {
    name: 'Apple iPhone 15 Pro Max',
    price: 1199,
    originalPrice: 1479,
    rating: 4.7,
    reviewCount: 8234,
    image: '/products/samsung-s24ultra-sm.jpg',
    seller: 'Apple Store',
    freeShipping: true,
    badge: '-19%',
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
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
    name: 'Samsung Galaxy Tab S9 Ultra',
    price: 949,
    originalPrice: 1179,
    rating: 4.5,
    reviewCount: 1456,
    emoji: '📱',
    gradientFrom: 'from-brand-50',
    gradientTo: 'to-brand-100',
    seller: 'Samsung Store',
    freeShipping: true,
    badge: '-20%',
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
];

/* ── Helpers ───────────────────────────────────────────────── */
function formatPrice(value: number): string {
  return (
    value.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' \u20AC'
  );
}

function discountPercent(price: number, compareAt: number): string {
  return `-${Math.round(((compareAt - price) / compareAt) * 100)}%`;
}

/* ── Page ──────────────────────────────────────────────────── */
export default function ProductPage() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');

  const variant = product.variants[selectedVariant];
  const storageOptions = [...new Set(product.variants.map((v) => v.attributes.storage))];

  return (
    <>
      <Header />

      <main className="pb-24 md:pb-0">
        {/* ── Breadcrumbs ── */}
        <nav className="container-main py-4" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-[13px]">
            <li>
              <Link
                href="/"
                className="font-medium text-brand-500 hover:text-brand-600 transition-colors"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3.5 w-3.5 text-muted"
              >
                <path
                  fillRule="evenodd"
                  d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li>
              <Link
                href="/products?category=electronics"
                className="font-medium text-brand-500 hover:text-brand-600 transition-colors"
              >
                Electronics
              </Link>
            </li>
            <li aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3.5 w-3.5 text-muted"
              >
                <path
                  fillRule="evenodd"
                  d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li>
              <span className="font-medium text-muted">{product.name}</span>
            </li>
          </ol>
        </nav>

        {/* ── Product Main ── */}
        <section className="container-main pb-10">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* ── Gallery ── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={springs.smooth}
              className="w-full lg:w-[680px] shrink-0"
            >
              {/* Main Image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-brand-50">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="relative h-full w-full"
                  >
                    {product.images[selectedImage] ? (
                      <Image
                        src={product.images[selectedImage]}
                        alt={`${product.name} — view ${selectedImage + 1}`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 680px"
                        className="object-contain p-8"
                        priority
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-[120px] select-none">📱</span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Thumbnails */}
              <div className="mt-3 flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(i)}
                    className={`relative h-[90px] w-[90px] shrink-0 overflow-hidden rounded-md transition-all ${
                      selectedImage === i
                        ? 'ring-2 ring-brand-500 ring-offset-2'
                        : 'border border-border hover:border-brand-200'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${i + 1}`}
                      fill
                      sizes="90px"
                      className="object-contain bg-brand-50 p-2"
                    />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* ── Product Info ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={springs.smooth}
              className="flex-1 min-w-0"
            >
              <div className="flex flex-col gap-5">
                {/* Brand */}
                {product.brand && (
                  <Link
                    href={`/products?brand=${encodeURIComponent(product.brand)}`}
                    className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
                  >
                    {product.brand}
                  </Link>
                )}

                {/* Title */}
                <h1 className="text-2xl font-extrabold leading-tight text-brand-900 sm:text-[28px]">
                  {product.name}
                </h1>

                {/* Rating Row */}
                <div className="flex flex-wrap items-center gap-3">
                  <StarRating rating={product.rating} size="md" />
                  <span className="text-sm font-bold text-brand-900">{product.rating}</span>
                  <button
                    type="button"
                    className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
                  >
                    {product.reviewCount.toLocaleString('fr-FR')} reviews
                  </button>
                  <span className="text-muted">·</span>
                  <span className="text-sm text-muted">2,340 sold</span>
                </div>

                <hr className="border-border" />

                {/* Price Block */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-3xl font-extrabold text-brand-600">
                      {formatPrice(variant.price)}
                    </span>
                    {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
                      <>
                        <span className="text-lg text-muted line-through">
                          {formatPrice(variant.compareAtPrice)}
                        </span>
                        <Badge label={discountPercent(variant.price, variant.compareAtPrice)} />
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted">Flagship Samsung with integrated AI</p>
                </div>

                <hr className="border-border" />

                {/* Color Selector */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-sm font-semibold text-brand-900">
                    Color:{' '}
                    <span className="font-normal text-muted">
                      {colorOptions[selectedColor].name}
                    </span>
                  </span>
                  <div className="flex items-center gap-2.5">
                    {colorOptions.map((color, i) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(i)}
                        aria-label={color.name}
                        className={`h-10 w-10 rounded-full transition-all ${
                          selectedColor === i
                            ? 'ring-2 ring-brand-500 ring-offset-2'
                            : 'ring-1 ring-border-strong hover:ring-brand-300'
                        }`}
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Storage Selector */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-sm font-semibold text-brand-900">Storage</span>
                  <div className="flex flex-wrap gap-2">
                    {storageOptions.map((storage, i) => (
                      <button
                        key={storage}
                        type="button"
                        onClick={() => setSelectedVariant(i)}
                        className={`rounded-md px-5 py-2.5 text-[13px] font-semibold transition-all ${
                          selectedVariant === i
                            ? 'border-2 border-brand-500 bg-brand-50 text-brand-600'
                            : 'border border-border bg-white text-brand-900 hover:border-brand-200 hover:bg-brand-50'
                        }`}
                      >
                        {storage}
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-border" />

                {/* Action Row: Quantity + Add to Cart + Wishlist */}
                <div className="flex items-center gap-3">
                  {/* Quantity Selector */}
                  <div className="flex items-center overflow-hidden rounded-md border border-border bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-12 w-11 items-center justify-center text-muted transition-colors hover:bg-brand-50 hover:text-brand-600"
                      aria-label="Decrease quantity"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <span className="flex h-12 w-12 items-center justify-center border-x border-border text-[15px] font-semibold text-brand-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(variant.stock, quantity + 1))}
                      className="flex h-12 w-11 items-center justify-center text-brand-900 transition-colors hover:bg-brand-50 hover:text-brand-600"
                      aria-label="Increase quantity"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                      </svg>
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={springs.bouncy}
                    className="flex flex-1 items-center justify-center gap-2.5 rounded-md bg-brand-500 px-8 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path d="M1 1.75A.75.75 0 011.75 1h1.628a1.75 1.75 0 011.734 1.51L5.18 3h13.07a.75.75 0 01.733.918l-1.5 6.5A.75.75 0 0116.75 11H6.41l.26 1.5h9.08a.75.75 0 010 1.5H6.25a.75.75 0 01-.74-.637L3.68 2.51A.25.25 0 003.378 2.25H1.75A.75.75 0 011 1.75zM6 17.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM17.5 17.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    </svg>
                    Add to Cart
                  </motion.button>

                  {/* Wishlist */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    transition={springs.snappy}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-[1.5px] border-border-strong bg-white text-muted transition-colors hover:border-brand-300 hover:text-brand-500"
                    aria-label="Add to wishlist"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="h-[22px] w-[22px]"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                      />
                    </svg>
                  </motion.button>
                </div>

                {/* Stock */}
                <div className="flex items-center gap-2">
                  <Badge label="In Stock" variant="instock" />
                  <span className="text-[13px] font-medium text-[#2D9F5F]">
                    {variant.stock} in stock
                  </span>
                </div>

                <hr className="border-border" />

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-0">
                  {[
                    { icon: 'truck', title: 'Free Shipping', desc: 'Orders over \u20AC50' },
                    { icon: 'shield-check', title: 'Secure Payment', desc: 'SSL encrypted' },
                    { icon: 'refresh-cw', title: '30-Day Returns', desc: 'Hassle free' },
                  ].map((badge) => (
                    <div
                      key={badge.title}
                      className="flex flex-col items-center gap-1.5 rounded-md bg-brand-50 px-3 py-4 text-center"
                    >
                      <TrustIcon name={badge.icon} />
                      <span className="text-xs font-semibold text-brand-900">{badge.title}</span>
                      <span className="text-[11px] text-muted">{badge.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Seller Card */}
                <div className="flex items-center gap-4 rounded-lg border border-border bg-white p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-600">
                    T
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted">Sold by</p>
                    <p className="text-[15px] font-bold text-brand-900">TechStore Official</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="h-3.5 w-3.5 text-amber-400"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 1.75a.75.75 0 01.692.462l1.41 3.393 3.664.293a.75.75 0 01.428 1.317l-2.791 2.39.853 3.58a.75.75 0 01-1.12.814L8 11.989l-3.136 1.91a.75.75 0 01-1.12-.814l.853-3.58-2.791-2.39a.75.75 0 01.428-1.317l3.664-.293 1.41-3.393A.75.75 0 018 1.75z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs text-muted">4.9 · 12,453 sales</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="flex shrink-0 items-center gap-1.5 rounded-md border-[1.5px] border-border-strong bg-white px-4 py-2.5 text-[13px] font-semibold text-brand-900 transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.202 41.202 0 01-5.183.501l-2.7 2.7A.75.75 0 017.5 16.06v-2.742c-.428-.03-.854-.065-1.278-.107C4.786 12.98 3.5 11.721 3.5 10.306V5.426c0-1.413.993-2.67 2.43-2.902h-2.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Contact
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Tabs Section ── */}
        <section className="container-main pb-10">
          {/* Tab Bar */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={`relative px-6 py-3.5 text-[15px] font-medium transition-colors ${
                activeTab === 'description'
                  ? 'font-bold text-brand-600'
                  : 'text-muted hover:text-brand-900'
              }`}
            >
              Description
              {activeTab === 'description' && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-brand-500"
                  transition={springs.smooth}
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`relative px-6 py-3.5 text-[15px] font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'font-bold text-brand-600'
                  : 'text-muted hover:text-brand-900'
              }`}
            >
              Reviews ({product.reviewCount.toLocaleString('fr-FR')})
              {activeTab === 'reviews' && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-brand-500"
                  transition={springs.smooth}
                />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'description' ? (
              <motion.div
                key="description"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="py-8"
              >
                <h2 className="text-xl font-bold text-brand-900">Product Description</h2>
                <p className="mt-4 max-w-3xl text-[15px] leading-[1.7] text-muted">
                  {product.description}
                </p>

                <h3 className="mt-8 text-lg font-bold text-brand-900">Specifications</h3>
                <div className="mt-4 overflow-hidden rounded-lg border border-border">
                  {specifications.map((spec, i) => (
                    <div
                      key={spec.label}
                      className={`flex items-center px-5 py-3.5 ${
                        i % 2 === 0 ? 'bg-brand-50' : 'bg-white'
                      }`}
                    >
                      <span className="w-[200px] shrink-0 text-sm font-medium text-muted">
                        {spec.label}
                      </span>
                      <span className="text-sm font-medium text-brand-900">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="py-8"
              >
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-extrabold text-brand-900">{product.rating}</p>
                    <StarRating rating={product.rating} size="md" />
                    <p className="mt-1 text-xs text-muted">
                      {product.reviewCount.toLocaleString('fr-FR')} reviews
                    </p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const pct =
                        star === 5 ? 72 : star === 4 ? 18 : star === 3 ? 6 : star === 2 ? 3 : 1;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="w-3 text-xs font-medium text-muted">{star}</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className="h-3.5 w-3.5 text-amber-400"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8 1.75a.75.75 0 01.692.462l1.41 3.393 3.664.293a.75.75 0 01.428 1.317l-2.791 2.39.853 3.58a.75.75 0 01-1.12.814L8 11.989l-3.136 1.91a.75.75 0 01-1.12-.814l.853-3.58-2.791-2.39a.75.75 0 01.428-1.317l3.664-.293 1.41-3.393A.75.75 0 018 1.75z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div className="flex-1 h-2 rounded-full bg-brand-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-xs text-muted">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sample Reviews */}
                <div className="mt-8 space-y-6">
                  {[
                    {
                      name: 'Marie L.',
                      rating: 5,
                      date: '2 weeks ago',
                      title: 'Absolutely stunning phone',
                      comment:
                        "The camera quality is insane and the AI features are genuinely useful. Battery lasts all day even with heavy use. Best phone I've ever owned.",
                    },
                    {
                      name: 'Thomas D.',
                      rating: 4,
                      date: '1 month ago',
                      title: 'Great but pricey',
                      comment:
                        'Excellent build quality and performance. The S Pen integration is seamless. Only downside is the price, but you get what you pay for.',
                    },
                    {
                      name: 'Sophie M.',
                      rating: 5,
                      date: '3 weeks ago',
                      title: 'Perfect upgrade from S22',
                      comment:
                        'Night and day difference from my S22 Ultra. The display is brighter, cameras are sharper, and the AI editing tools save me so much time.',
                    },
                  ].map((review) => (
                    <div key={review.name} className="border-b border-border pb-6 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600">
                          {review.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-900">{review.name}</p>
                          <p className="text-xs text-muted">{review.date}</p>
                        </div>
                        <div className="ml-auto">
                          <StarRating rating={review.rating} />
                        </div>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-brand-900">{review.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── Related Products ── */}
        <div className="bg-white py-10">
          <section className="container-main">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-brand-900 sm:text-[22px]">
                <span className="inline-block h-6 w-1 rounded-full bg-brand-500" />
                You Might Also Like
              </h2>
              <Link
                href="/products"
                className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
              >
                View all
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
              </Link>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
              className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {relatedProducts.map((p) => (
                <motion.div key={p.name} variants={fadeUp}>
                  <ProductCard {...p} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-brand-900 text-white">
        <div className="container-main py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
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
            {[
              {
                title: 'Shop',
                links: ['All Categories', 'Flash Deals', 'New Arrivals', 'Best Sellers'],
              },
              {
                title: 'Support',
                links: ['Help Center', 'Track Order', 'Returns & Refunds', 'Contact Us'],
              },
              { title: 'Company', links: ['About Us', 'Careers', 'Press', 'Affiliate Program'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Settings'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-bold mb-3">{col.title}</h4>
                <nav className="flex flex-col gap-2">
                  {col.links.map((link) => (
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
            ))}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40">
            <span>&copy; 2026 Marché.io — All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span>&euro; EUR</span>
              <span>&#x1F1EB;&#x1F1F7; Français</span>
            </div>
          </div>
        </div>
      </footer>

      <MobileTabBar />
    </>
  );
}

/* ── Trust Icon Component ─────────────────────────────────── */
function TrustIcon({ name }: { name: string }) {
  switch (name) {
    case 'truck':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="h-[22px] w-[22px] text-brand-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        </svg>
      );
    case 'shield-check':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="h-[22px] w-[22px] text-brand-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
      );
    case 'refresh-cw':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="h-[22px] w-[22px] text-brand-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992"
          />
        </svg>
      );
    default:
      return null;
  }
}
