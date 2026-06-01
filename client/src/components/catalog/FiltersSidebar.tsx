'use client';

import { useState } from 'react';
import { t } from '../../lib/i18n';
import type { ProductFacets } from '../../lib/catalog';

export interface FilterState {
  brands: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock: boolean;
  categoryId?: string;
}

interface Props {
  facets: ProductFacets;
  state: FilterState;
  onChange: (state: FilterState) => void;
  onReset: () => void;
  hideCategorySection?: boolean;
}

export default function FiltersSidebar({
  facets,
  state,
  onChange,
  onReset,
  hideCategorySection = false,
}: Props) {
  const [minP, setMinP] = useState(state.minPrice?.toString() ?? '');
  const [maxP, setMaxP] = useState(state.maxPrice?.toString() ?? '');

  const toggleBrand = (brand: string) => {
    const next = state.brands.includes(brand)
      ? state.brands.filter((b) => b !== brand)
      : [...state.brands, brand];
    onChange({ ...state, brands: next });
  };

  const applyPrice = () => {
    const min = minP ? Number(minP) : undefined;
    const max = maxP ? Number(maxP) : undefined;
    onChange({ ...state, minPrice: min, maxPrice: max });
  };

  const setRating = (r?: number) => onChange({ ...state, minRating: r });
  const toggleStock = () => onChange({ ...state, inStock: !state.inStock });

  return (
    <aside className="w-[260px] shrink-0 rounded-lg border border-border bg-white p-5">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-bold text-brand-900">{t.filters.title}</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          {t.filters.reset}
        </button>
      </div>

      {!hideCategorySection && facets.categories.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-[13px] font-bold text-brand-900">{t.filters.category}</h3>
          <ul className="flex flex-col gap-0.5">
            {facets.categories.slice(0, 6).map((c) => (
              <li key={c.value}>
                <button
                  type="button"
                  onClick={() => onChange({ ...state, categoryId: c.value })}
                  className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-[13px] ${
                    state.categoryId === c.value
                      ? 'bg-brand-50 font-semibold text-brand-700'
                      : 'text-text hover:bg-gray-50'
                  }`}
                >
                  <span>{c.label ?? c.value}</span>
                  <span className="text-xs text-muted">{c.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6">
        <h3 className="mb-2 text-[13px] font-bold text-brand-900">{t.filters.price}</h3>
        <div className="mb-2 flex gap-2">
          <input
            type="number"
            min={0}
            placeholder={t.filters.min}
            value={minP}
            onChange={(e) => setMinP(e.target.value)}
            onBlur={applyPrice}
            className="w-full rounded-md border border-border bg-bg px-2 py-1.5 text-[13px] outline-none focus:border-brand-500"
          />
          <input
            type="number"
            min={0}
            placeholder={t.filters.max}
            value={maxP}
            onChange={(e) => setMaxP(e.target.value)}
            onBlur={applyPrice}
            className="w-full rounded-md border border-border bg-bg px-2 py-1.5 text-[13px] outline-none focus:border-brand-500"
          />
        </div>
        <p className="text-[11px] text-muted">
          €{facets.priceRange.min} — €{facets.priceRange.max}
        </p>
      </div>

      {facets.brands.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-[13px] font-bold text-brand-900">{t.filters.brand}</h3>
          <ul className="flex flex-col gap-1">
            {facets.brands.slice(0, 8).map((b) => {
              const checked = state.brands.includes(b.value);
              return (
                <li key={b.value}>
                  <label className="flex cursor-pointer items-center gap-2.5 py-0.5 text-[13px]">
                    <span
                      onClick={() => toggleBrand(b.value)}
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                        checked ? 'bg-brand-500 text-white' : 'border border-border-strong bg-white'
                      }`}
                    >
                      {checked && (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                          <path
                            fillRule="evenodd"
                            d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 truncate">{b.value}</span>
                    <span className="text-xs text-muted">{b.count}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mb-6">
        <h3 className="mb-2 text-[13px] font-bold text-brand-900">{t.filters.customerRating}</h3>
        <ul className="flex flex-col gap-1">
          {[5, 4, 3, 2].map((stars) => (
            <li key={stars}>
              <button
                type="button"
                onClick={() => setRating(state.minRating === stars ? undefined : stars)}
                className={`flex w-full items-center gap-2 rounded-sm px-1 py-0.5 text-[13px] ${
                  state.minRating === stars ? 'bg-brand-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      viewBox="0 0 20 20"
                      fill={i < stars ? '#F59E0B' : '#D4C9BB'}
                      className="h-3.5 w-3.5"
                    >
                      <path d="M10 1l2.6 5.4 5.9.9-4.3 4.2 1 5.9L10 14.7 4.8 17.4l1-5.9L1.5 7.3l5.9-.9L10 1z" />
                    </svg>
                  ))}
                </span>
                <span className="text-xs text-muted">{t.filters.andUp}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-[13px] font-bold text-brand-900">{t.filters.availability}</h3>
        <label className="flex cursor-pointer items-center gap-2.5 py-0.5 text-[13px]">
          <span
            onClick={toggleStock}
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${
              state.inStock ? 'bg-brand-500 text-white' : 'border border-border-strong bg-white'
            }`}
          >
            {state.inStock && (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
          <span className="font-semibold">{t.filters.inStockOnly}</span>
        </label>
      </div>
    </aside>
  );
}
