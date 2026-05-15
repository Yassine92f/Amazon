import {
  PriceHistoryUseCase,
  PriceHistoryError,
} from '../../src/application/use-cases/PriceHistoryUseCase';
import {
  IPriceHistoryRepository,
  RecordPriceData,
} from '../../src/domain/repositories/IPriceHistoryRepository';
import { IProductRepository } from '../../src/domain/repositories/IProductRepository';
import { PriceHistoryEntity } from '../../src/domain/entities/PriceHistory';
import { ProductEntity } from '../../src/domain/entities/Product';

function buildProduct(): ProductEntity {
  return {
    id: 'p1',
    sellerId: 's1',
    name: 'Headphones',
    slug: 'headphones',
    description: 'desc',
    categoryId: 'c1',
    brand: 'Sony',
    tags: [],
    variants: [
      { id: 'v1', name: 'Black', sku: 'BLK', price: 100, stock: 5, attributes: {}, images: [] },
      { id: 'v2', name: 'White', sku: 'WHT', price: 120, stock: 3, attributes: {}, images: [] },
    ],
    images: [],
    rating: 4,
    reviewCount: 10,
    totalSold: 0,
    isActive: true,
    isFeatured: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
}

function makeHistoryRepo(initial: PriceHistoryEntity[] = []): {
  repo: IPriceHistoryRepository;
  store: PriceHistoryEntity[];
} {
  const store: PriceHistoryEntity[] = [...initial];

  // De-dup mirror of the Mongo implementation: same latest price → no append.
  async function recordPrice(data: RecordPriceData): Promise<PriceHistoryEntity | null> {
    const latest = [...store]
      .filter((e) => e.productId === data.productId && e.variantId === data.variantId)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())[0];
    if (latest && latest.price === data.price) return latest;
    const entry: PriceHistoryEntity = {
      id: `h-${store.length + 1}`,
      productId: data.productId,
      variantId: data.variantId,
      price: data.price,
      recordedAt: data.recordedAt ?? new Date(),
    };
    store.push(entry);
    return entry;
  }

  const repo: IPriceHistoryRepository = {
    recordPrice,
    recordPrices: async (entries) => {
      const out: PriceHistoryEntity[] = [];
      for (const e of entries) {
        const result = await recordPrice(e);
        if (result) out.push(result);
      }
      return out;
    },
    findInRange: async ({ productId, variantId, from, to }) =>
      store
        .filter(
          (e) =>
            e.productId === productId &&
            (!variantId || e.variantId === variantId) &&
            e.recordedAt >= from &&
            e.recordedAt <= to,
        )
        .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()),
    findLowestEver: async (productId, variantId) => {
      const matching = store.filter(
        (e) => e.productId === productId && (!variantId || e.variantId === variantId),
      );
      if (matching.length === 0) return null;
      return Math.min(...matching.map((e) => e.price));
    },
    findLatest: async (productId, variantId) => {
      const matching = store
        .filter((e) => e.productId === productId && (!variantId || e.variantId === variantId))
        .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
      return matching[0] ?? null;
    },
    deleteByProduct: async (productId) => {
      for (let i = store.length - 1; i >= 0; i--) {
        if (store[i].productId === productId) store.splice(i, 1);
      }
    },
  };

  return { repo, store };
}

function makeProductRepo(product: ProductEntity | null): IProductRepository {
  return {
    findById: jest.fn(async (id: string) => (product && product.id === id ? product : null)),
  } as unknown as IProductRepository;
}

describe('PriceHistoryUseCase.recordCreate', () => {
  it('seeds an entry per variant at the product creation timestamp', async () => {
    const { repo, store } = makeHistoryRepo();
    const useCase = new PriceHistoryUseCase(repo, makeProductRepo(null));

    await useCase.recordCreate(buildProduct());

    expect(store).toHaveLength(2);
    expect(store.map((e) => ({ variantId: e.variantId, price: e.price }))).toEqual([
      { variantId: 'v1', price: 100 },
      { variantId: 'v2', price: 120 },
    ]);
  });
});

describe('PriceHistoryUseCase.recordUpdate', () => {
  it('appends an entry only for variants whose price actually changed', async () => {
    const { repo, store } = makeHistoryRepo();
    const useCase = new PriceHistoryUseCase(repo, makeProductRepo(null));

    const previous = buildProduct().variants;
    const next = [
      { ...previous[0], price: 80 }, // changed
      { ...previous[1] }, // unchanged
    ];

    await useCase.recordUpdate(previous, next, 'p1');

    expect(store).toHaveLength(1);
    expect(store[0]).toMatchObject({ variantId: 'v1', price: 80 });
  });

  it('tracks renamed (new ObjectId) variants by their SKU', async () => {
    const { repo, store } = makeHistoryRepo();
    const useCase = new PriceHistoryUseCase(repo, makeProductRepo(null));

    const previous = buildProduct().variants;
    // Same SKU, brand-new id (this is what happens when the seller saves the
    // form: Mongoose subdocs get a fresh ObjectId on full-list replacement).
    const next = [
      { ...previous[0], id: 'NEW-v1', price: 100 }, // same SKU, same price → skip
      { ...previous[1], id: 'NEW-v2', price: 110 }, // same SKU, price dropped → record
    ];

    await useCase.recordUpdate(previous, next, 'p1');

    expect(store).toHaveLength(1);
    expect(store[0]).toMatchObject({ price: 110 });
  });
});

describe('PriceHistoryUseCase.getHistory', () => {
  const fixedNow = new Date('2026-06-08T12:00:00Z');
  const daysAgo = (n: number) => new Date(fixedNow.getTime() - n * 24 * 60 * 60 * 1000);

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(fixedNow);
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it('rejects unknown products with 404', async () => {
    const { repo } = makeHistoryRepo();
    const useCase = new PriceHistoryUseCase(repo, makeProductRepo(null));

    await expect(useCase.getHistory({ productId: 'missing' })).rejects.toBeInstanceOf(
      PriceHistoryError,
    );
  });

  it('rejects unknown variant id with 404', async () => {
    const product = buildProduct();
    const { repo } = makeHistoryRepo();
    const useCase = new PriceHistoryUseCase(repo, makeProductRepo(product));

    await expect(
      useCase.getHistory({ productId: product.id, variantId: 'ghost' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('falls back to the cheapest variant when no variant id is given', async () => {
    const product = buildProduct();
    const { repo } = makeHistoryRepo([
      { id: 'h1', productId: 'p1', variantId: 'v1', price: 100, recordedAt: daysAgo(60) },
      { id: 'h2', productId: 'p1', variantId: 'v1', price: 90, recordedAt: daysAgo(10) },
      { id: 'h3', productId: 'p1', variantId: 'v2', price: 120, recordedAt: daysAgo(30) },
    ]);
    const useCase = new PriceHistoryUseCase(repo, makeProductRepo(product));

    const result = await useCase.getHistory({ productId: 'p1' });

    // Cheapest variant is v1 (current price 100), summary should reflect its
    // history (not v2's).
    expect(result.variantId).toBe('v1');
    expect(result.summary.currentPrice).toBe(100);
  });

  it('computes summary stats from the requested window', async () => {
    const product = buildProduct();
    const { repo } = makeHistoryRepo([
      { id: 'h1', productId: 'p1', variantId: 'v1', price: 150, recordedAt: daysAgo(80) },
      { id: 'h2', productId: 'p1', variantId: 'v1', price: 120, recordedAt: daysAgo(40) },
      { id: 'h3', productId: 'p1', variantId: 'v1', price: 100, recordedAt: daysAgo(5) },
    ]);
    const useCase = new PriceHistoryUseCase(repo, makeProductRepo(product));

    const result = await useCase.getHistory({ productId: 'p1', variantId: 'v1', days: 90 });

    expect(result.points.length).toBeGreaterThan(0);
    expect(result.summary.maxPrice).toBe(150);
    expect(result.summary.minPrice).toBe(100);
    expect(result.summary.currentPrice).toBe(100); // mirrors the buy box
    expect(result.summary.isLowestEver).toBe(true);
    expect(result.summary.dropFromMaxPercent).toBe(33);
  });

  it('clamps abusive day values into the supported range', async () => {
    const product = buildProduct();
    const { repo } = makeHistoryRepo();
    const useCase = new PriceHistoryUseCase(repo, makeProductRepo(product));

    const tooLarge = await useCase.getHistory({ productId: 'p1', variantId: 'v1', days: 9999 });
    expect(tooLarge.period.days).toBe(365);

    const tooSmall = await useCase.getHistory({ productId: 'p1', variantId: 'v1', days: 1 });
    expect(tooSmall.period.days).toBe(7);
  });

  it('returns a flat synthetic line when no history exists', async () => {
    const product = buildProduct();
    const { repo } = makeHistoryRepo();
    const useCase = new PriceHistoryUseCase(repo, makeProductRepo(product));

    const result = await useCase.getHistory({ productId: 'p1', variantId: 'v1', days: 30 });

    expect(result.points.length).toBeGreaterThanOrEqual(2);
    expect(result.summary.minPrice).toBe(100);
    expect(result.summary.maxPrice).toBe(100);
    expect(result.summary.dropFromMaxPercent).toBe(0);
  });
});
