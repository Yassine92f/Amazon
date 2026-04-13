'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { api } from '../../lib/api';
import { GuestRoute } from '../../components/GuestRoute';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) return;

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
    }
    setLoading(false);
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
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-7 w-7 text-green-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <h1 className="mb-2 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                Email envoye
              </h1>
              <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Si un compte existe avec l&apos;email <strong>{email}</strong>, vous recevrez un
                lien de reinitialisation.
              </p>
              <Link
                href="/login"
                className="inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: 'var(--color-brand-500)' }}
              >
                Retour a la connexion
              </Link>
            </div>
          ) : (
            <>
              <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Mot de passe oublie
              </h1>
              <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Saisissez votre email et nous vous enverrons un lien de reinitialisation
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
                    onChange={(e) => setEmail(e.target.value)}
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

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-brand-500)' }}
                >
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </motion.button>
              </form>

              <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <Link
                  href="/login"
                  className="font-semibold transition-colors hover:underline"
                  style={{ color: 'var(--color-brand-500)' }}
                >
                  Retour a la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <GuestRoute>
      <ForgotPasswordForm />
    </GuestRoute>
  );
}
