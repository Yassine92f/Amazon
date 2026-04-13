'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { api } from '../../lib/api';
import { GuestRoute } from '../../components/GuestRoute';

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
      setError('Le mot de passe doit contenir au moins 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (!token) {
      setError('Token de reinitialisation manquant');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Erreur lors de la reinitialisation';
      setError(message);
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Lien invalide
        </h1>
        <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Ce lien de reinitialisation est invalide ou a expire.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--color-brand-500)' }}
        >
          Demander un nouveau lien
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
          Mot de passe reinitialise
        </h1>
        <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Votre mot de passe a ete modifie avec succes.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--color-brand-500)' }}
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        Nouveau mot de passe
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Choisissez un nouveau mot de passe pour votre compte
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
            Nouveau mot de passe
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 caracteres"
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
            Confirmer le mot de passe
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Retapez votre mot de passe"
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
              style={{
                color: password.length >= 8 ? 'var(--color-success)' : 'var(--color-text-muted)',
              }}
            >
              {password.length >= 8 ? '✓' : '○'} 8+ caracteres
            </span>
            <span
              style={{
                color:
                  password === confirmPassword && confirmPassword
                    ? 'var(--color-success)'
                    : 'var(--color-text-muted)',
              }}
            >
              {password === confirmPassword && confirmPassword ? '✓' : '○'} Identiques
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
          {loading ? 'Reinitialisation...' : 'Reinitialiser le mot de passe'}
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
            <Link href="/" className="inline-flex items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-extrabold text-white"
                style={{ backgroundColor: 'var(--color-brand-500)' }}
              >
                M
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Marche.io
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
              <ResetPasswordForm />
            </Suspense>
          </div>
        </motion.div>
      </div>
    </GuestRoute>
  );
}
