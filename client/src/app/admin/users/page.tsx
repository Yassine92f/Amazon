'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { api } from '../../../lib/api';
import Link from 'next/link';

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

interface PaginatedResult {
  items: UserRow[];
  total: number;
  page: number;
  totalPages: number;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

interface ConfirmModal {
  title: string;
  message: string;
  onConfirm: () => void;
  variant: 'danger' | 'warning' | 'info';
}

const navItems = [
  { label: 'Dashboard', href: '/admin', active: false },
  { label: 'Utilisateurs', href: '/admin/users', active: true },
  { label: 'Vendeurs', href: '/admin', active: false },
  { label: 'Commandes', href: '/admin', active: false },
  { label: 'Parametres', href: '/admin', active: false },
];

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedResult | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);
  const [roleModal, setRoleModal] = useState<{ userId: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(true);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (query) params.set('query', query);
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);
    try {
      const res = await api.get(`/admin/users?${params}`);
      setData(res.data.data);
    } catch {
      showToast('Erreur lors du chargement des utilisateurs', 'error');
    }
    setLoading(false);
  }, [page, query, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = (id: string, status: string, userName: string) => {
    const action = status === 'suspended' ? 'suspendre' : 'activer';
    setConfirmModal({
      title: `${status === 'suspended' ? 'Suspendre' : 'Activer'} l'utilisateur`,
      message: `Etes-vous sur de vouloir ${action} ${userName} ?`,
      variant: status === 'suspended' ? 'warning' : 'info',
      onConfirm: async () => {
        try {
          await api.put(`/admin/users/${id}/status`, { status });
          showToast(`Utilisateur ${status === 'suspended' ? 'suspendu' : 'active'}`, 'success');
          fetchUsers();
        } catch {
          showToast('Erreur lors de la modification du statut', 'error');
        }
        setConfirmModal(null);
      },
    });
  };

  const handleDelete = (id: string, userName: string) => {
    setConfirmModal({
      title: "Supprimer l'utilisateur",
      message: `Etes-vous sur de vouloir supprimer ${userName} ? Cette action est irreversible.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${id}`);
          showToast('Utilisateur supprime', 'success');
          fetchUsers();
        } catch {
          showToast("Erreur lors de la suppression de l'utilisateur", 'error');
        }
        setConfirmModal(null);
      },
    });
  };

  const handleRoleChange = async () => {
    if (!roleModal || !newRole) return;
    try {
      await api.put(`/admin/users/${roleModal.userId}/role`, { role: newRole });
      showToast('Role modifie avec succes', 'success');
      fetchUsers();
    } catch {
      showToast('Erreur lors de la modification du role', 'error');
    }
    setRoleModal(null);
    setNewRole('');
  };

  const getPaginationRange = () => {
    if (!data) return [];
    const total = data.totalPages;
    const current = page;
    const delta = 2;
    const range: (number | '...')[] = [];

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== '...') {
        range.push('...');
      }
    }
    return range;
  };

  return (
    <ProtectedRoute roles={['admin']}>
      <div className="flex h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        {/* Sidebar */}
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
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-brand-50 text-brand-600 font-semibold'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex flex-1 flex-col gap-5 overflow-auto p-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              Utilisateurs
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {data?.total ?? 0} utilisateurs inscrits
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div
              className="flex flex-1 items-center gap-2 rounded-lg px-3 h-10"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-muted"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Rechercher par nom ou email..."
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--color-text-muted)]"
                style={{ color: 'var(--color-text)' }}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg px-3 text-[13px]"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <option value="">Role</option>
              <option value="user">User</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg px-3 text-[13px]"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <option value="">Statut</option>
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
              <option value="pending">En attente</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-brand-500)] border-t-transparent" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl overflow-hidden"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <th
                      className="px-5 py-3 font-semibold"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Utilisateur
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
                    <th
                      className="px-5 py-3 font-semibold"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
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
                        <button
                          type="button"
                          onClick={() => {
                            if (u.role !== 'admin') {
                              setRoleModal({ userId: u._id, currentRole: u.role });
                              setNewRole(u.role);
                            }
                          }}
                          disabled={u.role === 'admin'}
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-opacity ${
                            u.role === 'admin'
                              ? 'bg-red-50 text-red-500 cursor-default'
                              : u.role === 'seller'
                                ? 'bg-blue-50 text-blue-500 hover:opacity-70 cursor-pointer'
                                : 'bg-brand-50 text-brand-600 hover:opacity-70 cursor-pointer'
                          }`}
                          title={u.role === 'admin' ? '' : 'Cliquer pour changer le role'}
                        >
                          {u.role}
                        </button>
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
                          {u.status === 'active'
                            ? 'actif'
                            : u.status === 'suspended'
                              ? 'suspendu'
                              : u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3" style={{ color: 'var(--color-text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {u.role !== 'admin' && (
                            <>
                              {u.status === 'active' ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(
                                      u._id,
                                      'suspended',
                                      `${u.firstName} ${u.lastName}`,
                                    )
                                  }
                                  title="Suspendre"
                                  className="text-yellow-500 hover:text-yellow-600 transition-colors"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-4 w-4"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M5.965 4.904l9.131 9.131a6.5 6.5 0 00-9.131-9.131zm8.07 10.192L4.904 5.965a6.5 6.5 0 009.131 9.131zM4.343 4.343a8 8 0 1111.314 11.314A8 8 0 014.343 4.343z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(
                                      u._id,
                                      'active',
                                      `${u.firstName} ${u.lastName}`,
                                    )
                                  }
                                  title="Activer"
                                  className="text-green-500 hover:text-green-600 transition-colors"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-4 w-4"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDelete(u._id, `${u.firstName} ${u.lastName}`)}
                                title="Supprimer"
                                className="text-red-400 hover:text-red-500 transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="h-4 w-4"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data?.items.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-sm"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Aucun utilisateur trouve
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
                    Affichage {(page - 1) * 10 + 1}-{Math.min(page * 10, data.total)} sur{' '}
                    {data.total}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                      style={{
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      Precedent
                    </button>
                    {getPaginationRange().map((p, i) =>
                      p === '...' ? (
                        <span
                          key={`ellipsis-${i}`}
                          className="px-2 py-1.5 text-xs"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p as number)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${p === page ? 'bg-brand-500 text-white' : ''}`}
                          style={p !== page ? { color: 'var(--color-text-muted)' } : {}}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      disabled={page === data.totalPages}
                      onClick={() => setPage(page + 1)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                      style={{
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {confirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => setConfirmModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md rounded-xl p-6"
                style={{ backgroundColor: 'var(--color-surface)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-2 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  {confirmModal.title}
                </h3>
                <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {confirmModal.message}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmModal(null)}
                    className="rounded-lg px-4 py-2 text-[13px] font-medium"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={confirmModal.onConfirm}
                    className={`rounded-lg px-4 py-2 text-[13px] font-semibold text-white ${
                      confirmModal.variant === 'danger'
                        ? 'bg-red-500 hover:bg-red-600'
                        : confirmModal.variant === 'warning'
                          ? 'bg-yellow-500 hover:bg-yellow-600'
                          : 'bg-brand-500 hover:bg-brand-600'
                    }`}
                  >
                    Confirmer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Role Change Modal */}
        <AnimatePresence>
          {roleModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => {
                setRoleModal(null);
                setNewRole('');
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm rounded-xl p-6"
                style={{ backgroundColor: 'var(--color-surface)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-4 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  Changer le role
                </h3>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="mb-6 h-10 w-full rounded-lg px-3 text-sm"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  <option value="user">User</option>
                  <option value="seller">Seller</option>
                </select>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRoleModal(null);
                      setNewRole('');
                    }}
                    className="rounded-lg px-4 py-2 text-[13px] font-medium"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleRoleChange}
                    disabled={newRole === roleModal.currentRole}
                    className="rounded-lg bg-brand-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-600 disabled:opacity-40"
                  >
                    Enregistrer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-6 right-6 z-50 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-lg ${
                toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
