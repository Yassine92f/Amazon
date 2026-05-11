import { RecommendationUseCase } from '../../src/application/use-cases/RecommendationUseCase';
import {
  IProductRepository,
  ProductSearchResult,
} from '../../src/domain/repositories/IProductRepository';
import { IOrderRepository } from '../../src/domain/repositories/IOrderRepository';
import { IProductViewRepository } from '../../src/domain/repositories/IProductViewRepository';
import { ISellerRepository } from '../../src/domain/repositories/ISellerRepository';
import { ICategoryRepository } from '../../src/domain/repositories/ICategoryRepository';
import { ProductEntity } from '../../src/domain/entities/Product';
import { OrderEntity } from '../../src/domain/entities/Order';
import { OrderStatus, DeliveryType } from '@ecommerce/shared';

function product(over: Partial<ProductEntity> & { id: string }): ProductEntity {
  return {
    sellerId: 'seller-1',
    name: over.id,
    slug: over.id,
    description: 'desc',
    categoryId: 'cat-audio',
    brand: 'Sony',
    tags: ['audio'],
    variants: [
      { id: 'v', name: 'std', sku: over.id, price: 50, stock: 5, attributes: {}, images: [] },
    ],
    images: ['https://cdn/x.jpg'],
    rating: 4,
    reviewCount: 3,
    totalSold: 10,
    isActive: true,
    isFeatured: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...over,
  };
}

function order(items: Array<{ productId: string; productName: string }>): OrderEntity {
  return {
    id: 'order-' + items.map((i) => i.productId).join('-'),
    userId: 'user-1',
    orderNumber: 'AB-1',
    items: items.map((i) => ({
      productId: i.productId,
      variantId: 'v',
      productName: i.productName,
      variantName: 'std',
      quantity: 1,
      unitPrice: 50,
      totalPrice: 50,
    })),
    subtotal: 50,
    shippingCost: 0,
    discountAmount: 0,
    totalAmount: 50,
    status: OrderStatus.DELIVERED,
    deliveryType: DeliveryType.HOME,
    shippingAddress: { street: 's', city: 'c', postalCode: '00000', country: 'FR' },
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-01'),
  };
}

function makeRepos(opts: {
  catalog: ProductEntity[];
  userOrders?: OrderEntity[];
  coPurchaseOrders?: OrderEntity[];
  recentViews?: { productId: string; viewedAt: Date }[];
}) {
  const byId = new Map(opts.catalog.map((p) => [p.id, p]));

  const productRepo = {
    findById: jest.fn(async (id: string) => byId.get(id) ?? null),
    findByIds: jest.fn(async (ids: string[]) =>
      ids.map((id) => byId.get(id)).filter((p): p is ProductEntity => Boolean(p)),
    ),
    search: jest.fn(async (filters): Promise<ProductSearchResult> => {
      let products = opts.catalog.filter((p) => p.isActive);
      if (filters.categoryIds?.length) {
        products = products.filter((p) => filters.categoryIds!.includes(p.categoryId));
      }
      if (filters.sortBy === 'totalSold') {
        products = [...products].sort((a, b) => b.totalSold - a.totalSold);
      }
      return {
        products: products.slice(0, filters.limit),
        total: products.length,
        facets: {
          categories: [],
          brands: [],
          priceRange: { min: 0, max: 0 },
          ratingDistribution: [],
        },
      };
    }),
  } as unknown as IProductRepository;

  const orderRepo = {
    findByUser: jest.fn(async () => ({
      orders: opts.userOrders ?? [],
      total: (opts.userOrders ?? []).length,
    })),
    findByProductIds: jest.fn(async () => ({
      orders: opts.coPurchaseOrders ?? [],
      total: (opts.coPurchaseOrders ?? []).length,
    })),
  } as unknown as IOrderRepository;

  const viewRepo = {
    record: jest.fn(async () => undefined),
    findRecentByUser: jest.fn(async () => opts.recentViews ?? []),
  } as unknown as IProductViewRepository;

  const sellerRepo = {
    findById: jest.fn(async () => ({ id: 'seller-1', shopName: 'AudioShop' })),
  } as unknown as ISellerRepository;

  const categoryRepo = {
    findById: jest.fn(async (id: string) => ({
      id,
      name: id === 'cat-audio' ? 'Audio' : 'Maison',
    })),
  } as unknown as ICategoryRepository;

  return { productRepo, orderRepo, viewRepo, sellerRepo, categoryRepo };
}

describe('RecommendationUseCase', () => {
  it('falls back to trending for a user with no history (cold start)', async () => {
    const catalog = [product({ id: 'p1', totalSold: 5 }), product({ id: 'p2', totalSold: 99 })];
    const repos = makeRepos({ catalog });
    const useCase = new RecommendationUseCase(
      repos.productRepo,
      repos.orderRepo,
      repos.viewRepo,
      repos.sellerRepo,
      repos.categoryRepo,
    );

    const recs = await useCase.getForUser('user-1', 10);

    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((r) => r.reasonCode === 'trending')).toBe(true);
    // Sorted by sales: the best-seller comes first.
    expect(recs[0]._id).toBe('p2');
  });

  it('recommends from taste profile and co-purchases, excluding owned products', async () => {
    const catalog = [
      product({ id: 'p1', categoryId: 'cat-audio', brand: 'Sony' }), // purchased
      product({ id: 'p2', categoryId: 'cat-audio', brand: 'Sony', tags: ['audio'] }), // content match
      product({ id: 'p4', categoryId: 'cat-audio', brand: 'Acme', tags: ['cable'] }), // co-purchased
      product({ id: 'p9', categoryId: 'cat-home', brand: 'Other', tags: ['home'] }), // unrelated
    ];
    const repos = makeRepos({
      catalog,
      userOrders: [order([{ productId: 'p1', productName: 'Casque Sony' }])],
      coPurchaseOrders: [
        order([
          { productId: 'p1', productName: 'Casque Sony' },
          { productId: 'p4', productName: 'Cable' },
        ]),
      ],
    });
    const useCase = new RecommendationUseCase(
      repos.productRepo,
      repos.orderRepo,
      repos.viewRepo,
      repos.sellerRepo,
      repos.categoryRepo,
    );

    const recs = await useCase.getForUser('user-1', 10);
    const ids = recs.map((r) => r._id);

    expect(ids).not.toContain('p1'); // never recommend an owned product
    expect(ids).toContain('p2');
    expect(ids).toContain('p4');

    const p4 = recs.find((r) => r._id === 'p4')!;
    expect(p4.reasonCode).toBe('bought_together');
    expect(p4.reasonLabel).toBe('Casque Sony');

    const p2 = recs.find((r) => r._id === 'p2')!;
    expect(['category_affinity', 'brand_affinity']).toContain(p2.reasonCode);
  });

  it('records a product view via the repository', async () => {
    const repos = makeRepos({ catalog: [] });
    const useCase = new RecommendationUseCase(
      repos.productRepo,
      repos.orderRepo,
      repos.viewRepo,
      repos.sellerRepo,
      repos.categoryRepo,
    );

    await useCase.recordView('user-1', 'p1');
    expect(repos.viewRepo.record).toHaveBeenCalledWith('user-1', 'p1');
  });

  it('returns similar products for a product page, excluding the anchor', async () => {
    const catalog = [
      product({ id: 'p1', categoryId: 'cat-audio', brand: 'Sony' }), // anchor
      product({ id: 'p2', categoryId: 'cat-audio', brand: 'Sony' }), // similar
      product({ id: 'p4', categoryId: 'cat-audio', brand: 'Acme' }), // co-purchased
      product({ id: 'p9', categoryId: 'cat-home', brand: 'Other' }), // different category
    ];
    const repos = makeRepos({
      catalog,
      coPurchaseOrders: [
        order([
          { productId: 'p1', productName: 'Casque Sony' },
          { productId: 'p4', productName: 'Cable' },
        ]),
      ],
    });
    const useCase = new RecommendationUseCase(
      repos.productRepo,
      repos.orderRepo,
      repos.viewRepo,
      repos.sellerRepo,
      repos.categoryRepo,
    );

    const recs = await useCase.getSimilarToProduct('p1', 8);
    const ids = recs.map((r) => r._id);

    expect(ids).not.toContain('p1');
    expect(ids).toContain('p2');
    expect(ids).toContain('p4');
    expect(ids).not.toContain('p9'); // different category, not co-purchased
  });

  it('returns an empty list for an unknown anchor product', async () => {
    const repos = makeRepos({ catalog: [] });
    const useCase = new RecommendationUseCase(
      repos.productRepo,
      repos.orderRepo,
      repos.viewRepo,
      repos.sellerRepo,
      repos.categoryRepo,
    );

    expect(await useCase.getSimilarToProduct('missing', 8)).toEqual([]);
  });

  it('backfills with trending so a thin profile still fills the rail', async () => {
    // The buyer only ever touched p1 (audio); without backfill the personalized
    // pool is nearly empty. Trending products should top the list up to `limit`.
    const catalog = [
      product({ id: 'p1', categoryId: 'cat-audio', totalSold: 5 }), // purchased (owned)
      product({ id: 'p2', categoryId: 'cat-audio', totalSold: 10 }), // personalized candidate
      product({ id: 't1', categoryId: 'cat-home', brand: 'X', tags: ['home'], totalSold: 900 }),
      product({ id: 't2', categoryId: 'cat-home', brand: 'Y', tags: ['home'], totalSold: 800 }),
    ];
    const repos = makeRepos({
      catalog,
      userOrders: [order([{ productId: 'p1', productName: 'Casque' }])],
    });
    const useCase = new RecommendationUseCase(
      repos.productRepo,
      repos.orderRepo,
      repos.viewRepo,
      repos.sellerRepo,
      repos.categoryRepo,
    );

    const recs = await useCase.getForUser('user-1', 3);
    const ids = recs.map((r) => r._id);

    expect(recs.length).toBe(3);
    expect(ids).not.toContain('p1'); // owned product never recommended
    expect(ids).toContain('t1'); // trending filler
    expect(recs.some((r) => r.reasonCode === 'trending')).toBe(true);
  });
});
