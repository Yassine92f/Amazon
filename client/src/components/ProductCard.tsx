'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import Badge from './Badge';
import StarRating from './StarRating';

interface ProductCardProps {
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  emoji?: string;
  image?: string;
  gradientFrom?: string;
  gradientTo?: string;
  seller: string;
  freeShipping?: boolean;
  badge?: string;
}

function formatPrice(value: number): string {
  return `€${value.toFixed(2).replace('.', ',')}`;
}

export default function ProductCard({
  name,
  price,
  originalPrice,
  rating,
  reviewCount,
  emoji,
  image,
  gradientFrom = 'from-gray-50',
  gradientTo = 'to-gray-100',
  seller,
  freeShipping = false,
  badge,
}: ProductCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(31,23,16,0.12)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow-sm"
    >
      {/* Image area */}
      <div
        className={`relative aspect-square ${image ? 'bg-gray-50' : `bg-gradient-to-br ${gradientFrom} ${gradientTo}`} flex items-center justify-center overflow-hidden`}
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <motion.span
            className="text-5xl sm:text-6xl select-none"
            role="img"
            whileHover={{ scale: 1.1, rotate: 3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {emoji}
          </motion.span>
        )}

        {badge && (
          <span className="absolute top-2.5 left-2.5 z-10">
            <Badge label={badge} />
          </span>
        )}

        {/* Hover add-to-cart overlay */}
        <div className="absolute inset-x-0 bottom-0 z-10 translate-y-full opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M1 1.75A.75.75 0 011.75 1h1.628a1.75 1.75 0 011.734 1.51L5.18 3h13.07a.75.75 0 01.733.918l-1.5 6.5A.75.75 0 0116.75 11H6.41l.26 1.5h9.08a.75.75 0 010 1.5H6.25a.75.75 0 01-.74-.637L3.68 2.51A.25.25 0 003.378 2.25H1.75A.75.75 0 011 1.75zM6 17.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM17.5 17.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
            Add to cart
          </button>
        </div>
      </div>

      {/* Info area */}
      <div className="flex flex-1 flex-col p-3 gap-1">
        <h3 className="text-sm font-semibold leading-snug text-brand-900 line-clamp-2 min-h-[2.5rem]">
          {name}
        </h3>

        <StarRating rating={rating} count={reviewCount} />

        <div className="flex items-center flex-wrap gap-x-1.5 mt-auto pt-1">
          <span
            className={`text-lg font-bold ${originalPrice ? 'text-brand-600' : 'text-brand-900'}`}
          >
            {formatPrice(price)}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-sm text-muted line-through">{formatPrice(originalPrice)}</span>
          )}
        </div>

        <p className="text-xs text-muted truncate">{seller}</p>

        {freeShipping && (
          <span className="inline-flex items-center gap-1 self-start rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-3 w-3"
            >
              <path
                fillRule="evenodd"
                d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z"
                clipRule="evenodd"
              />
            </svg>
            Free shipping
          </span>
        )}
      </div>
    </motion.article>
  );
}
