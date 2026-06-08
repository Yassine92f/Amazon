'use client';

import { Sparkles } from 'lucide-react';
import CatalogProductCard from '../catalog/CatalogProductCard';
import { t } from '../../lib/i18n';
import type { RecommendationItem } from '../../lib/commerce';

interface RecommendationRailProps {
  title: string;
  subtitle?: string;
  items: RecommendationItem[];
}

/**
 * A row of recommended products. Each card carries an explainable "why" chip
 * (e.g. "Souvent acheté avec X") so the recommendation never feels like a
 * black box. Renders nothing when there is nothing to show.
 */
export default function RecommendationRail({ title, subtitle, items }: RecommendationRailProps) {
  if (items.length === 0) return null;

  return (
    <section className="w-full">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand-500" strokeWidth={2} aria-hidden />
        <div>
          <h2 className="text-xl font-bold text-brand-900">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <div key={item._id} className="flex flex-col gap-2">
            <span
              className="inline-flex w-fit max-w-full items-center gap-1 truncate rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold text-brand-600"
              title={t.recommendations.reason(item.reasonCode, item.reasonLabel)}
            >
              <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">
                {t.recommendations.reason(item.reasonCode, item.reasonLabel)}
              </span>
            </span>
            <CatalogProductCard product={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
