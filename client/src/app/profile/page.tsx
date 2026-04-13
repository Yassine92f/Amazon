'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '';

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg('');
    try {
      const { data } = await api.put('/users/profile', { firstName, lastName, phone });
      setUser(data.data);
      setProfileMsg('Profil mis a jour');
    } catch {
      setProfileMsg('Erreur lors de la mise a jour');
    }
    setSaving(false);
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    if (newPassword.length < 8) {
      setPwMsg('Minimum 8 caracteres');
      return;
    }
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setPwMsg('Mot de passe modifie');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      setPwMsg('Mot de passe actuel incorrect');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        {/* Simple header */}
        <header
          className="flex items-center justify-between border-b px-8 py-4 bg-white"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-extrabold text-white">
              M
            </span>
            <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Marche.io
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[13px] font-medium"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Accueil
            </Link>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-[13px] font-bold text-white">
              {initials}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto flex max-w-[1100px] items-start gap-8 p-8">
          {/* Side panel */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex w-[320px] shrink-0 flex-col items-center gap-5 rounded-xl p-6"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-[28px] font-bold text-white">
              {initials}
            </span>
            <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {user?.email}
            </span>
            <span className="rounded-full bg-brand-50 px-3.5 py-1 text-xs font-semibold text-brand-600">
              Membre
            </span>
            <div className="my-1 h-px w-full" style={{ backgroundColor: 'var(--color-border)' }} />
            <div className="flex w-full justify-around">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                  0
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Commandes
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                  0
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Avis
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {user?.addresses?.length ?? 0}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Adresses
                </span>
              </div>
            </div>
            <div className="my-1 h-px w-full" style={{ backgroundColor: 'var(--color-border)' }} />
            <div className="flex w-full justify-between">
              <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
                Inscrit le
              </span>
              <span className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push('/');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-medium transition-colors hover:bg-red-50"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-error)' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
              Se deconnecter
            </button>
          </motion.div>

          {/* Main form panel */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-1 flex-col gap-6 rounded-xl p-6"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Informations personnelles
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Mettez a jour vos informations de profil
            </p>

            {profileMsg && (
              <div
                className={`rounded-lg px-4 py-2.5 text-sm ${profileMsg.includes('Erreur') ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}
              >
                {profileMsg}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                    Prenom
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-10 rounded-lg px-3 text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                    Nom
                  </label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-10 rounded-lg px-3 text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                  Email
                </label>
                <input
                  value={user?.email ?? ''}
                  disabled
                  className="h-10 rounded-lg px-3 text-sm opacity-60"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                  Telephone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="h-10 rounded-lg px-3 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFirstName(user?.firstName ?? '');
                    setLastName(user?.lastName ?? '');
                    setPhone(user?.phone ?? '');
                  }}
                  className="rounded-lg px-5 py-2.5 text-[13px] font-medium"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>

            <div className="h-px w-full" style={{ backgroundColor: 'var(--color-border)' }} />

            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
              Changer le mot de passe
            </h3>
            {pwMsg && (
              <div
                className={`rounded-lg px-4 py-2.5 text-sm ${pwMsg.includes('incorrect') || pwMsg.includes('caracteres') ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}
              >
                {pwMsg}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-10 rounded-lg px-3 text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 rounded-lg px-3 text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-fit self-start rounded-lg bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-600"
              >
                Modifier le mot de passe
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
