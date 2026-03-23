'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api';

interface DashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  usersTrend: number;
  totalSellers: number;
  totalOrders: number;
  totalRevenue: number;
}

interface UserRow {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  avatar?: string;
  createdAt: string;
}

const navItems = [
  { label: 'Dashboard', href: '/admin', active: true },
  { label: 'Utilisateurs', href: '/admin/users', active: false },
  { label: 'Vendeurs', href: '/admin', active: false },
  { label: 'Commandes', href: '/admin', active: false },
  { label: 'Parametres', href: '/admin', active: false },
];

function AdminSidebar({ active }: { active: string }) {
  return (
    <aside
      className="hidden md:flex w-[260px] shrink-0 flex-col border-r bg-white py-6"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-2 px-5 pb-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-extrabold text-white">
          M
        </span>
        <span className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
          Admin Panel
        </span>
      </div>
      <nav className="flex flex-col gap-0.5 px-2">
        {navItems.map((item) => {
          const isActive = item.label === active;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-600 font-semibold'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-5 pt-6">
        <Link
          href="/profile"
          className="text-[13px] font-medium transition-colors hover:underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Mon profil
        </Link>
      </div>
    </aside>
  );
}

function StatCard({
  label,
  value,
  trend,
  color,
}: {
  label: string;
  value: string;
  trend: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 flex-col gap-3 rounded-xl p-5"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <span className="text-[13px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <span className="text-[28px] font-bold" style={{ color: 'var(--color-text)' }}>
        {value}
      </span>
      <span className="text-xs font-medium" style={{ color }}>
        {trend}
      </span>
    </motion.div>
  );
}

function DashboardContent() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard').then((r) => setStats(r.data.data)),
      api.get('/admin/users?limit=5').then((r) => setUsers(r.data.data.items)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '';

  const trendSign = (v: number) => (v > 0 ? `+${v}%` : v === 0 ? '0%' : `${v}%`);
  const trendColor = (v: number) =>
    v > 0 ? 'var(--color-success)' : v < 0 ? 'var(--color-error)' : 'var(--color-text-muted)';

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Vue d&apos;ensemble de votre plateforme
          </p>
        </div>
        <Link href="/profile" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-[13px] font-bold text-white overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {user?.firstName} {user?.lastName?.[0]}.
          </span>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-brand-500)] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Utilisateurs"
              value={stats?.totalUsers?.toLocaleString() ?? '0'}
              trend={`+${stats?.newUsersThisMonth ?? 0} ce mois (${trendSign(stats?.usersTrend ?? 0)})`}
              color={trendColor(stats?.usersTrend ?? 0)}
            />
            <StatCard
              label="Vendeurs"
              value={stats?.totalSellers?.toLocaleString() ?? '0'}
              trend={`${stats?.totalSellers ?? 0} inscrits`}
              color="var(--color-info)"
            />
            <StatCard
              label="Commandes"
              value={stats?.totalOrders?.toLocaleString() ?? '0'}
              trend={stats?.totalOrders === 0 ? 'Aucune commande' : `${stats?.totalOrders} total`}
              color="var(--color-text-muted)"
            />
            <StatCard
              label="Revenus"
              value={stats ? `${stats.totalRevenue.toLocaleString()} EUR` : '0 EUR'}
              trend={
                stats?.totalRevenue === 0
                  ? 'Aucun revenu'
                  : `${stats?.totalRevenue.toLocaleString()} EUR total`
              }
              color="var(--color-text-muted)"
            />
          </div>

          {/* Recent users table */}
          <div
            className="rounded-xl"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="flex items-center justify-between p-5">
              <span className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                Derniers utilisateurs
              </span>
              <Link
                href="/admin/users"
                className="text-[13px] font-semibold"
                style={{ color: 'var(--color-brand-500)' }}
              >
                Voir tout
              </Link>
            </div>
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr style={{ borderTop: '1px solid var(--color-border)' }}>
                  <th
                    className="px-5 py-3 font-semibold"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Nom
                  </th>
                  <th
                    className="px-5 py-3 font-semibold"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Email
                  </th>
                  <th
                    className="px-5 py-3 font-semibold"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Role
                  </th>
                  <th
                    className="px-5 py-3 font-semibold"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Statut
                  </th>
                  <th
                    className="px-5 py-3 font-semibold"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Inscription
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700 overflow-hidden">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            `${u.firstName[0]}${u.lastName[0]}`
                          )}
                        </span>
                        <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                          {u.firstName} {u.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3" style={{ color: 'var(--color-text-muted)' }}>
                      {u.email}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          u.role === 'admin'
                            ? 'bg-red-50 text-red-500'
                            : u.role === 'seller'
                              ? 'bg-blue-50 text-blue-500'
                              : 'bg-brand-50 text-brand-600'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          u.status === 'active'
                            ? 'bg-green-50 text-green-600'
                            : u.status === 'suspended'
                              ? 'bg-yellow-50 text-yellow-600'
                              : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {u.status === 'active' ? 'actif' : u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-sm"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Aucun utilisateur
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute roles={['admin']}>
      <div className="flex h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <AdminSidebar active="Dashboard" />
        <DashboardContent />
      </div>
    </ProtectedRoute>
  );
}
