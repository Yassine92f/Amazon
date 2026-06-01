import { ProductEntity, ProductVariantEntity } from '../entities/Product';

export interface CreateProductData {
  sellerId: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  brand?: string;
  tags: string[];
  variants: Omit<ProductVariantEntity, 'id'>[];
  images: string[];
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  brand?: string;
  tags?: string[];
  variants?: Omit<ProductVariantEntity, 'id'>[];
  images?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface ProductListFilters {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'price' | 'rating' | 'totalSold' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  query?: string;
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  minRating?: number;
  inStock?: boolean;
  sellerId?: string;
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  // Admin moderation: when true, do not constrain by active status (returns
  // both active and hidden products). Ignored if `isActive` is set explicitly.
  anyStatus?: boolean;
}

export interface ProductFacetBucket {
  value: string;
  count: number;
  label?: string;
}

export interface ProductFacets {
  categories: ProductFacetBucket[];
  brands: ProductFacetBucket[];
  priceRange: { min: number; max: number };
  ratingDistribution: { stars: number; count: number }[];
}

export interface ProductSearchResult {
  products: ProductEntity[];
  total: number;
  facets: ProductFacets;
}

export interface IProductRepository {
  findById(id: string): Promise<ProductEntity | null>;
  findBySlug(slug: string): Promise<ProductEntity | null>;
  slugExists(slug: string): Promise<boolean>;
  create(data: CreateProductData): Promise<ProductEntity>;
  updateById(id: string, data: UpdateProductData): Promise<ProductEntity | null>;
  deleteById(id: string): Promise<void>;
  search(filters: ProductListFilters): Promise<ProductSearchResult>;
  countBySeller(sellerId: string, activeOnly?: boolean): Promise<number>;
  countByCategory(categoryId: string): Promise<number>;
  // Atomically decrement a variant's stock only if enough is available.
  // Returns true on success, false if the product/variant is missing or stock is insufficient.
  decrementVariantStock(productId: string, variantId: string, quantity: number): Promise<boolean>;
  // Restore stock (e.g. on order cancellation or rollback). Best-effort, never fails on missing variant.
  incrementVariantStock(productId: string, variantId: string, quantity: number): Promise<void>;
  // Increment the denormalized totalSold counter when an order is placed.
  incrementTotalSold(productId: string, quantity: number): Promise<void>;
}
