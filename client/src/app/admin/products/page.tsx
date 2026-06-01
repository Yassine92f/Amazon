'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Eye, EyeOff, Trash2, ExternalLink, Package } from 'lucide-react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import Pagination from '../../../components/catalog/Pagination';
import { t, formatPrice, formatNumber } from '../../../lib/i18n';
import {
  listAdminProducts,
  setAdminProductActive,
  deleteAdminProduct,
  type AdminProductDto,
  type PaginatedResponse,
} from '../../../lib/catalog';

const navItems = [
  { label: t.admin.navDashboard, href: '/admin' },
  { label: t.admin.navUsers, href: '/admin/users' },
  { label: t.admin.navProducts, href: '/admin/products', active: true },
  { label: t.admin.navSellers, href: '/admin' },
  { label: t.admin.navOrders, href: '/admin' },
  { label: t.admin.navSettings, href: '/admin' },
];

type StatusFilter = 'all' | 'active' | 'hidden';

export default function AdminProductsPage() {
  const [data, setData] = useState<PaginatedResponse<AdminProductDto> | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [toDelete, setToDelete] = useState<AdminProductDto | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debounced, status]);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    listAdminProducts({
      page,
      limit: 12,
      query: debounced || undefined,
      isActive: status === 'all' ? undefined : status === 'active',
    })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, debounced, status]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleActive = async (p: AdminProductDto) => {
    try {
      await setAdminProductActive(p._id, !p.isActive);
      showToast(p.isActive ? t.admin.productHidden : t.admin.productShown, 'success');
      fetchProducts();
    } catch {
      showToast(t.admin.actionError, 'error');
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteAdminProduct(toDelete._id);
      setToDelete(null);
      showToast(t.admin.productDeleted, 'success');
      fetchProducts();
    } catch {
      showToast(t.admin.actionError, 'error');
      setToDelete(null);
    }
  };

  return (
    <ProtectedRoute roles={['admin']}>
      <div className="flex h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
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
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {t.admin.productsTitle}
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {t.admin.productsCount(formatNumber(data?.total ?? 0))}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 sm:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.admin.searchProducts}
                className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
              {(
                [
                  ['all', t.admin.allStatuses],
                  ['active', t.admin.statusActive],
                  ['hidden', t.admin.statusHidden],
                ] as [StatusFilter, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                    status === value ? 'bg-brand-500 text-white' : 'text-text hover:bg-brand-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading && !data ? (
            <div className="rounded-xl border border-border bg-white p-12 text-center text-sm text-muted">
              {t.common.loading}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-white p-12 text-center">
              <Package
                className="mx-auto mb-3 h-10 w-10 text-brand-300"
                strokeWidth={1.5}
                aria-hidden
              />
              <p className="text-sm text-muted">{t.admin.noProducts}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-white">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-[var(--color-bg)] text-[11px] font-bold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">{t.admin.colImage}</th>
                    <th className="px-4 py-3 text-left">{t.admin.colShop}</th>
                    <th className="px-4 py-3 text-left">{t.admin.colPrice}</th>
                    <th className="px-4 py-3 text-left">{t.admin.colSold}</th>
                    <th className="px-4 py-3 text-left">{t.admin.colStatus}</th>
                    <th className="px-4 py-3 text-right">{t.admin.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((p) => (
                    <tr key={p._id} className={p.isActive ? '' : 'bg-red-50/40'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--color-bg)]">
                            {p.image && (
                              <Image
                                src={p.image}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-text">{p.name}</p>
                            {p.brand && <p className="text-xs text-muted">{p.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{p.shopName}</td>
                      <td className="px-4 py-3 font-semibold text-text">
                        {formatPrice(p.minPrice)}
                      </td>
                      <td className="px-4 py-3 text-muted">{formatNumber(p.totalSold)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {p.isActive ? t.admin.active : t.admin.hidden}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/products/${p.slug}`}
                            target="_blank"
                            title={t.admin.view}
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-bg)] text-text hover:bg-brand-50"
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden />
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleActive(p)}
                            title={p.isActive ? t.admin.hide : t.admin.show}
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-bg)] text-text hover:bg-brand-50"
                          >
                            {p.isActive ? (
                              <EyeOff className="h-4 w-4" aria-hidden />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(p)}
                            title={t.admin.deleteProduct}
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-bg)] text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.totalPages > 1 && (
            <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-lg ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Delete modal */}
        {toDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6">
              <h3 className="mb-2 text-base font-bold text-brand-900">
                {t.admin.deleteProductTitle}
              </h3>
              <p className="mb-5 text-sm text-muted">
                {t.admin.deleteProductConfirm(toDelete.name)}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setToDelete(null)}
                  className="rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-text"
                >
                  {t.admin.cancel}
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
                >
                  {t.admin.deleteProduct}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
