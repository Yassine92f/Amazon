'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store';

export default function LoginPage() {
  const router = useRouter();
  const { login, error, clearError, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/');
    } catch {
      // Error handled by store
    }
  };

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
              M
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              Marché.io
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
          <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Connexion
          </h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Connectez-vous à votre compte Marché.io
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
              <label
                className="mb-1 block text-sm font-medium"
                style={{ color: 'var(--color-text)' }}
              >
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
              <label
                className="mb-1 block text-sm font-medium"
                style={{ color: 'var(--color-text)' }}
              >
                Mot de passe
              </label>
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
              Créer un compte
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
