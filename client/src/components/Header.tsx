'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Store,
  Cpu,
  Smartphone,
  Headphones,
  Laptop,
  Watch,
  Gamepad2,
  Shirt,
  House,
  Dumbbell,
  BookOpen,
  Sparkles,
  ToyBrick,
} from 'lucide-react';
import { useAuthStore } from '../store';
import { t } from '../lib/i18n';
import { UserRole } from '@ecommerce/shared';

// Slugs mirror the seeded catalog categories so each pill is a working link.
const categories = [
  { Icon: Cpu, label: t.categories.electronics, slug: 'electronics' },
  { Icon: Smartphone, label: t.categories.phones, slug: 'phones' },
  { Icon: Headphones, label: t.categories.audio, slug: 'audio' },
  { Icon: Laptop, label: t.categories.computers, slug: 'computers' },
  { Icon: Watch, label: t.categories.wearables, slug: 'wearables' },
  { Icon: Gamepad2, label: t.categories.gaming, slug: 'gaming' },
  { Icon: Shirt, label: t.categories.fashion, slug: 'fashion' },
  { Icon: House, label: t.categories.home, slug: 'home' },
  { Icon: Dumbbell, label: t.categories.sports, slug: 'sports' },
  { Icon: BookOpen, label: t.categories.books, slug: 'books' },
  { Icon: Sparkles, label: t.categories.beauty, slug: 'beauty' },
  { Icon: ToyBrick, label: t.categories.toys, slug: 'toys' },
];

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '';

  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <header>
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 py-2">
        <div className="container-main flex items-center justify-center gap-2 text-sm font-semibold text-white">
          <Zap className="h-4 w-4 shrink-0 text-gold-300" aria-hidden />
          <span>{t.header.announcement}</span>
          <span className="text-brand-200">·</span>
          <a
            href="#"
            className="text-gold-300 underline underline-offset-2 hover:text-white transition-colors"
          >
            {t.header.announcementCta}
          </a>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="border-b border-border bg-white">
        <div className="container-main flex items-center gap-4 py-3 md:gap-6">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-lg font-extrabold text-white">
              A
            </span>
            <span className="hidden sm:flex items-center">
              <span className="text-xl font-extrabold text-brand-900">Abracadabra</span>
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex min-w-0 flex-1" role="search">
            <div className="relative flex w-full items-center rounded-full border border-border bg-[var(--color-bg)] transition-all focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="ml-4 h-5 w-5 shrink-0 text-muted"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.header.searchPlaceholder}
                className="w-full bg-transparent py-2.5 pl-3 pr-4 text-sm text-brand-900 placeholder:text-muted focus:outline-none"
              />
              <button
                type="submit"
                aria-label={t.header.search}
                className="mr-1 flex shrink-0 items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.965 11.026a5 5 0 111.06-1.06l2.755 2.754a.75.75 0 11-1.06 1.06l-2.755-2.754zM10.5 7a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="hidden md:inline">{t.header.search}</span>
              </button>
            </div>
          </form>

          {/* Action Icons */}
          <div className="flex shrink-0 items-center gap-4 md:gap-5">
            {isAuthenticated && user ? (
              <>
                {/* Admin link */}
                {user.role === UserRole.ADMIN && (
                  <Link
                    href="/admin"
                    className="hidden sm:flex items-center gap-1.5 text-muted transition-colors hover:text-brand-600"
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
                        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                      />
                    </svg>
                    <span className="text-[13px] font-medium hidden lg:inline">
                      {t.header.admin}
                    </span>
                  </Link>
                )}

                {/* Wishlist */}
                <button
                  type="button"
                  className="hidden sm:flex items-center gap-1.5 text-muted transition-colors hover:text-brand-600"
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
                  <span className="text-[13px] font-medium hidden lg:inline">
                    {t.header.wishlist}
                  </span>
                </button>

                {/* Cart */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors hover:bg-brand-100"
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
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                    />
                  </svg>
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    3
                  </span>
                </motion.button>

                {/* User avatar dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-[13px] font-bold text-white transition-colors hover:bg-brand-600"
                  >
                    {initials}
                  </button>
                  {showMenu && (
                    <div
                      className="absolute right-0 top-12 z-50 w-48 rounded-xl bg-white py-2 shadow-lg"
                      style={{ border: '1px solid var(--color-border)' }}
                    >
                      <div
                        className="px-4 py-2 border-b"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setShowMenu(false)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--color-bg)]"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {t.header.myProfile}
                      </Link>
                      {user.role === UserRole.SELLER && (
                        <Link
                          href="/seller"
                          onClick={() => setShowMenu(false)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--color-bg)]"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {t.header.sellerHub}
                        </Link>
                      )}
                      {user.role === UserRole.USER && (
                        <Link
                          href="/become-seller"
                          onClick={() => setShowMenu(false)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--color-bg)]"
                          style={{ color: 'var(--color-brand-600)' }}
                        >
                          {t.header.becomeSeller}
                        </Link>
                      )}
                      {user.role === UserRole.ADMIN && (
                        <Link
                          href="/admin"
                          onClick={() => setShowMenu(false)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--color-bg)]"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {t.header.admin}
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--color-bg)]"
                        style={{ color: 'var(--color-error)' }}
                      >
                        {t.header.logout}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-1.5 text-muted transition-colors hover:text-brand-600"
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
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                  <span className="text-[13px] font-medium hidden lg:inline">{t.header.login}</span>
                </Link>

                <Link
                  href="/register"
                  className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  {t.header.register}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <nav className="border-b border-border bg-white">
        <div className="container-main py-2.5">
          <ul className="scrollbar-hide flex items-center gap-2 overflow-x-auto">
            <li className="shrink-0">
              <Link
                href="/sellers"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-500 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-brand-600"
              >
                <Store className="h-4 w-4" aria-hidden />
                <span>{t.header.shops}</span>
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat.slug} className="shrink-0">
                <Link
                  href={`/c/${cat.slug}`}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-white px-4 py-2 text-[13px] font-medium text-brand-900 transition-all hover:border-brand-200 hover:bg-brand-50"
                >
                  <cat.Icon className="h-4 w-4 text-brand-500" aria-hidden />
                  <span>{cat.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
