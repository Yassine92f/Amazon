'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingDown, Sparkles } from 'lucide-react';
import { getPriceHistory, type PriceHistoryDto } from '../../lib/catalog';
import { formatPrice, formatLongDate, t } from '../../lib/i18n';

interface Props {
  productId: string;
  variantId?: string | null;
  // Optional fallback used while the request is in flight or fails — keeps the
  // chart from collapsing the layout when there's nothing to show.
  fallbackPrice?: number;
}

interface PeriodOption {
  days: number;
  label: string;
}

const CHART_HEIGHT = 260;
const PADDING = { top: 20, right: 24, bottom: 36, left: 64 };
// Fallback width on the very first render before the ResizeObserver fires.
const DEFAULT_WIDTH = 720;

export default function PriceHistoryChart({ productId, variantId, fallbackPrice }: Props) {
  const periods: PeriodOption[] = useMemo(
    () => [
      { days: 7, label: t.product.priceHistory.period7 },
      { days: 30, label: t.product.priceHistory.period30 },
      { days: 90, label: t.product.priceHistory.period90 },
      { days: 180, label: t.product.priceHistory.period180 },
      { days: 365, label: t.product.priceHistory.period365 },
    ],
    [],
  );

  const [days, setDays] = useState(90);
  const [data, setData] = useState<PriceHistoryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Measure the chart container so we can render at native (non-stretched) size.
  // Without this the SVG inherits a fixed viewBox and gets squished horizontally
  // when the parent column is wider than the design width.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(w);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPriceHistory(productId, { variantId: variantId ?? undefined, days })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, variantId, days]);

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <Header />

      {/* Summary cards + period selector are reserved on first render so the
          layout doesn't jump when the data lands. */}
      <SummaryRow data={data} fallbackPrice={fallbackPrice} />
      <PeriodSelector periods={periods} value={days} onChange={setDays} />

      <div
        ref={wrapperRef}
        className="mt-4 overflow-hidden rounded-xl border border-border bg-[var(--color-bg)]"
      >
        {loading && !data ? (
          <div
            className="flex items-center justify-center text-sm text-muted"
            style={{ height: CHART_HEIGHT }}
          >
            {t.product.priceHistory.loading}
          </div>
        ) : !data || data.points.length < 2 ? (
          <div
            className="flex items-center justify-center text-sm text-muted"
            style={{ height: CHART_HEIGHT }}
          >
            {t.product.priceHistory.empty}
          </div>
        ) : (
          <Chart
            data={data}
            width={width}
            hoverIdx={hoverIdx}
            onHover={setHoverIdx}
            fallbackPrice={fallbackPrice}
          />
        )}
      </div>
    </section>
  );
}

/* ── Sub-components ────────────────────────────────────────────────── */

function Header() {
  return (
    <header>
      <h2 className="flex items-center gap-2 text-xl font-bold text-brand-900">
        <span className="inline-block h-6 w-1 rounded-full bg-brand-500" />
        {t.product.priceHistory.title}
      </h2>
      <p className="mt-1 text-sm text-muted">{t.product.priceHistory.subtitle}</p>
    </header>
  );
}

function SummaryRow({
  data,
  fallbackPrice,
}: {
  data: PriceHistoryDto | null;
  fallbackPrice?: number;
}) {
  const summary = data?.summary;

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label={t.product.priceHistory.currentPrice}
          value={summary ? formatPrice(summary.currentPrice) : formatPrice(fallbackPrice ?? 0)}
          highlight
        />
        <Stat
          label={t.product.priceHistory.minPrice}
          value={summary ? formatPrice(summary.minPrice) : '—'}
        />
        <Stat
          label={t.product.priceHistory.maxPrice}
          value={summary ? formatPrice(summary.maxPrice) : '—'}
        />
        <Stat
          label={t.product.priceHistory.avgPrice}
          value={summary ? formatPrice(summary.avgPrice) : '—'}
        />
      </div>

      {summary && (summary.isLowestEver || summary.dropFromMaxPercent > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {summary.isLowestEver && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t.product.priceHistory.lowestEverBadge}
            </span>
          )}
          {summary.dropFromMaxPercent > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              <TrendingDown className="h-3.5 w-3.5" aria-hidden />
              {t.product.priceHistory.dropFromMax(summary.dropFromMaxPercent)}
            </span>
          )}
        </div>
      )}
    </>
  );
}

function PeriodSelector({
  periods,
  value,
  onChange,
}: {
  periods: PeriodOption[];
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {periods.map((p) => (
        <button
          key={p.days}
          type="button"
          onClick={() => onChange(p.days)}
          aria-pressed={value === p.days}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === p.days
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-border bg-white text-muted hover:border-brand-300 hover:text-brand-600'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight ? 'border-brand-200 bg-brand-50' : 'border-border bg-[var(--color-bg)]'
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p
        className={`mt-0.5 text-base font-bold ${highlight ? 'text-brand-700' : 'text-brand-900'}`}
      >
        {value}
      </p>
    </div>
  );
}

/* ── Chart ─────────────────────────────────────────────────────────── */

function Chart({
  data,
  width,
  hoverIdx,
  onHover,
  fallbackPrice,
}: {
  data: PriceHistoryDto;
  width: number;
  hoverIdx: number | null;
  onHover: (i: number | null) => void;
  fallbackPrice?: number;
}) {
  const { summary, points } = data;
  const plotW = Math.max(80, width - PADDING.left - PADDING.right);
  const plotH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  // Pad the Y axis by 10% so the line is never glued to the edges. When the
  // series is perfectly flat (min === max), widen the band manually to render
  // the line in the middle of the plot.
  const minPrice = summary.minPrice;
  const maxPrice = summary.maxPrice;
  const range = maxPrice - minPrice || Math.max(1, maxPrice * 0.05);
  const yMin = minPrice - range * 0.1;
  const yMax = maxPrice + range * 0.1;
  const yScale = (price: number) => PADDING.top + plotH - ((price - yMin) / (yMax - yMin)) * plotH;
  const xScale = (idx: number) =>
    points.length === 1
      ? PADDING.left + plotW / 2
      : PADDING.left + (idx / (points.length - 1)) * plotW;

  // Plain polyline keeps things crisp and tells the truth — no fake smoothing
  // that hides sharp price jumps.
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(2)} ${yScale(p.price).toFixed(2)}`)
    .join(' ');

  const areaPath =
    `M${xScale(0).toFixed(2)} ${(PADDING.top + plotH).toFixed(2)} ` +
    points.map((p, i) => `L${xScale(i).toFixed(2)} ${yScale(p.price).toFixed(2)}`).join(' ') +
    ` L${xScale(points.length - 1).toFixed(2)} ${(PADDING.top + plotH).toFixed(2)} Z`;

  // 4 evenly spaced Y ticks. Picking 4 (instead of 3) gives a finer scale on
  // wider charts without crowding.
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const value = yMax - ((yMax - yMin) * i) / (tickCount - 1);
    return { value, y: PADDING.top + (i * plotH) / (tickCount - 1) };
  });

  // Pick a comfortable number of X labels based on the chart width.
  const targetLabels = Math.max(3, Math.min(6, Math.floor(plotW / 110)));
  const xLabelIdx = Array.from({ length: targetLabels }, (_, i) =>
    Math.round((i * (points.length - 1)) / (targetLabels - 1)),
  );

  function pickIndexFromX(clientX: number, svg: SVGSVGElement): number {
    const rect = svg.getBoundingClientRect();
    const xInSvg = clientX - rect.left;
    const rel = (xInSvg - PADDING.left) / plotW;
    const clamped = Math.max(0, Math.min(1, rel));
    return Math.round(clamped * (points.length - 1));
  }

  const hover = hoverIdx !== null ? points[hoverIdx] : null;
  const hoverX = hoverIdx !== null ? xScale(hoverIdx) : 0;
  const hoverY = hover ? yScale(hover.price) : 0;

  const priceChanged = summary.minPrice !== summary.maxPrice;

  // Anchor label horizontally so the leftmost/rightmost dates don't get clipped.
  const xLabelAnchor = (idx: number): 'start' | 'middle' | 'end' => {
    if (idx === 0) return 'start';
    if (idx === points.length - 1) return 'end';
    return 'middle';
  };

  return (
    <motion.div
      key={`${data.period.days}-${data.variantId}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <svg
        width={width}
        height={CHART_HEIGHT}
        viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        className="block"
        role="img"
        aria-label={`${t.product.priceHistory.title} — ${data.period.days} jours`}
        onMouseMove={(e) => onHover(pickIndexFromX(e.clientX, e.currentTarget))}
        onMouseLeave={() => onHover(null)}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          if (touch) onHover(pickIndexFromX(touch.clientX, e.currentTarget));
        }}
        onTouchEnd={() => onHover(null)}
      >
        <defs>
          <linearGradient id="ph-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-400)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-brand-400)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((tk) => (
          <g key={tk.value}>
            <line
              x1={PADDING.left}
              x2={PADDING.left + plotW}
              y1={tk.y}
              y2={tk.y}
              stroke="var(--color-border)"
              strokeDasharray="2 4"
              strokeWidth={1}
            />
            <text
              x={PADDING.left - 10}
              y={tk.y + 4}
              textAnchor="end"
              fontSize={11}
              fill="var(--color-text-muted)"
            >
              {formatPrice(tk.value)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#ph-area)" />

        <path
          d={linePath}
          fill="none"
          stroke="var(--color-brand-500)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {xLabelIdx.map((idx) => (
          <text
            key={idx}
            x={xScale(idx)}
            y={CHART_HEIGHT - 10}
            textAnchor={xLabelAnchor(idx)}
            fontSize={11}
            fill="var(--color-text-muted)"
          >
            {formatLongDate(points[idx].date)}
          </text>
        ))}

        {hover && (
          <g>
            <line
              x1={hoverX}
              x2={hoverX}
              y1={PADDING.top}
              y2={PADDING.top + plotH}
              stroke="var(--color-brand-400)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={hoverX}
              cy={hoverY}
              r={5}
              fill="var(--color-brand-500)"
              stroke="white"
              strokeWidth={2}
            />
          </g>
        )}
      </svg>

      {/* Tooltip strip — outside the SVG so the text is never clipped. */}
      <div className="border-t border-border bg-white px-4 py-2.5 text-xs">
        {hover ? (
          <span className="text-text">
            <span className="text-muted">
              {t.product.priceHistory.tooltipPriceOn(formatLongDate(hover.date))}
            </span>
            {' — '}
            <span className="font-bold text-brand-900">{formatPrice(hover.price)}</span>
          </span>
        ) : !priceChanged ? (
          <span className="text-muted">
            {t.product.priceHistory.noVariation} —{' '}
            <span className="font-semibold text-text">
              {formatPrice(fallbackPrice ?? summary.currentPrice)}
            </span>
          </span>
        ) : (
          <span className="text-muted">
            {formatLongDate(points[0].date)} → {formatLongDate(points[points.length - 1].date)}
          </span>
        )}
      </div>
    </motion.div>
  );
}
