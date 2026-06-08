'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Check, Circle } from 'lucide-react';
import { api } from '../../lib/api';
import { GuestRoute } from '../../components/GuestRoute';
import { t } from '../../lib/i18n';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t.auth.minChars(8));
      return;
    }
    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }
    if (!token) {
      setError(t.auth.reset.missingToken);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        t.auth.reset.genericError;
      setError(message);
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          {t.auth.reset.invalidTitle}
        </h1>
        <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t.auth.reset.invalidDesc}
        </p>
        <Link
          href="/forgot-password"
          className="inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--color-brand-500)' }}
        >
          {t.auth.reset.requestNewLink}
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-7 w-7 text-green-500"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          {t.auth.reset.successTitle}
        </h1>
        <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t.auth.reset.successDesc}
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--color-brand-500)' }}
        >
          {t.auth.reset.signIn}
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        {t.auth.reset.title}
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        {t.auth.reset.subtitle}
      </p>

      {error && (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: '#fef2f2',
            color: 'var(--color-error)',
            border: '1px solid #fecaca',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            {t.auth.reset.newPassword}
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.auth.reset.newPasswordPlaceholder}
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
            style={{
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-brand-500)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            {t.auth.reset.confirmPassword}
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t.auth.reset.confirmPlaceholder}
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
            style={{
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-brand-500)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {password && (
          <div className="flex items-center gap-3 text-[12px]">
            <span
              className="flex items-center gap-1"
              style={{
                color: password.length >= 8 ? 'var(--color-success)' : 'var(--color-text-muted)',
              }}
            >
              {password.length >= 8 ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Circle className="h-3.5 w-3.5" aria-hidden />
              )}
              {t.auth.charsHint(8)}
            </span>
            <span
              className="flex items-center gap-1"
              style={{
                color:
                  password === confirmPassword && confirmPassword
                    ? 'var(--color-success)'
                    : 'var(--color-text-muted)',
              }}
            >
              {password === confirmPassword && confirmPassword ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Circle className="h-3.5 w-3.5" aria-hidden />
              )}
              {t.auth.identical}
            </span>
          </div>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-brand-500)' }}
        >
          {loading ? t.auth.reset.submitting : t.auth.reset.submit}
        </motion.button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <GuestRoute>
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center" aria-label="Abracadabra">
              <img src="/logo.svg" alt="Abracadabra" className="h-12 w-auto" />
            </Link>
          </div>

          <div
            className="rounded-2xl p-8"
            style={{
              backgroundColor: 'var(--color-surface)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Suspense
              fallback={
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-brand-500)] border-t-transparent" />
                </div>
              }
            >
              <ResetPasswordForm />
            </Suspense>
          </div>
        </motion.div>
      </div>
    </GuestRoute>
  );
}
