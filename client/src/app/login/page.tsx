'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store';
import { GuestRoute } from '../../components/GuestRoute';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { login, error, clearError, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push(redirect);
    } catch {
      // Error handled by store
    }
  };

  return (
    <div
      className="rounded-2xl p-8"
      style={{
        backgroundColor: 'var(--color-surface)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        Connexion
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Connectez-vous a votre compte Marche.io
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
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError();
            }}
            placeholder="vous@exemple.com"
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
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Mot de passe
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium transition-colors hover:underline"
              style={{ color: 'var(--color-brand-500)' }}
            >
              Mot de passe oublie ?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError();
            }}
            placeholder="Votre mot de passe"
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

        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-brand-500)' }}
        >
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Pas encore de compte ?{' '}
        <Link
          href="/register"
          className="font-semibold transition-colors hover:underline"
          style={{ color: 'var(--color-brand-500)' }}
        >
          Creer un compte
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
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

          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-brand-500)] border-t-transparent" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </motion.div>
      </div>
    </GuestRoute>
  );
}
