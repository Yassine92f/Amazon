import { api } from './api';

// ── Types (mirror server DTOs) ─────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Sellers
export interface SellerDto {
  _id: string;
  userId: string;
  shopName: string;
  shopSlug: string;
  description: string;
  logo?: string;
  banner?: string;
  rating: number;
  reviewCount: number;
  totalSales: number;
  isVerified: boolean;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Categories
export interface CategoryDto {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface CategoryNode extends CategoryDto {
  children: CategoryNode[];
}

// Products
export interface ProductVariantDto {
  _id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: Record<string, string>;
  images: string[];
}
export interface ProductDto {
  _id: string;
  sellerId: string;
  shopName?: string;
  shopSlug?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  brand?: string;
  tags: string[];
  variants: ProductVariantDto[];
  images: string[];
  rating: number;
  reviewCount: number;
  totalSold: number;
  isActive: boolean;
  isFeatured: boolean;
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface ProductSummaryDto {
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
  sellerId: string;
  shopName?: string;
  isFeatured: boolean;
}

export interface ProductFacets {
  categories: { value: string; count: number; label?: string }[];
  brands: { value: string; count: number }[];
  priceRange: { min: number; max: number };
  ratingDistribution: { stars: number; count: number }[];
}

export interface ProductSearchResult extends PaginatedResponse<ProductSummaryDto> {
  facets: ProductFacets;
}

export interface ProductSearchParams {
  page?: number;
  limit?: number;
  query?: string;
  categoryId?: string;
  brand?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sellerId?: string;
  sortBy?: 'relevance' | 'price' | 'rating' | 'totalSold' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  isFeatured?: boolean;
}

// Reviews
export interface ReviewDto {
  _id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  productId: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  sellerResponse?: { comment: string; respondedAt: string };
  createdAt: string;
  updatedAt: string;
}
export interface ReviewListResult extends PaginatedResponse<ReviewDto> {
  stats: {
    averageRating: number;
    total: number;
    distribution: { stars: number; count: number }[];
  };
}

// Seller-facing review (with the product it belongs to)
export interface SellerReviewDto {
  _id: string;
  productId: string;
  productName: string;
  productSlug: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  sellerResponse?: { comment: string; respondedAt: string };
  createdAt: string;
}
export type SellerReviewListResult = PaginatedResponse<SellerReviewDto>;

export async function listMyReviews(
  params: { page?: number; limit?: number; onlyUnanswered?: boolean } = {},
): Promise<SellerReviewListResult> {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.onlyUnanswered) query.onlyUnanswered = 'true';
  const { data } = await api.get('/products/me/reviews', { params: query });
  return data.data;
}

export async function replyToReview(reviewId: string, comment: string): Promise<SellerReviewDto> {
  const { data } = await api.post(`/products/reviews/${reviewId}/reply`, { comment });
  return data.data;
}

// ── Admin product moderation ───────────────────────────────────────────
export interface AdminProductDto {
  _id: string;
  name: string;
  slug: string;
  brand?: string;
  image: string;
  sellerId: string;
  shopName: string;
  minPrice: number;
  rating: number;
  reviewCount: number;
  totalSold: number;
  inStock: boolean;
  isActive: boolean;
  createdAt: string;
}

export async function listAdminProducts(
  params: { page?: number; limit?: number; query?: string; isActive?: boolean } = {},
): Promise<PaginatedResponse<AdminProductDto>> {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.query) query.query = params.query;
  if (params.isActive !== undefined) query.isActive = String(params.isActive);
  const { data } = await api.get('/admin/products', { params: query });
  return data.data;
}

export async function setAdminProductActive(
  id: string,
  isActive: boolean,
): Promise<AdminProductDto> {
  const { data } = await api.put(`/admin/products/${id}/status`, { isActive });
  return data.data;
}

export async function deleteAdminProduct(id: string): Promise<void> {
  await api.delete(`/admin/products/${id}`);
}

// ── Admin coupons ──────────────────────────────────────────────────────
export interface AdminCouponDto {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiresAt?: string;
  usageLimit?: number;
  perUserLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponInput {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiresAt?: string;
  usageLimit?: number;
  perUserLimit?: number;
  isActive?: boolean;
}

export async function listAdminCoupons(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse<AdminCouponDto>> {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  const { data } = await api.get('/admin/coupons', { params: query });
  return data.data;
}

export async function createCoupon(input: CreateCouponInput): Promise<AdminCouponDto> {
  const { data } = await api.post('/admin/coupons', input);
  return data.data;
}

export async function updateCoupon(
  id: string,
  input: Partial<Omit<CreateCouponInput, 'code'>>,
): Promise<AdminCouponDto> {
  const { data } = await api.put(`/admin/coupons/${id}`, input);
  return data.data;
}

export async function deleteCoupon(id: string): Promise<void> {
  await api.delete(`/admin/coupons/${id}`);
}

// ── Categories API ─────────────────────────────────────────────────────

export async function listCategories(): Promise<CategoryDto[]> {
  const { data } = await api.get('/categories');
  return data.data;
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  const { data } = await api.get('/categories/tree');
  return data.data;
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDto> {
  const { data } = await api.get(`/categories/${slug}`);
  return data.data;
}

// ── Sellers API ────────────────────────────────────────────────────────

export async function getMyShop(): Promise<SellerDto> {
  const { data } = await api.get('/sellers/me/shop');
  return data.data;
}

export async function registerSeller(input: {
  shopName: string;
  description: string;
}): Promise<SellerDto> {
  const { data } = await api.post('/sellers/register', input);
  return data.data;
}

export async function updateMyShop(input: {
  shopName?: string;
  description?: string;
  logo?: string;
  banner?: string;
}): Promise<SellerDto> {
  const { data } = await api.put('/sellers/me/shop', input);
  return data.data;
}

export async function getPublicShop(slug: string): Promise<SellerDto> {
  const { data } = await api.get(`/sellers/${slug}`);
  return data.data;
}

export interface SellerListParams {
  page?: number;
  limit?: number;
  query?: string;
  isVerified?: boolean;
}

export async function listSellers(
  params: SellerListParams = {},
): Promise<PaginatedResponse<SellerDto>> {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.query) query.query = params.query;
  if (params.isVerified !== undefined) query.isVerified = String(params.isVerified);
  const { data } = await api.get('/sellers', { params: query });
  return data.data;
}

// ── Products API ───────────────────────────────────────────────────────

function serializeSearchParams(params: ProductSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length > 0) out[key] = value.join(',');
    } else {
      out[key] = String(value);
    }
  }
  return out;
}

export async function searchProducts(params: ProductSearchParams): Promise<ProductSearchResult> {
  const { data } = await api.get('/products', { params: serializeSearchParams(params) });
  return data.data;
}

export async function getProductBySlug(slug: string): Promise<ProductDto> {
  const { data } = await api.get(`/products/${slug}`);
  return data.data;
}

export async function getProductById(id: string): Promise<ProductDto> {
  const { data } = await api.get(`/products/by-id/${id}`);
  return data.data;
}

export async function listMyProducts(
  params: Omit<ProductSearchParams, 'sellerId'>,
): Promise<ProductSearchResult> {
  const { data } = await api.get('/products/me/list', { params: serializeSearchParams(params) });
  return data.data;
}

export async function getMyProduct(id: string): Promise<ProductDto> {
  const { data } = await api.get(`/products/me/${id}`);
  return data.data;
}

export interface ProductInput {
  name: string;
  description: string;
  categoryId: string;
  brand?: string;
  tags?: string[];
  variants: {
    name: string;
    sku: string;
    price: number;
    compareAtPrice?: number;
    stock: number;
    attributes?: Record<string, string>;
    images?: string[];
  }[];
  images: string[];
}

export async function createProduct(input: ProductInput): Promise<ProductDto> {
  const { data } = await api.post('/products', input);
  return data.data;
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput> & { isActive?: boolean; isFeatured?: boolean },
): Promise<ProductDto> {
  const { data } = await api.put(`/products/${id}`, input);
  return data.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

// ── Price history API ──────────────────────────────────────────────────

export interface PriceHistoryPointDto {
  date: string;
  price: number;
}

export interface PriceHistorySummaryDto {
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  lowestEverPrice: number;
  isLowestEver: boolean;
  dropFromMaxPercent: number;
}

export interface PriceHistoryDto {
  productId: string;
  variantId?: string;
  variantName?: string;
  period: { from: string; to: string; days: number };
  points: PriceHistoryPointDto[];
  summary: PriceHistorySummaryDto;
}

export async function getPriceHistory(
  productId: string,
  params: { variantId?: string; days?: number } = {},
): Promise<PriceHistoryDto> {
  const { data } = await api.get(`/products/${productId}/price-history`, { params });
  return data.data;
}

// ── Reviews API ────────────────────────────────────────────────────────

export async function listProductReviews(
  productId: string,
  params: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'rating';
    sortOrder?: 'asc' | 'desc';
    minRating?: number;
  },
): Promise<ReviewListResult> {
  const { data } = await api.get(`/products/${productId}/reviews`, { params });
  return data.data;
}
