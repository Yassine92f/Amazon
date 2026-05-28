export interface ProductVariantEntity {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: Record<string, string>;
  images: string[];
}

export interface ProductEntity {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  brand?: string;
  tags: string[];
  variants: ProductVariantEntity[];
  images: string[];
  rating: number;
  reviewCount: number;
  totalSold: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}
