'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { getMyShop, updateMyShop, type SellerDto } from '../../../lib/catalog';
import { t } from '../../../lib/i18n';
import ImageUploader from '../../../components/ImageUploader';

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
      .catch(() => setError(t.seller.shopSettings.loadError));
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
      setMessage(t.seller.shopSettings.updated);
    } catch (err: unknown) {
      const m =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        t.seller.shopSettings.updateError;
      setError(m);
    }
    setSaving(false);
  };

  if (!shop && !error) {
    return (
      <div className="container-main py-20 text-center text-sm text-muted">
        {t.seller.shopSettings.loading}
      </div>
    );
  }

  return (
    <div className="container-main py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">{t.seller.shopSettings.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.seller.shopSettings.subtitle}</p>
        </div>
        {shop && (
          <Link
            href={`/sellers/${shop.shopSlug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            {t.seller.shopSettings.viewPublic}
            <ExternalLink className="h-4 w-4" aria-hidden />
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
          <label className="mb-1 block text-sm font-semibold text-text">
            {t.seller.shopSettings.shopName}
          </label>
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
          <label className="mb-1 block text-sm font-semibold text-text">
            {t.seller.shopSettings.description}
          </label>
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
            {t.seller.shopSettings.logoUrl}{' '}
            <span className="text-xs font-normal text-muted">{t.seller.shopSettings.optional}</span>
          </label>
          <ImageUploader
            value={logo ? [logo] : []}
            onChange={(urls) => setLogo(urls[0] ?? '')}
            single
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-semibold text-text">
            {t.seller.shopSettings.bannerUrl}{' '}
            <span className="text-xs font-normal text-muted">{t.seller.shopSettings.optional}</span>
          </label>
          <ImageUploader
            value={banner ? [banner] : []}
            onChange={(urls) => setBanner(urls[0] ?? '')}
            single
          />
        </div>

        <motion.button
          type="submit"
          disabled={saving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-md bg-brand-500 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? t.seller.shopSettings.saving : t.seller.shopSettings.save}
        </motion.button>
      </form>
    </div>
  );
}
