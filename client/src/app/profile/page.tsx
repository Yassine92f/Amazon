'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api';

type Tab = 'profile' | 'addresses' | 'preferences';

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface Preferences {
  language: string;
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    priceDrops: boolean;
  };
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>('profile');
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '';

  const inputStyle = {
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  };

  // ── Profile tab state ──────────────────────────────────
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [profilePassword, setProfilePassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // ── Address tab state ──────────────────────────────────
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrForm, setAddrForm] = useState(false);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrCountry, setAddrCountry] = useState('France');
  const [addrDefault, setAddrDefault] = useState(false);

  // ── Preferences tab state ──────────────────────────────
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(false);

  const fetchAddresses = useCallback(async () => {
    setAddrLoading(true);
    try {
      const { data } = await api.get('/users/addresses');
      setAddresses(data.data);
    } catch {
      /* ignore */
    }
    setAddrLoading(false);
  }, []);

  const fetchPreferences = useCallback(async () => {
    setPrefsLoading(true);
    try {
      const { data } = await api.get('/users/preferences');
      setPrefs(data.data);
    } catch {
      /* ignore */
    }
    setPrefsLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'addresses') fetchAddresses();
    if (tab === 'preferences') fetchPreferences();
  }, [tab, fetchAddresses, fetchPreferences]);

  // ── Handlers ───────────────────────────────────────────

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image trop volumineuse (max 2 Mo)', 'error');
      return;
    }
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const { data } = await api.put('/users/profile', {
          avatar: reader.result,
          currentPassword: profilePassword || undefined,
        });
        setUser(data.data);
        showToast('Photo de profil mise a jour', 'success');
      } catch {
        showToast('Erreur lors du telechargement', 'error');
      }
      setAvatarUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilePassword) {
      showToast('Mot de passe requis pour confirmer', 'error');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      showToast('Prenom et nom requis', 'error');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', {
        firstName,
        lastName,
        phone,
        currentPassword: profilePassword,
      });
      setUser(data.data);
      setProfilePassword('');
      showToast('Profil mis a jour', 'success');
    } catch (err: unknown) {
      showToast(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Erreur',
        'error',
      );
    }
    setSaving(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Tous les champs requis', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Minimum 8 caracteres', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    if (currentPassword === newPassword) {
      showToast('Le nouveau doit etre different', 'error');
      return;
    }
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      showToast('Mot de passe modifie', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: unknown) {
      showToast(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Mot de passe incorrect',
        'error',
      );
    }
  };

  const resetAddrForm = () => {
    setAddrForm(false);
    setEditingAddr(null);
    setAddrLabel('');
    setAddrStreet('');
    setAddrCity('');
    setAddrPostal('');
    setAddrCountry('France');
    setAddrDefault(false);
  };

  const openEditAddr = (a: Address) => {
    setEditingAddr(a);
    setAddrForm(true);
    setAddrLabel(a.label);
    setAddrStreet(a.street);
    setAddrCity(a.city);
    setAddrPostal(a.postalCode);
    setAddrCountry(a.country);
    setAddrDefault(a.isDefault);
  };

  const handleAddrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrLabel || !addrStreet || !addrCity || !addrPostal || !addrCountry) {
      showToast('Tous les champs requis', 'error');
      return;
    }
    try {
      const body = {
        label: addrLabel,
        street: addrStreet,
        city: addrCity,
        postalCode: addrPostal,
        country: addrCountry,
        isDefault: addrDefault,
      };
      if (editingAddr) {
        const { data } = await api.put(`/users/addresses/${editingAddr.id}`, body);
        setAddresses(data.data);
        showToast('Adresse modifiee', 'success');
      } else {
        const { data } = await api.post('/users/addresses', body);
        setAddresses(data.data);
        showToast('Adresse ajoutee', 'success');
      }
      resetAddrForm();
    } catch {
      showToast('Erreur', 'error');
    }
  };

  const handleDeleteAddr = async (id: string) => {
    try {
      const { data } = await api.delete(`/users/addresses/${id}`);
      setAddresses(data.data);
      showToast('Adresse supprimee', 'success');
    } catch {
      showToast('Erreur', 'error');
    }
  };

  const handlePrefChange = async (key: string, value: unknown) => {
    if (!prefs) return;
    try {
      const payload = key.startsWith('notifications.')
        ? { notifications: { [key.split('.')[1]]: value } }
        : { [key]: value };
      const { data } = await api.put('/users/preferences', payload);
      setPrefs(data.data);
    } catch {
      showToast('Erreur', 'error');
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profil' },
    { key: 'addresses', label: 'Adresses' },
    { key: 'preferences', label: 'Preferences' },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        {/* Header */}
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
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="text-[13px] font-medium"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Admin
              </Link>
            )}
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-[13px] font-bold text-white overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </span>
          </div>
        </header>

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
            <div className="relative group">
              <span
                onClick={handleAvatarClick}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-[28px] font-bold text-white cursor-pointer overflow-hidden transition-opacity group-hover:opacity-80"
              >
                {avatarUploading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : user?.avatar ? (
                  <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </span>
              <div
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-brand-500 text-white shadow-md transition-transform hover:scale-110"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                </svg>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {user?.email}
            </span>
            <span className="rounded-full bg-brand-50 px-3.5 py-1 text-xs font-semibold text-brand-600 capitalize">
              {user?.role === 'admin'
                ? 'Administrateur'
                : user?.role === 'seller'
                  ? 'Vendeur'
                  : 'Membre'}
            </span>
            <div className="my-1 h-px w-full" style={{ backgroundColor: 'var(--color-border)' }} />
            <div className="flex w-full justify-around">
              {[
                { n: 0, l: 'Commandes' },
                { n: 0, l: 'Avis' },
                { n: addresses.length || user?.addresses?.length || 0, l: 'Adresses' },
              ].map((s) => (
                <div key={s.l} className="flex flex-col items-center gap-1">
                  <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {s.n}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {s.l}
                  </span>
                </div>
              ))}
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

          {/* Main panel */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-1 flex-col rounded-xl"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`px-6 py-3.5 text-[13px] font-semibold transition-colors ${tab === t.key ? 'border-b-2 border-brand-500 text-brand-600' : ''}`}
                  style={tab !== t.key ? { color: 'var(--color-text-muted)' } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* ── Profile tab ── */}
              {tab === 'profile' && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                      Informations personnelles
                    </h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      Mot de passe requis pour confirmer.
                    </p>
                  </div>
                  <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-[13px] font-medium"
                          style={{ color: 'var(--color-text)' }}
                        >
                          Prenom
                        </label>
                        <input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="h-10 rounded-lg px-3 text-sm outline-none"
                          style={inputStyle}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-[13px] font-medium"
                          style={{ color: 'var(--color-text)' }}
                        >
                          Nom
                        </label>
                        <input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="h-10 rounded-lg px-3 text-sm outline-none"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[13px] font-medium"
                        style={{ color: 'var(--color-text)' }}
                      >
                        Email
                      </label>
                      <input
                        value={user?.email ?? ''}
                        disabled
                        className="h-10 rounded-lg px-3 text-sm opacity-60"
                        style={inputStyle}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[13px] font-medium"
                        style={{ color: 'var(--color-text)' }}
                      >
                        Telephone
                      </label>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+33 6 12 34 56 78"
                        className="h-10 rounded-lg px-3 text-sm outline-none"
                        style={inputStyle}
                      />
                    </div>
                    <div
                      className="h-px w-full"
                      style={{ backgroundColor: 'var(--color-border)' }}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[13px] font-medium"
                        style={{ color: 'var(--color-text)' }}
                      >
                        Mot de passe actuel <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="password"
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                        placeholder="Requis pour confirmer"
                        required
                        className="h-10 rounded-lg px-3 text-sm outline-none"
                        style={inputStyle}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setFirstName(user?.firstName ?? '');
                          setLastName(user?.lastName ?? '');
                          setPhone(user?.phone ?? '');
                          setProfilePassword('');
                        }}
                        className="rounded-lg px-5 py-2.5 text-[13px] font-medium"
                        style={{
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                      >
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </div>
                  </form>

                  <div className="h-px w-full" style={{ backgroundColor: 'var(--color-border)' }} />
                  <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                    Changer le mot de passe
                  </h3>
                  <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[13px] font-medium"
                        style={{ color: 'var(--color-text)' }}
                      >
                        Mot de passe actuel
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="h-10 rounded-lg px-3 text-sm outline-none"
                        style={inputStyle}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-[13px] font-medium"
                          style={{ color: 'var(--color-text)' }}
                        >
                          Nouveau mot de passe
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 8 caracteres"
                          required
                          className="h-10 rounded-lg px-3 text-sm outline-none"
                          style={inputStyle}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-[13px] font-medium"
                          style={{ color: 'var(--color-text)' }}
                        >
                          Confirmer
                        </label>
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Retapez"
                          required
                          className="h-10 rounded-lg px-3 text-sm outline-none"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    {newPassword && (
                      <div className="flex items-center gap-3 text-[12px]">
                        <span
                          style={{
                            color:
                              newPassword.length >= 8
                                ? 'var(--color-success)'
                                : 'var(--color-text-muted)',
                          }}
                        >
                          {newPassword.length >= 8 ? '✓' : '○'} 8+ caracteres
                        </span>
                        <span
                          style={{
                            color:
                              newPassword === confirmNewPassword && confirmNewPassword
                                ? 'var(--color-success)'
                                : 'var(--color-text-muted)',
                          }}
                        >
                          {newPassword === confirmNewPassword && confirmNewPassword ? '✓' : '○'}{' '}
                          Identiques
                        </span>
                      </div>
                    )}
                    <button
                      type="submit"
                      className="w-fit rounded-lg bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-600"
                    >
                      Modifier le mot de passe
                    </button>
                  </form>
                </div>
              )}

              {/* ── Addresses tab ── */}
              {tab === 'addresses' && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                        Mes adresses
                      </h2>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Gerez vos adresses de livraison.
                      </p>
                    </div>
                    {!addrForm && (
                      <button
                        type="button"
                        onClick={() => {
                          resetAddrForm();
                          setAddrForm(true);
                        }}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-600"
                      >
                        + Ajouter
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {addrForm && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddrSubmit}
                        className="flex flex-col gap-3 rounded-lg p-4 overflow-hidden"
                        style={{
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-bg)',
                        }}
                      >
                        <span
                          className="text-[13px] font-semibold"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {editingAddr ? "Modifier l'adresse" : 'Nouvelle adresse'}
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            value={addrLabel}
                            onChange={(e) => setAddrLabel(e.target.value)}
                            placeholder="Label (ex: Maison)"
                            required
                            className="h-9 rounded-lg px-3 text-sm outline-none"
                            style={inputStyle}
                          />
                          <input
                            value={addrCountry}
                            onChange={(e) => setAddrCountry(e.target.value)}
                            placeholder="Pays"
                            required
                            className="h-9 rounded-lg px-3 text-sm outline-none"
                            style={inputStyle}
                          />
                        </div>
                        <input
                          value={addrStreet}
                          onChange={(e) => setAddrStreet(e.target.value)}
                          placeholder="Rue"
                          required
                          className="h-9 rounded-lg px-3 text-sm outline-none"
                          style={inputStyle}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            value={addrCity}
                            onChange={(e) => setAddrCity(e.target.value)}
                            placeholder="Ville"
                            required
                            className="h-9 rounded-lg px-3 text-sm outline-none"
                            style={inputStyle}
                          />
                          <input
                            value={addrPostal}
                            onChange={(e) => setAddrPostal(e.target.value)}
                            placeholder="Code postal"
                            required
                            className="h-9 rounded-lg px-3 text-sm outline-none"
                            style={inputStyle}
                          />
                        </div>
                        <label
                          className="flex items-center gap-2 text-[13px]"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <input
                            type="checkbox"
                            checked={addrDefault}
                            onChange={(e) => setAddrDefault(e.target.checked)}
                            className="rounded"
                          />{' '}
                          Adresse par defaut
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="rounded-lg bg-brand-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-600"
                          >
                            {editingAddr ? 'Enregistrer' : 'Ajouter'}
                          </button>
                          <button
                            type="button"
                            onClick={resetAddrForm}
                            className="rounded-lg px-4 py-2 text-[13px] font-medium"
                            style={{
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-text)',
                            }}
                          >
                            Annuler
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {addrLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-[var(--color-brand-500)] border-t-transparent" />
                    </div>
                  ) : addresses.length === 0 && !addrForm ? (
                    <div
                      className="rounded-lg py-12 text-center"
                      style={{ border: '1px dashed var(--color-border)' }}
                    >
                      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Aucune adresse enregistree.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {addresses.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-start justify-between rounded-lg p-4"
                          style={{ border: '1px solid var(--color-border)' }}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[13px] font-semibold"
                                style={{ color: 'var(--color-text)' }}
                              >
                                {a.label}
                              </span>
                              {a.isDefault && (
                                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                                  Par defaut
                                </span>
                              )}
                            </div>
                            <span
                              className="text-[13px]"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {a.street}
                            </span>
                            <span
                              className="text-[13px]"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {a.postalCode} {a.city}, {a.country}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEditAddr(a)}
                              className="text-[12px] font-medium hover:underline"
                              style={{ color: 'var(--color-brand-500)' }}
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddr(a.id)}
                              className="text-[12px] font-medium hover:underline"
                              style={{ color: 'var(--color-error)' }}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Preferences tab ── */}
              {tab === 'preferences' && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                      Preferences
                    </h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      Personnalisez votre experience.
                    </p>
                  </div>

                  {prefsLoading || !prefs ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-[var(--color-brand-500)] border-t-transparent" />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-4">
                        <h3
                          className="text-[13px] font-semibold"
                          style={{ color: 'var(--color-text)' }}
                        >
                          Langue et devise
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label
                              className="text-[12px] font-medium"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              Langue
                            </label>
                            <select
                              value={prefs.language}
                              onChange={(e) => handlePrefChange('language', e.target.value)}
                              className="h-10 rounded-lg px-3 text-sm"
                              style={inputStyle}
                            >
                              <option value="fr">Francais</option>
                              <option value="en">English</option>
                              <option value="es">Espanol</option>
                              <option value="de">Deutsch</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label
                              className="text-[12px] font-medium"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              Devise
                            </label>
                            <select
                              value={prefs.currency}
                              onChange={(e) => handlePrefChange('currency', e.target.value)}
                              className="h-10 rounded-lg px-3 text-sm"
                              style={inputStyle}
                            >
                              <option value="EUR">EUR (€)</option>
                              <option value="USD">USD ($)</option>
                              <option value="GBP">GBP (£)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div
                        className="h-px w-full"
                        style={{ backgroundColor: 'var(--color-border)' }}
                      />

                      <div className="flex flex-col gap-4">
                        <h3
                          className="text-[13px] font-semibold"
                          style={{ color: 'var(--color-text)' }}
                        >
                          Notifications
                        </h3>
                        {(
                          [
                            {
                              key: 'email',
                              label: 'Notifications email',
                              desc: 'Recevoir les notifications par email',
                            },
                            {
                              key: 'push',
                              label: 'Notifications push',
                              desc: 'Recevoir les notifications push',
                            },
                            {
                              key: 'orderUpdates',
                              label: 'Mises a jour commandes',
                              desc: 'Notifications sur le suivi de vos commandes',
                            },
                            {
                              key: 'promotions',
                              label: 'Promotions',
                              desc: 'Recevoir les offres et promotions',
                            },
                            {
                              key: 'priceDrops',
                              label: 'Baisse de prix',
                              desc: 'Alerte quand un produit en favoris baisse',
                            },
                          ] as const
                        ).map((n) => (
                          <div
                            key={n.key}
                            className="flex items-center justify-between rounded-lg p-3"
                            style={{ border: '1px solid var(--color-border)' }}
                          >
                            <div>
                              <span
                                className="text-[13px] font-medium"
                                style={{ color: 'var(--color-text)' }}
                              >
                                {n.label}
                              </span>
                              <p
                                className="text-[12px]"
                                style={{ color: 'var(--color-text-muted)' }}
                              >
                                {n.desc}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handlePrefChange(
                                  `notifications.${n.key}`,
                                  !prefs.notifications[n.key],
                                )
                              }
                              className={`relative inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-full transition-colors ${prefs.notifications[n.key] ? 'bg-brand-500' : 'bg-gray-200'}`}
                            >
                              <span
                                className={`inline-block h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-transform ${prefs.notifications[n.key] ? 'translate-x-[20px]' : 'translate-x-[3px]'}`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-6 right-6 z-50 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
