import { BaseEntity, PaginationParams } from './common';

export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
}

export interface ProductVariant {
  _id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: Record<string, string>; // e.g. { color: "red", size: "M" }
  images: string[];
}

export interface Product extends BaseEntity {
  sellerId: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  brand?: string;
  tags: string[];
  variants: ProductVariant[];
  images: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
}

export interface ProductSearchFilters extends PaginationParams {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  rating?: number;
  inStock?: boolean;
  sellerId?: string;
  tags?: string[];
}

// Lightweight projection for listing pages and cards
export interface ProductSummary {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  brand?: string;
  sellerName: string;
  freeShipping: boolean;
  badge?: string;
  inStock: boolean;
}

// Category with product count (for category grid)
export interface CategoryWithCount extends Category {
  productCount: number;
}

// DTOs
export interface CreateProductRequest {
  name: string;
  description: string;
  categoryId: string;
  brand?: string;
  tags?: string[];
  variants: Omit<ProductVariant, '_id'>[];
  images: string[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  isActive?: boolean;
}

// Price-history transparency: shoppers see how the price of a product (or one
// of its variants) has evolved over a recent window so they can spot real
// discounts vs. inflated reference prices.
export interface PriceHistoryPoint {
  // ISO date (UTC, day-resolution) — one point per calendar day with at least
  // one recorded price for the requested scope.
  date: string;
  price: number;
}

export interface PriceHistorySummary {
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  // Lowest price ever recorded across the full history (not just the window).
  lowestEverPrice: number;
  // True when the current price equals the lowest ever recorded — used to
  // surface an honest "lowest price in N days/ever" badge.
  isLowestEver: boolean;
  // Percentage drop vs. the window's max price (rounded, non-negative).
  dropFromMaxPercent: number;
}

export interface PriceHistoryResponse {
  productId: string;
  variantId?: string;
  variantName?: string;
  period: {
    from: string;
    to: string;
    days: number;
  };
  points: PriceHistoryPoint[];
  summary: PriceHistorySummary;
}
