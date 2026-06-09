import {
  IProductRepository,
  CreateProductData,
  UpdateProductData,
  ProductListFilters,
  ProductFacets,
} from '../../domain/repositories/IProductRepository';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { ISellerRepository } from '../../domain/repositories/ISellerRepository';
import { IPriceHistoryRepository } from '../../domain/repositories/IPriceHistoryRepository';
import { ProductEntity, ProductVariantEntity } from '../../domain/entities/Product';
import { PriceHistoryUseCase } from './PriceHistoryUseCase';
import { slugify } from '../utils/slugify';

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

export interface ProductSearchDto {
  items: ProductSummaryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  facets: ProductFacets;
}

export interface CreateProductInput {
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

export type UpdateProductInput = Partial<CreateProductInput> & {
  isActive?: boolean;
  isFeatured?: boolean;
};

export class ProductUseCase {
  private readonly priceHistory?: PriceHistoryUseCase;

  constructor(
    private productRepo: IProductRepository,
    private categoryRepo: ICategoryRepository,
    private sellerRepo: ISellerRepository,
    // Optional: when provided, every price change is appended to the audit
    // series consumed by the price-transparency chart. Tests that don't care
    // about history can simply omit it.
    priceHistoryRepo?: IPriceHistoryRepository,
  ) {
    if (priceHistoryRepo) {
      this.priceHistory = new PriceHistoryUseCase(priceHistoryRepo, productRepo);
    }
  }

  async create(userId: string, input: CreateProductInput): Promise<ProductDto> {
    const seller = await this.sellerRepo.findByUserId(userId);
    if (!seller) {
      throw new ProductError(403, 'You must register as a seller to create products');
    }

    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) throw new ProductError(404, 'Category not found');

    if (!input.variants?.length) {
      throw new ProductError(400, 'At least one variant is required');
    }

    const slug = await this.generateUniqueSlug(input.name);

    const data: CreateProductData = {
      sellerId: seller.id,
      name: input.name.trim(),
      slug,
      description: input.description.trim(),
      categoryId: category.id,
      brand: input.brand?.trim(),
      tags: input.tags?.map((t) => t.trim().toLowerCase()).filter(Boolean) ?? [],
      variants: input.variants.map((v) => ({
        name: v.name.trim(),
        sku: v.sku.trim(),
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        stock: v.stock,
        attributes: v.attributes ?? {},
        images: v.images ?? [],
      })),
      images: input.images,
    };

    const product = await this.productRepo.create(data);
    await this.priceHistory?.recordCreate(product);
    return this.toDto(product);
  }

  async update(userId: string, productId: string, input: UpdateProductInput): Promise<ProductDto> {
    const product = await this.requireOwnedByUser(userId, productId);

    if (input.categoryId && input.categoryId !== product.categoryId) {
      const category = await this.categoryRepo.findById(input.categoryId);
      if (!category) throw new ProductError(404, 'Category not found');
    }

    const data: UpdateProductData = {};
    if (input.name !== undefined) {
      data.name = input.name.trim();
      const newSlug = slugify(data.name);
      if (newSlug && newSlug !== product.slug) {
        data.slug = await this.generateUniqueSlug(data.name);
      }
    }
    if (input.description !== undefined) data.description = input.description.trim();
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.brand !== undefined) data.brand = input.brand?.trim();
    if (input.tags !== undefined)
      data.tags = input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (input.variants !== undefined) {
      if (input.variants.length === 0) {
        throw new ProductError(400, 'At least one variant is required');
      }
      data.variants = input.variants.map((v) => ({
        name: v.name.trim(),
        sku: v.sku.trim(),
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        stock: v.stock,
        attributes: v.attributes ?? {},
        images: v.images ?? [],
      }));
    }
    if (input.images !== undefined) data.images = input.images;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;

    const updated = await this.productRepo.updateById(productId, data);
    if (!updated) throw new ProductError(500, 'Failed to update product');
    if (data.variants && this.priceHistory) {
      await this.priceHistory.recordUpdate(product.variants, updated.variants, updated.id);
    }
    return this.toDto(updated);
  }

  async delete(userId: string, productId: string): Promise<void> {
    await this.requireOwnedByUser(userId, productId);
    await this.productRepo.deleteById(productId);
    await this.priceHistory?.deleteForProduct(productId);
  }

  async getBySlug(slug: string): Promise<ProductDto> {
    const product = await this.productRepo.findBySlug(slug);
    if (!product || !product.isActive) {
      throw new ProductError(404, 'Product not found');
    }
    return this.enrichDto(this.toDto(product));
  }

  async getById(id: string): Promise<ProductDto> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new ProductError(404, 'Product not found');
    return this.enrichDto(this.toDto(product));
  }

  async getMyProduct(userId: string, productId: string): Promise<ProductDto> {
    const product = await this.requireOwnedByUser(userId, productId);
    return this.toDto(product);
  }

  async search(filters: ProductListFilters): Promise<ProductSearchDto> {
    const { products, total, facets } = await this.productRepo.search(filters);
    const totalPages = Math.ceil(total / filters.limit);

    const enrichedFacets = await this.enrichFacets(facets);

    return {
      items: await Promise.all(products.map((p) => this.toSummaryDto(p))),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
      hasNext: filters.page < totalPages,
      hasPrev: filters.page > 1,
      facets: enrichedFacets,
    };
  }

  async listMyProducts(
    userId: string,
    filters: Omit<ProductListFilters, 'sellerId'>,
  ): Promise<ProductSearchDto> {
    const seller = await this.sellerRepo.findByUserId(userId);
    if (!seller) {
      throw new ProductError(403, 'You are not registered as a seller');
    }
    return this.search({ ...filters, sellerId: seller.id, isActive: undefined });
  }

  private async requireOwnedByUser(userId: string, productId: string): Promise<ProductEntity> {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new ProductError(404, 'Product not found');
    const seller = await this.sellerRepo.findByUserId(userId);
    if (!seller || seller.id !== product.sellerId) {
      throw new ProductError(403, 'You can only modify your own products');
    }
    return product;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || `product-${Date.now()}`;
    let slug = base;
    let suffix = 1;
    while (await this.productRepo.slugExists(slug)) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    return slug;
  }

  private toDto(p: ProductEntity): ProductDto {
    const prices = p.variants.map((v) => v.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const inStock = p.variants.some((v) => v.stock > 0);

    return {
      _id: p.id,
      sellerId: p.sellerId,
      name: p.name,
      slug: p.slug,
      description: p.description,
      categoryId: p.categoryId,
      brand: p.brand,
      tags: p.tags,
      variants: p.variants.map((v) => this.variantToDto(v)),
      images: p.images,
      rating: p.rating,
      reviewCount: p.reviewCount,
      totalSold: p.totalSold,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      minPrice,
      maxPrice,
      inStock,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  private variantToDto(v: ProductVariantEntity): ProductVariantDto {
    return {
      _id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      stock: v.stock,
      attributes: v.attributes,
      images: v.images,
    };
  }

  private async toSummaryDto(p: ProductEntity): Promise<ProductSummaryDto> {
    const seller = await this.sellerRepo.findById(p.sellerId);
    const cheapest = p.variants.reduce<ProductVariantEntity | undefined>(
      (min, v) => (!min || v.price < min.price ? v : min),
      undefined,
    );
    return {
      _id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      image: p.images[0] ?? cheapest?.images[0] ?? '',
      price: cheapest?.price ?? 0,
      compareAtPrice: cheapest?.compareAtPrice,
      rating: p.rating,
      reviewCount: p.reviewCount,
      inStock: p.variants.some((v) => v.stock > 0),
      sellerId: p.sellerId,
      shopName: seller?.shopName,
      isFeatured: p.isFeatured,
    };
  }

  private async enrichDto(dto: ProductDto): Promise<ProductDto> {
    const [seller, category] = await Promise.all([
      this.sellerRepo.findById(dto.sellerId),
      this.categoryRepo.findById(dto.categoryId),
    ]);
    return {
      ...dto,
      shopName: seller?.shopName,
      shopSlug: seller?.shopSlug,
      categoryName: category?.name,
      categorySlug: category?.slug,
    };
  }

  private async enrichFacets(facets: ProductFacets): Promise<ProductFacets> {
    const resolved = await Promise.all(
      facets.categories.map(async (c) => {
        const cat = await this.categoryRepo.findById(c.value);
        return cat ? { ...c, label: cat.name } : null;
      }),
    );
    // Drop facet buckets whose category no longer exists (orphan refs from
    // deleted/re-seeded categories) so the UI never shows a raw ObjectId.
    const categories = resolved.filter((c): c is NonNullable<typeof c> => c !== null);
    return { ...facets, categories };
  }
}

export class ProductError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, ProductError.prototype);
  }
}
