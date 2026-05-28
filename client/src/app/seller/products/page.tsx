'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Pagination from '../../../components/catalog/Pagination';
import { listMyProducts, deleteProduct, type ProductSummaryDto } from '../../../lib/catalog';

function formatPrice(n: number): string {
  return `€${n.toFixed(2).replace('.', ',')}`;
}

export default function SellerProductsPage() {
  const [items, setItems] = useState<ProductSummaryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState<ProductSummaryDto | null>(null);

  const fetchList = () => {
    setLoading(true);
    listMyProducts({ page, limit: 20, query: query || undefined })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const m =
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Failed to load products';
        setError(m);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteProduct(toDelete._id);
      setToDelete(null);
      fetchList();
    } catch (err: unknown) {
      const m =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to delete product';
      setError(m);
    }
  };

  return (
    <div className="container-main py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">Products</h1>
          <p className="mt-1 text-sm text-muted">{total} total</p>
        </div>
        <Link
          href="/seller/products/new"
          className="rounded-md bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
        >
          + Add new product
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1);
              fetchList();
            }
          }}
          placeholder="Search by name, brand, SKU…"
          className="w-full max-w-sm rounded-md border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500"
        />
        <button
          type="button"
          onClick={() => {
            setPage(1);
            fetchList();
          }}
          className="rounded-md border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text"
        >
          Search
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-12 text-center text-sm text-muted">
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-white p-12 text-center">
          <div className="mb-3 text-4xl">📦</div>
          <h3 className="mb-1 text-base font-bold text-brand-900">No products yet</h3>
          <p className="mb-4 text-sm text-muted">
            Start listing items to appear in the marketplace.
          </p>
          <Link
            href="/seller/products/new"
            className="inline-block rounded-md bg-brand-500 px-5 py-2.5 text-sm font-bold text-white"
          >
            + Add your first product
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-bg text-[11px] font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Brand</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((p) => (
                <tr key={p._id} className="hover:bg-bg">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-brand-100">
                        {p.image && (
                          <Image
                            src={p.image}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-contain"
                          />
                        )}
                      </div>
                      <Link
                        href={`/seller/products/${p._id}/edit`}
                        className="font-semibold text-text hover:text-brand-700"
                      >
                        {p.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.brand ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-text">{formatPrice(p.price)}</span>
                    {p.compareAtPrice && (
                      <span className="ml-1 text-xs text-muted line-through">
                        {formatPrice(p.compareAtPrice)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${p.inStock ? 'text-green-700' : 'text-red-600'}`}>
                      {p.inStock ? 'In stock' : 'Out'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/products/${p.slug}`}
                        target="_blank"
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-bg text-text hover:bg-brand-50"
                        title="View live"
                      >
                        ↗
                      </Link>
                      <Link
                        href={`/seller/products/${p._id}/edit`}
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-bg text-text hover:bg-brand-50"
                        title="Edit"
                      >
                        ✎
                      </Link>
                      <button
                        type="button"
                        onClick={() => setToDelete(p)}
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-bg text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      {toDelete && (
        <DeleteModal
          name={toDelete.name}
          onCancel={() => setToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function DeleteModal({
  name,
  onCancel,
  onConfirm,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <h3 className="mb-2 text-base font-bold text-brand-900">Delete product?</h3>
        <p className="mb-5 text-sm text-muted">
          <span className="font-semibold text-text">{name}</span> will be permanently removed. This
          cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
