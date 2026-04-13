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
  totalSellers: number;
  verifiedSellers: number;
  totalOrders: number;
  totalRevenue: number;
  revenueThisMonth: number;
}

interface UserRow {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
}

const navItems = [
  { icon: 'layout-dashboard', label: 'Dashboard', href: '/admin', active: true },
  { icon: 'users', label: 'Utilisateurs', href: '/admin/users', active: false },
  { icon: 'store', label: 'Vendeurs', href: '/admin', active: false },
  { icon: 'package', label: 'Commandes', href: '/admin', active: false },
  { icon: 'settings', label: 'Parametres', href: '/admin', active: false },
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

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((r) => setStats(r.data.data))
      .catch(() => {});
    api
      .get('/admin/users?limit=5')
      .then((r) => setUsers(r.data.data.items))
      .catch(() => {});
  }, []);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '';

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
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-[13px] font-bold text-white">
            {initials}
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {user?.firstName} {user?.lastName?.[0]}.
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Utilisateurs"
          value={stats?.totalUsers?.toLocaleString() ?? '—'}
          trend={`+${stats?.newUsersThisMonth ?? 0} ce mois`}
          color="var(--color-success)"
        />
        <StatCard
          label="Vendeurs"
          value={stats?.totalSellers?.toLocaleString() ?? '—'}
          trend={`${stats?.verifiedSellers ?? 0} verifies`}
          color="var(--color-info)"
        />
        <StatCard
          label="Commandes"
          value={stats?.totalOrders?.toLocaleString() ?? '—'}
          trend="+8.2% ce mois"
          color="var(--color-success)"
        />
        <StatCard
          label="Revenus"
          value={stats ? `${stats.totalRevenue.toLocaleString()} EUR` : '—'}
          trend={`+${stats?.revenueThisMonth?.toLocaleString() ?? 0} EUR ce mois`}
          color="var(--color-success)"
        />
      </div>

      {/* Recent users table */}
      <div
        className="rounded-xl"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
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
              <th className="px-5 py-3 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Nom
              </th>
              <th className="px-5 py-3 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Email
              </th>
              <th className="px-5 py-3 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Role
              </th>
              <th className="px-5 py-3 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Statut
              </th>
              <th className="px-5 py-3 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Inscription
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                      {u.firstName[0]}
                      {u.lastName[0]}
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
          </tbody>
        </table>
      </div>
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
