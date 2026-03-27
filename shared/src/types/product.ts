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
