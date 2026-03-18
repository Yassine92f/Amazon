'use client';

import { motion } from 'motion/react';

type BadgeVariant = 'sale' | 'new' | 'hot' | 'instock' | 'outofstock' | 'category';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  sale: 'bg-red-500 text-white',
  new: 'bg-brand-500 text-white',
  hot: 'bg-gold-400 text-brand-900',
  instock: 'bg-green-50 text-green-700',
  outofstock: 'bg-red-50 text-red-600',
  category: 'bg-white text-brand-900 border border-border',
};

function resolveVariant(label: string): BadgeVariant {
  if (label.startsWith('-')) return 'sale';
  if (label === 'New') return 'new';
  if (label === 'Best Seller' || label === 'HOT DEAL') return 'hot';
  if (label === 'In Stock') return 'instock';
  if (label === 'Out of Stock') return 'outofstock';
  return 'category';
}

export default function Badge({ label, variant, className = '' }: BadgeProps) {
  const v = variant ?? resolveVariant(label);

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold leading-snug ${variantStyles[v]} ${className}`}
    >
      {label}
    </motion.span>
  );
}
