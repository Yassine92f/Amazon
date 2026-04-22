import { ProductUseCase, ProductError } from '../../src/application/use-cases/ProductUseCase';
import {
  IProductRepository,
  ProductSearchResult,
} from '../../src/domain/repositories/IProductRepository';
import { ICategoryRepository } from '../../src/domain/repositories/ICategoryRepository';
import { ISellerRepository } from '../../src/domain/repositories/ISellerRepository';
import { ProductEntity } from '../../src/domain/entities/Product';
import { CategoryEntity } from '../../src/domain/entities/Category';
import { SellerEntity } from '../../src/domain/entities/Seller';

function buildProduct(overrides: Partial<ProductEntity> = {}): ProductEntity {
  return {
    id: 'product-1',
    sellerId: 'seller-1',
    name: 'Wireless Headphones',
    slug: 'wireless-headphones',
    description: 'Great noise cancelling',
    categoryId: 'cat-1',
    brand: 'Sony',
    tags: ['audio'],
    variants: [
      {
        id: 'v1',
        name: 'Black',
        sku: 'WH-BLACK',
        price: 299,
        stock: 10,
        attributes: { color: 'black' },
        images: [],
      },
    ],
    images: ['https://cdn/x.jpg'],
    rating: 4.5,
    reviewCount: 12,
    totalSold: 50,
    isActive: true,
    isFeatured: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function buildCategory(): CategoryEntity {
  return {
    id: 'cat-1',
    name: 'Audio',
    slug: 'audio',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
}

function buildSeller(overrides: Partial<SellerEntity> = {}): SellerEntity {
  return {
    id: 'seller-1',
    userId: 'user-1',
    shopName: 'Shop One',
    shopSlug: 'shop-one',
    description: '',
    rating: 0,
    reviewCount: 0,
    totalSales: 0,
    totalRevenue: 0,
    isVerified: true,
    commissionRate: 0.1,
    joinedAt: new Date('2026-01-01'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeProductRepo(initial?: ProductEntity): IProductRepository {
  const products = new Map<string, ProductEntity>();
  if (initial) products.set(initial.id, initial);
  const slugs = new Set(initial ? [initial.slug] : []);

  return {
    findById: jest.fn(async (id: string) => products.get(id) ?? null),
    findBySlug: jest.fn(async (slug: string) => {
      for (const p of products.values()) if (p.slug === slug) return p;
      return null;
    }),
    slugExists: jest.fn(async (slug: string) => slugs.has(slug)),
    create: jest.fn(async (data) => {
      const created = buildProduct({
        id: `p-${products.size + 1}`,
        sellerId: data.sellerId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId,
        brand: data.brand,
        tags: data.tags,
        images: data.images,
        variants: data.variants.map((v, i) => ({ id: `v-${i}`, ...v })),
      });
      products.set(created.id, created);
      slugs.add(created.slug);
      return created;
    }),
    updateById: jest.fn(async (id, data) => {
      const existing = products.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data } as ProductEntity;
      products.set(id, updated);
      return updated;
    }),
    deleteById: jest.fn(async (id: string) => {
      products.delete(id);
    }),
    search: jest.fn(
      async (): Promise<ProductSearchResult> => ({
        products: Array.from(products.values()),
        total: products.size,
        facets: {
          categories: [],
          brands: [],
          priceRange: { min: 0, max: 0 },
          ratingDistribution: [1, 2, 3, 4, 5].map((stars) => ({ stars, count: 0 })),
        },
      }),
    ),
    countBySeller: jest.fn(async () => products.size),
    findIdsBySeller: jest.fn(async (sellerId: string) =>
      [...products.values()].filter((p) => p.sellerId === sellerId).map((p) => p.id),
    ),
    countByCategory: jest.fn(async () => products.size),
    decrementVariantStock: jest.fn(async () => true),
    incrementVariantStock: jest.fn(async () => undefined),
    incrementTotalSold: jest.fn(async () => undefined),
  };
}

function makeCategoryRepo(category: CategoryEntity | null = buildCategory()): ICategoryRepository {
  return {
    findById: jest.fn(async (id: string) => (category && category.id === id ? category : null)),
    findBySlug: jest.fn(async () => category),
    slugExists: jest.fn(async () => false),
    findAll: jest.fn(async () => (category ? [category] : [])),
    findChildren: jest.fn(async () => []),
    create: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    hasChildren: jest.fn(async () => false),
  };
}

function makeSellerRepo(initial?: SellerEntity): ISellerRepository {
  return {
    findById: jest.fn(async (id: string) => (initial && initial.id === id ? initial : null)),
    findByUserId: jest.fn(async (uid: string) =>
      initial && initial.userId === uid ? initial : null,
    ),
    findBySlug: jest.fn(async () => initial ?? null),
    shopNameExists: jest.fn(async () => false),
    create: jest.fn(),
    updateByUserId: jest.fn(),
    setVerified: jest.fn(),
    findMany: jest.fn(async () => ({ sellers: initial ? [initial] : [], total: initial ? 1 : 0 })),
    incrementSales: jest.fn(async () => undefined),
  };
}

const validProductInput = {
  name: 'New Headphones',
  description: 'A really long description that satisfies validation',
  categoryId: 'cat-1',
  brand: 'Sony',
  tags: ['Audio', 'WIRELESS'],
  variants: [{ name: 'Black', sku: 'X-1', price: 99, stock: 5 }],
  images: ['https://cdn/x.jpg'],
};

describe('ProductUseCase', () => {
  describe('create', () => {
    it('rejects when the user is not a registered seller', async () => {
      const useCase = new ProductUseCase(makeProductRepo(), makeCategoryRepo(), makeSellerRepo());

      await expect(useCase.create('user-without-shop', validProductInput)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('rejects when the category does not exist', async () => {
      const useCase = new ProductUseCase(
        makeProductRepo(),
        makeCategoryRepo(null),
        makeSellerRepo(buildSeller()),
      );
      await expect(useCase.create('user-1', validProductInput)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('creates a product with normalized tags and a unique slug', async () => {
      const repo = makeProductRepo();
      const useCase = new ProductUseCase(repo, makeCategoryRepo(), makeSellerRepo(buildSeller()));

      const product = await useCase.create('user-1', validProductInput);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sellerId: 'seller-1',
          name: 'New Headphones',
          slug: 'new-headphones',
          tags: ['audio', 'wireless'],
          categoryId: 'cat-1',
        }),
      );
      expect(product.slug).toBe('new-headphones');
    });

    it('refuses when no variant is provided', async () => {
      const useCase = new ProductUseCase(
        makeProductRepo(),
        makeCategoryRepo(),
        makeSellerRepo(buildSeller()),
      );
      await expect(
        useCase.create('user-1', { ...validProductInput, variants: [] }),
      ).rejects.toBeInstanceOf(ProductError);
    });
  });

  describe('update', () => {
    it('rejects when the user is not the owner', async () => {
      const repo = makeProductRepo(buildProduct({ sellerId: 'seller-OTHER' }));
      const useCase = new ProductUseCase(repo, makeCategoryRepo(), makeSellerRepo(buildSeller()));
      await expect(useCase.update('user-1', 'product-1', { name: 'X' })).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('allows the owner to toggle isActive', async () => {
      const product = buildProduct();
      const repo = makeProductRepo(product);
      const useCase = new ProductUseCase(repo, makeCategoryRepo(), makeSellerRepo(buildSeller()));

      const updated = await useCase.update('user-1', 'product-1', { isActive: false });
      expect(updated.isActive).toBe(false);
    });
  });

  describe('delete', () => {
    it("rejects deleting another seller's product", async () => {
      const repo = makeProductRepo(buildProduct({ sellerId: 'seller-OTHER' }));
      const useCase = new ProductUseCase(repo, makeCategoryRepo(), makeSellerRepo(buildSeller()));
      await expect(useCase.delete('user-1', 'product-1')).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('deletes the product when owned by the caller', async () => {
      const product = buildProduct();
      const repo = makeProductRepo(product);
      const useCase = new ProductUseCase(repo, makeCategoryRepo(), makeSellerRepo(buildSeller()));

      await useCase.delete('user-1', 'product-1');

      expect(repo.deleteById).toHaveBeenCalledWith('product-1');
    });
  });

  describe('getBySlug', () => {
    it('returns the public DTO enriched with shop + category', async () => {
      const repo = makeProductRepo(buildProduct());
      const useCase = new ProductUseCase(repo, makeCategoryRepo(), makeSellerRepo(buildSeller()));

      const dto = await useCase.getBySlug('wireless-headphones');

      expect(dto.shopName).toBe('Shop One');
      expect(dto.categoryName).toBe('Audio');
      expect(dto.minPrice).toBe(299);
      expect(dto.inStock).toBe(true);
    });

    it('returns 404 for inactive products', async () => {
      const repo = makeProductRepo(buildProduct({ isActive: false }));
      const useCase = new ProductUseCase(repo, makeCategoryRepo(), makeSellerRepo(buildSeller()));
      await expect(useCase.getBySlug('wireless-headphones')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('search', () => {
    it('returns a paginated DTO with enriched facets', async () => {
      const repo = makeProductRepo(buildProduct());
      const useCase = new ProductUseCase(repo, makeCategoryRepo(), makeSellerRepo(buildSeller()));

      const result = await useCase.search({ page: 1, limit: 20 });

      expect(result.total).toBe(1);
      expect(result.items[0].name).toBe('Wireless Headphones');
      expect(result.items[0].shopName).toBe('Shop One');
      expect(result.hasNext).toBe(false);
    });
  });

  describe('listMyProducts', () => {
    it('forbids non-sellers', async () => {
      const useCase = new ProductUseCase(makeProductRepo(), makeCategoryRepo(), makeSellerRepo());
      await expect(
        useCase.listMyProducts('user-without-shop', { page: 1, limit: 10 }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });
});
