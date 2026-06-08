'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Leaf, Bike, Package, Clock, Truck, TreePine, Check } from 'lucide-react';
import {
  EcoDeliveryOptionId,
  getEcoDeliveryOptions,
  getTreesPlantedSummary,
  ecoOptionToDeliveryType,
  type EcoDeliveryOption,
} from '../../lib/ecoDelivery';
import { DeliveryType } from '@ecommerce/shared';
import { shippingFor } from '../../lib/commerce';
import { formatPrice, t } from '../../lib/i18n';

interface Props {
  // Lifted state — the parent (checkout page) keeps the user's choice so it
  // can be sent after the order is created. Keeps this component pure.
  value: EcoDeliveryOptionId;
  onChange: (id: EcoDeliveryOptionId) => void;
  // Subtotal — used to compute the live shipping cost per option so the
  // selector mirrors what the order summary will show.
  subtotal: number;
  // Tree-donation pledge add-on. Optional so callers that don't care about
  // the pledge can omit it (the component degrades gracefully).
  donateTree?: boolean;
  onDonateTreeChange?: (next: boolean) => void;
}

// Lucide icon per option — keeps a recognisable visual cue without dropping
// product-grade illustrations.
const OPTION_ICON: Record<EcoDeliveryOptionId, typeof Leaf> = {
  [EcoDeliveryOptionId.STANDARD]: Truck,
  [EcoDeliveryOptionId.PICKUP_GROUPED]: Package,
  [EcoDeliveryOptionId.BIKE_CARGO]: Bike,
  [EcoDeliveryOptionId.SLOW_GROUPED]: Clock,
};

export default function EcoDeliverySelector({
  value,
  onChange,
  subtotal,
  donateTree = false,
  onDonateTreeChange,
}: Props) {
  const [options, setOptions] = useState<EcoDeliveryOption[]>([]);
  const [baseline, setBaseline] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [treesCount, setTreesCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getEcoDeliveryOptions()
      .then((res) => {
        if (cancelled) return;
        setOptions(res.options);
        setBaseline(res.baselineCo2Kg);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // Fire-and-forget — the trees-planted callout is informational, a failure
    // just leaves the counter at 0.
    getTreesPlantedSummary()
      .then((s) => {
        if (!cancelled) setTreesCount(s.totalTrees);
      })
      .catch(() => {
        /* non-blocking */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Saved compared with the baseline — also drives the green summary banner.
  const selected = useMemo(() => options.find((o) => o.id === value), [options, value]);
  const savedKg = selected ? Math.max(0, baseline - selected.co2KgPerShipment) : 0;
  // ADEME: ~0.12 kg CO2 / km in metropolitan France.
  const equivalentCarKm = Math.round(savedKg * (1 / 0.12) * 10) / 10;

  if (loading && options.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-white p-5">
        <Header />
        <div className="mt-3 h-32 animate-pulse rounded-xl bg-[var(--color-bg)]" />
      </section>
    );
  }

  if (options.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <Header />

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {options.map((opt) => {
          const Icon = OPTION_ICON[opt.id] ?? Leaf;
          const copy = t.eco.options[opt.i18nKey] ?? { label: opt.i18nKey, desc: '' };
          const savedForOpt = Math.max(0, baseline - opt.co2KgPerShipment);
          const isSelected = opt.id === value;
          const isBaseline = opt.co2KgPerShipment >= baseline;
          const physicalType = ecoOptionToDeliveryType(opt.id);
          const physicalLabel =
            physicalType === DeliveryType.HOME
              ? t.checkout.deliveryHome
              : t.checkout.deliveryPickup;
          const cost = shippingFor(subtotal, physicalType);

          return (
            <label
              key={opt.id}
              className={`relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                isSelected
                  ? 'border-green-500 bg-green-50'
                  : 'border-border bg-white hover:border-green-300'
              }`}
            >
              <input
                type="radio"
                name="eco-delivery"
                checked={isSelected}
                onChange={() => onChange(opt.id)}
                className="mt-0.5 accent-green-600"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-900">
                    <Icon className="h-4 w-4 shrink-0 text-green-600" aria-hidden />
                    {copy.label}
                  </p>
                  <span className="shrink-0 text-sm font-bold text-brand-900">
                    {cost === 0 ? t.cart.freeShipping : formatPrice(cost)}
                  </span>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted">
                  <span>{physicalLabel}</span>
                  <span aria-hidden>·</span>
                  <span>{t.eco.estimatedDays(opt.estimatedDays)}</span>
                  <span aria-hidden>·</span>
                  <span className={isBaseline ? '' : 'font-semibold text-green-700'}>
                    {isBaseline ? t.eco.emits(opt.co2KgPerShipment) : t.eco.saves(savedForOpt)}
                  </span>
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {/* Tree-donation toggle — compact one-line variant. */}
      {onDonateTreeChange && (
        <button
          type="button"
          onClick={() => onDonateTreeChange(!donateTree)}
          aria-pressed={donateTree}
          className={`mt-3 flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
            donateTree
              ? 'border-green-500 bg-green-50'
              : 'border-border bg-white hover:border-green-300'
          }`}
        >
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              donateTree ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'
            }`}
          >
            {donateTree ? (
              <Check className="h-4 w-4" aria-hidden />
            ) : (
              <TreePine className="h-4 w-4" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-brand-900">🌳 {t.eco.tree.title}</p>
            <p className="truncate text-[11px] text-muted">
              {donateTree ? t.eco.tree.toggleOn : t.eco.tree.communityCounter(treesCount)}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-green-600 px-2 py-0.5 text-[11px] font-bold text-white">
            {t.eco.tree.cost}
          </span>
        </button>
      )}

      {/* Discrete savings line — only when there's actually CO2 saved. */}
      {savedKg > 0 && (
        <motion.p
          key={`${value}-${savedKg}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 flex items-center gap-1.5 text-xs text-green-700"
        >
          <Leaf className="h-3.5 w-3.5" aria-hidden />
          <span className="font-semibold">{t.eco.summarySaved(savedKg)}</span>
          <span className="text-green-700/70">· {t.eco.equivalentCarKm(equivalentCarKm)}</span>
        </motion.p>
      )}
    </section>
  );
}

function Header() {
  return (
    <header>
      <h2 className="flex items-center gap-2 text-base font-extrabold text-brand-900">
        <Leaf className="h-5 w-5 text-green-600" aria-hidden />
        {t.eco.title}
      </h2>
      <p className="mt-1 text-xs text-muted">{t.eco.subtitle}</p>
    </header>
  );
}
