'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store';

export default function RegisterPage() {
  const router = useRouter();
  const { register, error, clearError, isLoading } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 8) {
      setLocalError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      await register({ email, password, firstName, lastName });
      router.push('/');
    } catch {
      // Error handled by store
    }
  };

  const displayError = localError || error;

  const clearAll = () => {
    setLocalError('');
    clearError();
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
            Créer un compte
          </h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Rejoignez Marché.io et commencez à acheter
          </p>

          {displayError && (
            <div
              className="mb-4 rounded-lg px-4 py-3 text-sm"
              style={{
                backgroundColor: '#fef2f2',
                color: 'var(--color-error)',
                border: '1px solid #fecaca',
              }}
            >
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  style={{ color: 'var(--color-text)' }}
                >
                  Prénom
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    clearAll();
                  }}
                  placeholder="Yassine"
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
                  Nom
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    clearAll();
                  }}
                  placeholder="Fathi"
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
            </div>

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
                  clearAll();
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
                  clearAll();
                }}
                placeholder="Minimum 8 caractères"
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
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearAll();
                }}
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

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-brand-500)' }}
            >
              {isLoading ? 'Création...' : 'Créer mon compte'}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Déjà un compte ?{' '}
            <Link
              href="/login"
              className="font-semibold transition-colors hover:underline"
              style={{ color: 'var(--color-brand-500)' }}
            >
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
