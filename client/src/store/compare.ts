import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductSummaryDto } from '../lib/catalog';

export const MAX_COMPARE = 4;

// Lightweight projection persisted for the comparison tray/page.
export interface CompareItem {
  _id: string;
  slug: string;
  name: string;
  brand?: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

interface CompareState {
  items: CompareItem[];
  toggle: (product: ProductSummaryDto) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

function toItem(p: ProductSummaryDto): CompareItem {
  return {
    _id: p._id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    image: p.image,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock: p.inStock,
  };
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (product) => {
        const items = get().items;
        if (items.some((i) => i._id === product._id)) {
          set({ items: items.filter((i) => i._id !== product._id) });
        } else if (items.length < MAX_COMPARE) {
          set({ items: [...items, toItem(product)] });
        }
      },
      remove: (id) => set({ items: get().items.filter((i) => i._id !== id) }),
      clear: () => set({ items: [] }),
      has: (id) => get().items.some((i) => i._id === id),
    }),
    { name: 'abracadabra-compare' },
  ),
);
