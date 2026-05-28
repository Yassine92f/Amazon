'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { getMyShop, updateMyShop, type SellerDto } from '../../../lib/catalog';

export default function SellerSettingsPage() {
  const [shop, setShop] = useState<SellerDto | null>(null);
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getMyShop()
      .then((s) => {
        if (cancelled) return;
        setShop(s);
        setShopName(s.shopName);
        setDescription(s.description);
        setLogo(s.logo ?? '');
        setBanner(s.banner ?? '');
      })
      .catch(() => setError('Failed to load shop'));
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await updateMyShop({
        shopName: shopName.trim(),
        description: description.trim(),
        logo: logo.trim() || undefined,
        banner: banner.trim() || undefined,
      });
      setShop(updated);
      setMessage('Shop updated.');
    } catch (err: unknown) {
      const m =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to update shop';
      setError(m);
    }
    setSaving(false);
  };

  if (!shop && !error) {
    return <div className="container-main py-20 text-center text-sm text-muted">Loading…</div>;
  }

  return (
    <div className="container-main py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">Shop settings</h1>
          <p className="mt-1 text-sm text-muted">Update your shop name, description and visuals.</p>
        </div>
        {shop && (
          <Link
            href={`/sellers/${shop.shopSlug}`}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            View public page →
          </Link>
        )}
      </div>

      <form onSubmit={submit} className="max-w-2xl rounded-2xl border border-border bg-white p-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-semibold text-text">Shop name</label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={60}
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full rounded-md border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-semibold text-text">Description</label>
          <textarea
            rows={4}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-md border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-semibold text-text">
            Logo URL <span className="text-xs font-normal text-muted">(optional)</span>
          </label>
          <input
            type="url"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            placeholder="https://cdn.example.com/shop/logo.png"
            className="w-full rounded-md border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-semibold text-text">
            Banner URL <span className="text-xs font-normal text-muted">(optional)</span>
          </label>
          <input
            type="url"
            value={banner}
            onChange={(e) => setBanner(e.target.value)}
            placeholder="https://cdn.example.com/shop/banner.jpg"
            className="w-full rounded-md border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>

        <motion.button
          type="submit"
          disabled={saving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-md bg-brand-500 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </motion.button>
      </form>
    </div>
  );
}
