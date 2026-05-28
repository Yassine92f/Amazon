'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import StarRating from '../StarRating';
import Badge from '../Badge';
import type { ProductSummaryDto } from '../../lib/catalog';

function formatPrice(value: number): string {
  return `€${value.toFixed(2).replace('.', ',')}`;
}

function discountPercent(price: number, compareAt?: number): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export default function CatalogProductCard({ product }: { product: ProductSummaryDto }) {
  const off = discountPercent(product.price, product.compareAtPrice);

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(31,23,16,0.12)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow-sm"
    >
      <Link href={`/products/${product.slug}`} className="contents">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">📦</div>
          )}

          {off !== null && (
            <span className="absolute top-2.5 left-2.5 z-10">
              <Badge label={`-${off}%`} />
            </span>
          )}
          {!product.inStock && (
            <span className="absolute top-2.5 right-2.5 z-10 rounded-full bg-gray-900/80 px-2 py-1 text-[10px] font-bold text-white">
              OUT OF STOCK
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          {product.brand && (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {product.brand}
            </span>
          )}
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-brand-900">
            {product.name}
          </h3>
          <StarRating rating={product.rating} count={product.reviewCount} />
          <div className="mt-auto flex flex-wrap items-center gap-x-1.5 pt-1">
            <span
              className={`text-lg font-bold ${product.compareAtPrice ? 'text-brand-600' : 'text-brand-900'}`}
            >
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-muted line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          {product.shopName && <p className="truncate text-xs text-muted">{product.shopName}</p>}
        </div>
      </Link>
    </motion.div>
  );
}
