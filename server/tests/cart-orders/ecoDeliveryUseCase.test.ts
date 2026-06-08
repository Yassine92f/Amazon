import {
  EcoDeliveryUseCase,
  EcoDeliveryError,
} from '../../src/application/use-cases/EcoDeliveryUseCase';
import { IOrderEcoMetricRepository } from '../../src/domain/repositories/IOrderEcoMetricRepository';
import { IOrderRepository } from '../../src/domain/repositories/IOrderRepository';
import {
  EcoDeliveryOptionIdEntity,
  ECO_BASELINE_CO2_KG,
} from '../../src/domain/entities/EcoDeliveryOption';
import { OrderEcoMetricEntity } from '../../src/domain/entities/OrderEcoMetric';
import { OrderEntity } from '../../src/domain/entities/Order';
import { OrderStatus, DeliveryType } from '@ecommerce/shared';

function buildOrder(overrides: Partial<OrderEntity> = {}): OrderEntity {
  return {
    id: 'order-1',
    userId: 'user-1',
    orderNumber: 'ORD-1',
    items: [],
    subtotal: 50,
    shippingCost: 0,
    discountAmount: 0,
    totalAmount: 50,
    status: OrderStatus.PENDING,
    deliveryType: DeliveryType.HOME,
    shippingAddress: { street: 's', city: 'c', postalCode: 'p', country: 'FR' },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeMetricRepo(): {
  repo: IOrderEcoMetricRepository;
  store: Map<string, OrderEcoMetricEntity>;
} {
  const store = new Map<string, OrderEcoMetricEntity>();
  const repo: IOrderEcoMetricRepository = {
    upsert: async (metric) => {
      store.set(metric.orderId, metric);
      return metric;
    },
    findByOrderId: async (orderId) => store.get(orderId) ?? null,
    sumSavedByOrderIds: async (orderIds) => {
      let total = 0;
      let count = 0;
      for (const id of orderIds) {
        const m = store.get(id);
        if (m) {
          total += m.co2SavedKg;
          count += 1;
        }
      }
      return { totalSavedKg: total, orderCount: count };
    },
    countTreesPlanted: async () => {
      let trees = 0;
      let cents = 0;
      for (const m of store.values()) {
        trees += m.treesPlanted;
        cents += m.treeDonationCents;
      }
      return { totalTrees: trees, totalDonationCents: cents };
    },
  };
  return { repo, store };
}

function makeOrderRepo(order: OrderEntity | null): IOrderRepository {
  return { findById: jest.fn(async () => order) } as unknown as IOrderRepository;
}

describe('EcoDeliveryUseCase.listOptions', () => {
  it('returns the static catalogue with the baseline', () => {
    const { repo } = makeMetricRepo();
    const useCase = new EcoDeliveryUseCase(repo, makeOrderRepo(null));

    const result = useCase.listOptions();

    expect(result.baselineCo2Kg).toBe(ECO_BASELINE_CO2_KG);
    expect(result.options.length).toBeGreaterThan(2);
    const ids = result.options.map((o) => o.id);
    expect(ids).toContain(EcoDeliveryOptionIdEntity.STANDARD);
    expect(ids).toContain(EcoDeliveryOptionIdEntity.BIKE_CARGO);
  });
});

describe('EcoDeliveryUseCase.computeImpact', () => {
  it('reports 0 saved kg for the baseline option itself', () => {
    const { repo } = makeMetricRepo();
    const useCase = new EcoDeliveryUseCase(repo, makeOrderRepo(null));

    const impact = useCase.computeImpact(EcoDeliveryOptionIdEntity.STANDARD);
    expect(impact.co2SavedKg).toBe(0);
    expect(impact.co2EmittedKg).toBe(ECO_BASELINE_CO2_KG);
  });

  it('reports positive savings and a car-km equivalence for a low-impact option', () => {
    const { repo } = makeMetricRepo();
    const useCase = new EcoDeliveryUseCase(repo, makeOrderRepo(null));

    const impact = useCase.computeImpact(EcoDeliveryOptionIdEntity.BIKE_CARGO);
    expect(impact.co2EmittedKg).toBeLessThan(ECO_BASELINE_CO2_KG);
    expect(impact.co2SavedKg).toBeGreaterThan(0);
    expect(impact.equivalentCarKm).toBeGreaterThan(0);
  });

  it('rejects an unknown option id', () => {
    const { repo } = makeMetricRepo();
    const useCase = new EcoDeliveryUseCase(repo, makeOrderRepo(null));

    expect(() => useCase.computeImpact('ghost' as EcoDeliveryOptionIdEntity)).toThrow(
      EcoDeliveryError,
    );
  });
});

describe('EcoDeliveryUseCase.recordChoice', () => {
  it('persists the choice when the order belongs to the user', async () => {
    const { repo, store } = makeMetricRepo();
    const order = buildOrder({ userId: 'user-1' });
    const useCase = new EcoDeliveryUseCase(repo, makeOrderRepo(order));

    const result = await useCase.recordChoice('user-1', 'order-1', {
      optionId: EcoDeliveryOptionIdEntity.PICKUP_GROUPED,
    });

    expect(result.optionId).toBe(EcoDeliveryOptionIdEntity.PICKUP_GROUPED);
    expect(result.co2SavedKg).toBeGreaterThan(0);
    expect(store.get('order-1')).toBeDefined();
  });

  it('rejects when the order does not belong to the user (403)', async () => {
    const { repo } = makeMetricRepo();
    const order = buildOrder({ userId: 'someone-else' });
    const useCase = new EcoDeliveryUseCase(repo, makeOrderRepo(order));

    await expect(
      useCase.recordChoice('user-1', 'order-1', { optionId: EcoDeliveryOptionIdEntity.STANDARD }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('rejects when the order does not exist (404)', async () => {
    const { repo } = makeMetricRepo();
    const useCase = new EcoDeliveryUseCase(repo, makeOrderRepo(null));

    await expect(
      useCase.recordChoice('user-1', 'order-1', { optionId: EcoDeliveryOptionIdEntity.STANDARD }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('overwrites a previous choice for the same order (upsert)', async () => {
    const { repo, store } = makeMetricRepo();
    const order = buildOrder({ userId: 'user-1' });
    const useCase = new EcoDeliveryUseCase(repo, makeOrderRepo(order));

    await useCase.recordChoice('user-1', 'order-1', {
      optionId: EcoDeliveryOptionIdEntity.STANDARD,
    });
    await useCase.recordChoice('user-1', 'order-1', {
      optionId: EcoDeliveryOptionIdEntity.BIKE_CARGO,
    });

    expect(store.size).toBe(1);
    expect(store.get('order-1')?.optionId).toBe(EcoDeliveryOptionIdEntity.BIKE_CARGO);
  });

  it('records the tree donation (1 tree, 100 cents) when the buyer opts in', async () => {
    const { repo, store } = makeMetricRepo();
    const order = buildOrder({ userId: 'user-1' });
    const useCase = new EcoDeliveryUseCase(repo, makeOrderRepo(order));

    const result = await useCase.recordChoice('user-1', 'order-1', {
      optionId: EcoDeliveryOptionIdEntity.PICKUP_GROUPED,
      donateTree: true,
    });

    expect(result.treesPlanted).toBe(1);
    expect(result.treeDonationCents).toBe(100);
    expect(store.get('order-1')?.treesPlanted).toBe(1);
  });

  it('persists zero trees when the buyer skips the pledge', async () => {
    const { repo } = makeMetricRepo();
    const order = buildOrder({ userId: 'user-1' });
    const useCase = new EcoDeliveryUseCase(repo, makeOrderRepo(order));

    const result = await useCase.recordChoice('user-1', 'order-1', {
      optionId: EcoDeliveryOptionIdEntity.STANDARD,
      donateTree: false,
    });

    expect(result.treesPlanted).toBe(0);
    expect(result.treeDonationCents).toBe(0);
  });
});

describe('EcoDeliveryUseCase.getTreesPlantedSummary', () => {
  it('returns the platform-wide counter from the repository', async () => {
    const { repo, store } = makeMetricRepo();
    const order1 = buildOrder({ id: 'order-1', userId: 'user-1' });
    const order2 = buildOrder({ id: 'order-2', userId: 'user-2' });

    const useCase = new EcoDeliveryUseCase(repo, {
      findById: jest.fn(async (id: string) =>
        id === 'order-1' ? order1 : id === 'order-2' ? order2 : null,
      ),
    } as unknown as IOrderRepository);

    await useCase.recordChoice('user-1', 'order-1', {
      optionId: EcoDeliveryOptionIdEntity.STANDARD,
      donateTree: true,
    });
    await useCase.recordChoice('user-2', 'order-2', {
      optionId: EcoDeliveryOptionIdEntity.BIKE_CARGO,
      donateTree: true,
    });

    const summary = await useCase.getTreesPlantedSummary();
    expect(summary.totalTrees).toBe(2);
    expect(summary.totalDonationCents).toBe(200);
    expect(store.size).toBe(2);
  });
});

describe('EcoDeliveryUseCase.getForOrder', () => {
  it('returns null when no choice has been recorded yet', async () => {
    const { repo } = makeMetricRepo();
    const order = buildOrder({ userId: 'user-1' });
    const useCase = new EcoDeliveryUseCase(repo, makeOrderRepo(order));

    const result = await useCase.getForOrder('user-1', 'order-1');
    expect(result).toBeNull();
  });

  it('rejects a foreign read with 403', async () => {
    const { repo } = makeMetricRepo();
    const order = buildOrder({ userId: 'someone-else' });
    const useCase = new EcoDeliveryUseCase(repo, makeOrderRepo(order));

    await expect(useCase.getForOrder('user-1', 'order-1')).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
