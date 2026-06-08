'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store';
import { GuestRoute } from '../../components/GuestRoute';
import { t } from '../../lib/i18n';

function RegisterForm() {
  const router = useRouter();
  const { register, error, clearError, isLoading } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError(t.auth.passwordMismatch);
      return;
    }
    if (password.length < 8) {
      setLocalError(t.auth.minChars(8));
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
          <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {t.auth.register.title}
          </h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t.auth.register.subtitle}
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
                  {t.auth.register.firstName}
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    clearAll();
                  }}
                  placeholder={t.auth.register.firstNamePlaceholder}
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
                  {t.auth.register.lastName}
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    clearAll();
                  }}
                  placeholder={t.auth.register.lastNamePlaceholder}
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
                {t.auth.emailLabel}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearAll();
                }}
                placeholder={t.auth.emailPlaceholder}
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
                {t.auth.passwordLabel}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearAll();
                }}
                placeholder={t.auth.register.passwordPlaceholder}
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
                {t.auth.register.confirmPassword}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearAll();
                }}
                placeholder={t.auth.register.confirmPlaceholder}
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
              {isLoading ? t.auth.register.submitting : t.auth.register.submit}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t.auth.register.hasAccount}{' '}
            <Link
              href="/login"
              className="font-semibold transition-colors hover:underline"
              style={{ color: 'var(--color-brand-500)' }}
            >
              {t.auth.register.signIn}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <GuestRoute>
      <RegisterForm />
    </GuestRoute>
  );
}
