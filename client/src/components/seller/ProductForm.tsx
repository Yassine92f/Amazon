'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Plus, X, ArrowLeft } from 'lucide-react';
import {
  listCategories,
  type CategoryDto,
  type ProductDto,
  type ProductInput,
} from '../../lib/catalog';
import { t } from '../../lib/i18n';
import ImageUploader from '../ImageUploader';

interface VariantInput {
  name: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  attributes: { key: string; value: string }[];
  images: string[];
}

interface Props {
  initial?: ProductDto;
  onSubmit: (input: ProductInput, isActive: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
  submitLabel: string;
}

function emptyVariant(): VariantInput {
  return {
    name: '',
    sku: '',
    price: '',
    compareAtPrice: '',
    stock: '0',
    attributes: [],
    images: [],
  };
}

export default function ProductForm({ initial, onSubmit, onDelete, submitLabel }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagDraft, setTagDraft] = useState('');
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [variants, setVariants] = useState<VariantInput[]>(
    initial
      ? initial.variants.map((v) => ({
          name: v.name,
          sku: v.sku,
          price: v.price.toString(),
          compareAtPrice: v.compareAtPrice?.toString() ?? '',
          stock: v.stock.toString(),
          attributes: Object.entries(v.attributes).map(([key, value]) => ({ key, value })),
          images: v.images ?? [],
        }))
      : [emptyVariant()],
  );
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const addTag = () => {
    const tag = tagDraft.trim().toLowerCase();
    if (!tag || tags.includes(tag)) return;
    setTags([...tags, tag]);
    setTagDraft('');
  };

  const removeTag = (tag: string) => setTags(tags.filter((x) => x !== tag));

  const updateVariant = (idx: number, patch: Partial<VariantInput>) => {
    setVariants(variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  };
  const addVariant = () => setVariants([...variants, emptyVariant()]);
  const removeVariant = (idx: number) => {
    if (variants.length === 1) return;
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!categoryId) {
      setError(t.seller.form.errCategory);
      return;
    }
    if (images.length === 0) {
      setError(t.seller.form.errImage);
      return;
    }
    if (variants.some((v) => !v.name.trim() || !v.sku.trim() || !v.price)) {
      setError(t.seller.form.errVariant);
      return;
    }

    const input: ProductInput = {
      name: name.trim(),
      description: description.trim(),
      categoryId,
      brand: brand.trim() || undefined,
      tags,
      images,
      variants: variants.map((v) => ({
        name: v.name.trim(),
        sku: v.sku.trim(),
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
        stock: Number(v.stock || 0),
        attributes: Object.fromEntries(
          v.attributes.filter((a) => a.key && a.value).map((a) => [a.key, a.value]),
        ),
        images: v.images,
      })),
    };

    setSubmitting(true);
    try {
      await onSubmit(input, isActive);
    } catch (err: unknown) {
      const m =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        t.seller.form.errSave;
      setError(m);
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
      router.push('/seller/products');
    } catch (err: unknown) {
      const m =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        t.seller.form.errDelete;
      setError(m);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <form onSubmit={submit} className="container-main py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <Link
            href="/seller/products"
            className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-brand-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {t.seller.form.backToProducts}
          </Link>
          <h1 className="text-2xl font-extrabold text-brand-900">
            {initial ? t.seller.form.editTitle : t.seller.form.newTitle}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/seller/products"
            className="rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-text"
          >
            {t.seller.form.cancel}
          </Link>
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? t.seller.form.saving : submitLabel}
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Basic info */}
          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-4 text-base font-bold text-brand-900">{t.seller.form.basicInfo}</h2>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-semibold text-text">
                {t.seller.form.name}
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={140}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.seller.form.namePlaceholder}
                className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-semibold text-text">
                  {t.seller.form.description}
                </label>
                <span className="text-xs text-muted">{description.length} / 5000</span>
              </div>
              <textarea
                required
                minLength={10}
                maxLength={5000}
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.seller.form.descPlaceholder}
                className="w-full resize-y rounded-md border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-text">
                  {t.seller.form.brand}
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder={t.seller.form.brandPlaceholder}
                  className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-text">
                  {t.seller.form.tags}
                </label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-bg px-2 py-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-brand-900"
                        aria-label="×"
                      >
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder={t.seller.form.tagPlaceholder}
                    className="min-w-[100px] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Images */}
          <section className="rounded-2xl border border-border bg-white p-6">
            <div className="mb-4">
              <h2 className="text-base font-bold text-brand-900">{t.seller.form.images}</h2>
              <p className="mt-0.5 text-xs text-muted">{t.seller.form.imagesHint}</p>
            </div>
            <ImageUploader value={images} onChange={setImages} max={10} />
          </section>

          {/* Variants */}
          <section className="rounded-2xl border border-border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-brand-900">{t.seller.form.variants}</h2>
                <p className="text-xs text-muted">{t.seller.form.variantsDesc}</p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-bold text-text hover:border-brand-300"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                {t.seller.form.addVariant}
              </button>
            </div>
            <div className="space-y-3">
              {variants.map((v, idx) => (
                <VariantRow
                  key={idx}
                  index={idx}
                  variant={v}
                  onChange={(patch) => updateVariant(idx, patch)}
                  onRemove={variants.length > 1 ? () => removeVariant(idx) : undefined}
                />
              ))}
            </div>
          </section>

          {/* Danger zone (edit only) */}
          {onDelete && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-red-900">{t.seller.form.dangerTitle}</h3>
                  <p className="mt-1 text-xs text-red-800">{t.seller.form.dangerDesc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600"
                >
                  {t.seller.form.deleteProduct}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-white p-5">
            <h3 className="mb-3 text-sm font-bold text-brand-900">{t.seller.form.status}</h3>
            <label className="mb-2 flex cursor-pointer items-center gap-3 rounded-md border border-border bg-bg p-3 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input
                type="radio"
                checked={isActive}
                onChange={() => setIsActive(true)}
                className="accent-brand-500"
              />
              <span className="flex-1">
                <span className="block text-sm font-bold text-text">{t.seller.form.active}</span>
                <span className="block text-xs text-muted">{t.seller.form.activeHint}</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-bg p-3 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input
                type="radio"
                checked={!isActive}
                onChange={() => setIsActive(false)}
                className="accent-brand-500"
              />
              <span className="flex-1">
                <span className="block text-sm font-bold text-text">{t.seller.form.inactive}</span>
                <span className="block text-xs text-muted">{t.seller.form.inactiveHint}</span>
              </span>
            </label>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <h3 className="mb-3 text-sm font-bold text-brand-900">{t.seller.form.category}</h3>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            >
              <option value="">{t.seller.form.chooseCategory}</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
            <h3 className="mb-2 text-sm font-bold text-brand-900">{t.seller.form.tips}</h3>
            <ul className="space-y-1.5 text-xs text-brand-800">
              <li>• {t.seller.form.tip1}</li>
              <li>• {t.seller.form.tip2}</li>
              <li>• {t.seller.form.tip3}</li>
            </ul>
          </div>
        </aside>
      </div>

      {confirmDelete && onDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="mb-2 text-base font-bold text-brand-900">
              {t.seller.form.deleteConfirmTitle}
            </h3>
            <p className="mb-5 text-sm text-muted">
              <span className="font-semibold text-text">{name}</span>{' '}
              {t.seller.form.deleteConfirmSuffix}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-text"
              >
                {t.seller.form.cancel}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {deleting ? t.seller.form.deleting : t.seller.form.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function VariantRow({
  index,
  variant,
  onChange,
  onRemove,
}: {
  index: number;
  variant: VariantInput;
  onChange: (patch: Partial<VariantInput>) => void;
  onRemove?: () => void;
}) {
  const [attrKey, setAttrKey] = useState('');
  const [attrVal, setAttrVal] = useState('');

  const addAttr = () => {
    if (!attrKey.trim() || !attrVal.trim()) return;
    onChange({
      attributes: [...variant.attributes, { key: attrKey.trim(), value: attrVal.trim() }],
    });
    setAttrKey('');
    setAttrVal('');
  };
  const removeAttr = (k: string) =>
    onChange({ attributes: variant.attributes.filter((a) => a.key !== k) });

  return (
    <div className="rounded-md border border-border bg-bg p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-text">{t.seller.form.variantN(index + 1)}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold text-red-600 hover:underline"
          >
            {t.seller.form.remove}
          </button>
        )}
      </div>
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="text"
          required
          placeholder={t.seller.form.vName}
          value={variant.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <input
          type="text"
          required
          placeholder={t.seller.form.vSku}
          value={variant.sku}
          onChange={(e) => onChange({ sku: e.target.value })}
          className="rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          type="number"
          required
          min="0"
          step="0.01"
          placeholder={t.seller.form.vPrice}
          value={variant.price}
          onChange={(e) => onChange({ price: e.target.value })}
          className="rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder={t.seller.form.vCompare}
          value={variant.compareAtPrice}
          onChange={(e) => onChange({ compareAtPrice: e.target.value })}
          className="rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <input
          type="number"
          min="0"
          step="1"
          placeholder={t.seller.form.vStock}
          value={variant.stock}
          onChange={(e) => onChange({ stock: e.target.value })}
          className="rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold text-muted">{t.seller.form.attributes}</p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {variant.attributes.map((a) => (
            <span
              key={a.key}
              className="flex items-center gap-1 rounded-full border border-border bg-white px-2 py-0.5 text-xs"
            >
              <span className="text-muted">{a.key}:</span>
              <span className="font-bold text-text">{a.value}</span>
              <button
                type="button"
                onClick={() => removeAttr(a.key)}
                className="text-muted hover:text-text"
                aria-label="×"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={attrKey}
            onChange={(e) => setAttrKey(e.target.value)}
            placeholder={t.seller.form.attrKey}
            className="min-w-0 flex-1 rounded-md border border-border bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-500"
          />
          <input
            type="text"
            value={attrVal}
            onChange={(e) => setAttrVal(e.target.value)}
            placeholder={t.seller.form.attrValue}
            className="min-w-0 flex-1 rounded-md border border-border bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-500"
          />
          <button
            type="button"
            onClick={addAttr}
            className="flex items-center gap-1 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-bold text-text"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t.seller.form.attrAdd}
          </button>
        </div>
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <p className="text-xs font-semibold text-muted">{t.seller.form.vImages}</p>
        <p className="mb-2 text-xs text-muted">{t.seller.form.vImagesHint}</p>
        <ImageUploader value={variant.images} onChange={(images) => onChange({ images })} max={6} />
      </div>
    </div>
  );
}
