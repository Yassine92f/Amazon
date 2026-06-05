'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { api } from '../../lib/api';
import { t } from '../../lib/i18n';

type Status = 'pending' | 'verifying' | 'success' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        await api.post('/auth/verify-email', { token });
        if (!cancelled) setStatus('success');
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          t.auth.verify.invalidLinkError;
        setErrorMessage(message);
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification', { email: resendEmail });
      setResendSent(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        t.auth.verify.sendError;
      setErrorMessage(message);
    }
    setResendLoading(false);
  };

  if (status === 'verifying') {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-brand-500)] border-t-transparent" />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t.auth.verify.verifying}
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-green-500">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          {t.auth.verify.successTitle}
        </h1>
        <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t.auth.verify.successDesc}
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--color-brand-500)' }}
        >
          {t.auth.verify.signIn}
        </Link>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-red-500">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            {t.auth.verify.invalidTitle}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {errorMessage}
          </p>
        </div>
        {resendSent ? (
          <div
            className="rounded-lg px-4 py-3 text-center text-sm"
            style={{
              backgroundColor: '#f0fdf4',
              color: 'var(--color-success)',
              border: '1px solid #bbf7d0',
            }}
          >
            {t.auth.verify.resentNotice}
          </div>
        ) : (
          <form onSubmit={handleResend} className="space-y-3">
            <label className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {t.auth.verify.resendLabel}
            </label>
            <input
              type="email"
              required
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder={t.auth.verify.resendPlaceholder}
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
              }}
            />
            <motion.button
              type="submit"
              disabled={resendLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-brand-500)' }}
            >
              {resendLoading ? t.auth.verify.resending : t.auth.verify.resend}
            </motion.button>
          </form>
        )}
      </>
    );
  }

  return (
    <div className="text-center">
      <h1 className="mb-2 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        {t.auth.verify.pendingTitle}
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        {t.auth.verify.pendingDesc}
      </p>
      <Link
        href="/login"
        className="inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
        style={{ backgroundColor: 'var(--color-brand-500)' }}
      >
        {t.auth.verify.backToLogin}
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
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
          <Link href="/" className="inline-flex items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-extrabold text-white"
              style={{ backgroundColor: 'var(--color-brand-500)' }}
            >
              A
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              Abracadabra
            </span>
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
            <VerifyEmailContent />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
