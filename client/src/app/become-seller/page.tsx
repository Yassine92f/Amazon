'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import Header from '../../components/Header';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { registerSeller } from '../../lib/catalog';
import { useAuthStore } from '../../store';
import { t } from '../../lib/i18n';

function OnboardingForm() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerSeller({ shopName: shopName.trim(), description: description.trim() });
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        t.becomeSeller.registerError;
      setError(message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="container-main py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-md"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-green-500">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-extrabold text-brand-900">
            {t.becomeSeller.successTitle}
          </h1>
          <p className="mb-6 text-sm text-muted">{t.becomeSeller.successDesc}</p>
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push('/login?redirect=/seller');
            }}
            className="w-full rounded-md bg-brand-500 py-2.5 text-sm font-bold text-white"
          >
            {t.becomeSeller.successCta}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container-main py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-lg"
      >
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-600">
            {t.becomeSeller.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-brand-900">{t.becomeSeller.title}</h1>
          <p className="mt-2 text-sm text-muted">{t.becomeSeller.subtitle}</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-border bg-white p-8 shadow-md">
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-text">
              {t.becomeSeller.shopName}
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={60}
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder={t.becomeSeller.shopNamePlaceholder}
              className="w-full rounded-md border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-sm font-semibold text-text">
              {t.becomeSeller.description}{' '}
              <span className="text-xs font-normal text-muted">{t.becomeSeller.optional}</span>
            </label>
            <textarea
              maxLength={500}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.becomeSeller.descriptionPlaceholder}
              className="w-full resize-none rounded-md border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-md bg-brand-500 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? t.becomeSeller.creating : t.becomeSeller.create}
          </motion.button>

          <p className="mt-4 text-center text-xs text-muted">
            {t.becomeSeller.termsPrefix}
            <Link href="/" className="font-semibold text-brand-600 hover:underline">
              {t.becomeSeller.terms}
            </Link>
            .
          </p>
        </form>
      </motion.div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <Header />
      <OnboardingForm />
    </ProtectedRoute>
  );
}
