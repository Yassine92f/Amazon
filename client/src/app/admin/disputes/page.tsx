'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert } from 'lucide-react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { t, formatLongDate } from '../../../lib/i18n';
import {
  listAllDisputes,
  resolveDispute,
  DisputeStatus,
  type Dispute,
} from '../../../lib/disputes';

const navItems = [
  { label: t.admin.navDashboard, href: '/admin' },
  { label: t.admin.navUsers, href: '/admin/users' },
  { label: t.admin.navProducts, href: '/admin/products' },
  { label: t.admin.navCategories, href: '/admin/categories' },
  { label: t.adminDisputes.title, href: '/admin/disputes', active: true },
  { label: t.admin.navCoupons, href: '/admin/coupons' },
];

const FILTERS: { value: DisputeStatus | 'all'; label: string }[] = [
  { value: 'all', label: t.adminDisputes.filterAll },
  { value: DisputeStatus.OPEN, label: t.disputeStatus.open },
  { value: DisputeStatus.UNDER_REVIEW, label: t.disputeStatus.under_review },
  { value: DisputeStatus.RESOLVED, label: t.disputeStatus.resolved },
  { value: DisputeStatus.REJECTED, label: t.disputeStatus.rejected },
];

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700',
  under_review: 'bg-blue-50 text-blue-700',
  resolved: 'bg-green-50 text-green-700',
  rejected: 'bg-gray-100 text-gray-500',
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DisputeStatus | 'all'>('all');
  const [active, setActive] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDisputes = useCallback(() => {
    setLoading(true);
    listAllDisputes({ limit: 100, status: filter === 'all' ? undefined : filter })
      .then((res) => setDisputes(res.items))
      .catch(() => showToast(t.adminDisputes.loadError, 'error'))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const openDetail = (d: Dispute) => {
    setActive(d);
    setResolution(d.resolution ?? '');
  };

  const act = async (
    status: DisputeStatus.UNDER_REVIEW | DisputeStatus.RESOLVED | DisputeStatus.REJECTED,
  ) => {
    if (!active) return;
    setSaving(true);
    try {
      await resolveDispute(active._id, { status, resolution: resolution.trim() || undefined });
      showToast(t.adminDisputes.updated, 'success');
      setActive(null);
      fetchDisputes();
    } catch {
      showToast(t.adminDisputes.actionError, 'error');
    }
    setSaving(false);
  };

  return (
    <ProtectedRoute roles={['admin']}>
      <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <aside
          className="hidden w-[260px] shrink-0 flex-col border-r bg-white py-6 md:flex"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2 px-5 pb-6">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-extrabold text-white">
              A
            </span>
            <span className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              {t.admin.panel}
            </span>
          </div>
          <nav className="flex flex-col gap-0.5 px-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-brand-50 font-semibold text-brand-600'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col gap-5 overflow-auto p-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {t.adminDisputes.title}
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {t.adminDisputes.subtitle} · {t.adminDisputes.count(String(disputes.length))}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  filter === f.value
                    ? 'bg-brand-500 text-white'
                    : 'border border-border bg-white text-text hover:border-brand-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="rounded-xl border border-border bg-white p-12 text-center text-sm text-muted">
              {t.adminDisputes.loading}
            </div>
          ) : disputes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
                <ShieldAlert className="h-7 w-7 text-brand-300" aria-hidden />
              </div>
              <p className="font-bold text-brand-900">{t.adminDisputes.empty}</p>
              <p className="text-sm text-muted">{t.adminDisputes.emptyDesc}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-semibold">{t.adminDisputes.colOrder}</th>
                    <th className="px-5 py-3 font-semibold">{t.adminDisputes.colCustomer}</th>
                    <th className="px-5 py-3 font-semibold">{t.adminDisputes.colReason}</th>
                    <th className="px-5 py-3 font-semibold">{t.adminDisputes.colStatus}</th>
                    <th className="px-5 py-3 font-semibold">{t.adminDisputes.colDate}</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      {t.adminDisputes.colActions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {disputes.map((d) => (
                    <tr key={d._id}>
                      <td className="px-5 py-3 font-bold text-brand-900">{d.orderNumber ?? '—'}</td>
                      <td className="px-5 py-3 text-muted">{d.userEmail ?? '—'}</td>
                      <td className="px-5 py-3 text-text">
                        {t.disputeReason[d.reason] ?? d.reason}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            STATUS_STYLE[d.status] ?? 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {t.disputeStatus[d.status] ?? d.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted">{formatLongDate(d.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openDetail(d)}
                          className="text-xs font-semibold text-brand-600 hover:underline"
                        >
                          {t.adminDisputes.view}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail / resolve modal */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6"
            >
              <h2 className="mb-4 text-lg font-bold text-brand-900">
                {t.adminDisputes.detailTitle} · {active.orderNumber ?? ''}
              </h2>
              <dl className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="w-28 font-semibold text-muted">{t.adminDisputes.customer}</dt>
                  <dd className="text-text">{active.userEmail ?? '—'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 font-semibold text-muted">{t.adminDisputes.reason}</dt>
                  <dd className="text-text">{t.disputeReason[active.reason] ?? active.reason}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 font-semibold text-muted">
                    {t.adminDisputes.description}
                  </dt>
                  <dd className="text-text">{active.description}</dd>
                </div>
              </dl>

              <label className="mt-4 block text-sm font-semibold text-text">
                {t.adminDisputes.resolutionLabel}
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder={t.adminDisputes.resolutionPlaceholder}
                  rows={3}
                  className="mt-1 w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
              </label>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text"
                >
                  {t.adminDisputes.close}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => act(DisputeStatus.UNDER_REVIEW)}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 disabled:opacity-60"
                >
                  {t.adminDisputes.markUnderReview}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => act(DisputeStatus.REJECTED)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text disabled:opacity-60"
                >
                  {t.adminDisputes.reject}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => act(DisputeStatus.RESOLVED)}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  {t.adminDisputes.resolve}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </ProtectedRoute>
  );
}
