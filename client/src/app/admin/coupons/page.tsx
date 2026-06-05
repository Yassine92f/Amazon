'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Ticket } from 'lucide-react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { t, formatPrice, formatLongDate } from '../../../lib/i18n';
import {
  listAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type AdminCouponDto,
} from '../../../lib/catalog';

const navItems = [
  { label: t.admin.navDashboard, href: '/admin' },
  { label: t.admin.navUsers, href: '/admin/users' },
  { label: t.admin.navProducts, href: '/admin/products' },
  { label: t.admin.navCoupons, href: '/admin/coupons', active: true },
  { label: t.admin.navSettings, href: '/admin' },
];

const inputCls =
  'h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-brand-500';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCouponDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState<AdminCouponDto | null>(null);

  // Create-form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('');
  const [saving, setSaving] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCoupons = useCallback(() => {
    setLoading(true);
    listAdminCoupons({ limit: 100 })
      .then((res) => {
        setCoupons(res.items);
        setTotal(res.total);
      })
      .catch(() => showToast(t.adminCoupons.loadError, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const resetForm = () => {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderAmount('');
    setMaxDiscount('');
    setExpiresAt('');
    setUsageLimit('');
    setPerUserLimit('');
    setShowForm(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(discountValue);
    if (!code.trim() || !Number.isFinite(value) || value <= 0) {
      showToast(t.adminCoupons.formError, 'error');
      return;
    }
    setSaving(true);
    try {
      await createCoupon({
        code: code.trim(),
        discountType,
        discountValue: value,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        maxDiscount: discountType === 'percentage' && maxDiscount ? Number(maxDiscount) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        perUserLimit: perUserLimit ? Number(perUserLimit) : undefined,
      });
      showToast(t.adminCoupons.created, 'success');
      resetForm();
      fetchCoupons();
    } catch (err) {
      showToast(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          t.adminCoupons.actionError,
        'error',
      );
    }
    setSaving(false);
  };

  const toggleActive = async (c: AdminCouponDto) => {
    try {
      await updateCoupon(c._id, { isActive: !c.isActive });
      showToast(t.adminCoupons.updated, 'success');
      fetchCoupons();
    } catch {
      showToast(t.adminCoupons.actionError, 'error');
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteCoupon(toDelete._id);
      setToDelete(null);
      showToast(t.adminCoupons.deleted, 'success');
      fetchCoupons();
    } catch {
      showToast(t.adminCoupons.actionError, 'error');
      setToDelete(null);
    }
  };

  const discountLabel = (c: AdminCouponDto) =>
    c.discountType === 'percentage' ? `${c.discountValue} %` : formatPrice(c.discountValue);

  return (
    <ProtectedRoute roles={['admin']}>
      <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        {/* Sidebar */}
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

        {/* Main */}
        <div className="flex flex-1 flex-col gap-5 overflow-auto p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {t.adminCoupons.title}
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {t.adminCoupons.subtitle} · {t.adminCoupons.count(String(total))}
              </p>
            </div>
            {!showForm && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t.adminCoupons.create}
              </button>
            )}
          </div>

          {/* Create form */}
          <AnimatePresence>
            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreate}
                className="overflow-hidden rounded-2xl border border-border bg-white p-5"
              >
                <h2 className="mb-4 text-base font-bold text-brand-900">
                  {t.adminCoupons.formTitle}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
                    {t.adminCoupons.fCode}
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder={t.adminCoupons.fCodePlaceholder}
                      required
                      className={inputCls}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
                    {t.adminCoupons.fType}
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                      className={inputCls}
                    >
                      <option value="percentage">{t.adminCoupons.typePercentage}</option>
                      <option value="fixed">{t.adminCoupons.typeFixed}</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
                    {t.adminCoupons.fValue}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={
                        discountType === 'percentage'
                          ? t.adminCoupons.fValueHintPct
                          : t.adminCoupons.fValueHintFixed
                      }
                      required
                      className={inputCls}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
                    {t.adminCoupons.fMinOrder}{' '}
                    <span className="text-muted">{t.adminCoupons.optional}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(e.target.value)}
                      className={inputCls}
                    />
                  </label>
                  {discountType === 'percentage' && (
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
                      {t.adminCoupons.fMaxDiscount}{' '}
                      <span className="text-muted">{t.adminCoupons.optional}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={maxDiscount}
                        onChange={(e) => setMaxDiscount(e.target.value)}
                        className={inputCls}
                      />
                    </label>
                  )}
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
                    {t.adminCoupons.fUsageLimit}{' '}
                    <span className="text-muted">{t.adminCoupons.optional}</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      className={inputCls}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
                    {t.adminCoupons.fPerUserLimit}{' '}
                    <span className="text-muted">{t.adminCoupons.optional}</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={perUserLimit}
                      onChange={(e) => setPerUserLimit(e.target.value)}
                      className={inputCls}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
                    {t.adminCoupons.fExpiresAt}{' '}
                    <span className="text-muted">{t.adminCoupons.optional}</span>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className={inputCls}
                    />
                  </label>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    {saving ? t.adminCoupons.saving : t.adminCoupons.save}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text"
                  >
                    {t.adminCoupons.cancel}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Table */}
          {loading ? (
            <div className="rounded-xl border border-border bg-white p-12 text-center text-sm text-muted">
              {t.adminCoupons.loading}
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
                <Ticket className="h-7 w-7 text-brand-300" aria-hidden />
              </div>
              <p className="font-bold text-brand-900">{t.adminCoupons.empty}</p>
              <p className="text-sm text-muted">{t.adminCoupons.emptyDesc}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-semibold">{t.adminCoupons.colCode}</th>
                    <th className="px-5 py-3 font-semibold">{t.adminCoupons.colDiscount}</th>
                    <th className="px-5 py-3 font-semibold">{t.adminCoupons.colMinOrder}</th>
                    <th className="px-5 py-3 font-semibold">{t.adminCoupons.colUsage}</th>
                    <th className="px-5 py-3 font-semibold">{t.adminCoupons.colExpiry}</th>
                    <th className="px-5 py-3 font-semibold">{t.adminCoupons.colStatus}</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      {t.adminCoupons.colActions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {coupons.map((c) => (
                    <tr key={c._id}>
                      <td className="px-5 py-3 font-bold text-brand-900">{c.code}</td>
                      <td className="px-5 py-3 text-text">{discountLabel(c)}</td>
                      <td className="px-5 py-3 text-muted">
                        {c.minOrderAmount ? formatPrice(c.minOrderAmount) : '—'}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {t.adminCoupons.usageOf(
                          String(c.usedCount),
                          c.usageLimit ? String(c.usageLimit) : t.adminCoupons.noLimit,
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {c.expiresAt ? formatLongDate(c.expiresAt) : t.adminCoupons.noExpiry}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            c.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {c.isActive ? t.adminCoupons.active : t.adminCoupons.inactive}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => toggleActive(c)}
                            className="text-xs font-semibold text-brand-600 hover:underline"
                          >
                            {c.isActive ? t.adminCoupons.disable : t.adminCoupons.enable}
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(c)}
                            aria-label={t.adminCoupons.delete}
                            className="text-muted transition-colors hover:text-[var(--color-error)]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {toDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setToDelete(null)}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-6"
            >
              <p className="font-semibold text-brand-900">
                {t.adminCoupons.deleteConfirm(toDelete.code)}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setToDelete(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text"
                >
                  {t.adminCoupons.cancel}
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="rounded-lg bg-[var(--color-error)] px-4 py-2 text-sm font-semibold text-white"
                >
                  {t.adminCoupons.delete}
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
    </ProtectedRoute>
  );
}
