import { OrderStatus, DeliveryType } from '@ecommerce/shared';
import { ReviewUseCase } from '../../src/application/use-cases/ReviewUseCase';
import { IReviewRepository } from '../../src/domain/repositories/IReviewRepository';
import { IOrderRepository } from '../../src/domain/repositories/IOrderRepository';
import { IProductRepository } from '../../src/domain/repositories/IProductRepository';
import { OrderEntity } from '../../src/domain/entities/Order';
import { ReviewEntity } from '../../src/domain/entities/Review';

const PRODUCT = 'p1';

function buildOrder(overrides: Partial<OrderEntity> = {}): OrderEntity {
  return {
    id: 'o1',
    userId: 'u1',
    orderNumber: 'ORD-1',
    items: [
      {
        productId: PRODUCT,
        variantId: 'v1',
        productName: 'Casque',
        variantName: 'Noir',
        quantity: 1,
        unitPrice: 50,
        totalPrice: 50,
      },
    ],
    subtotal: 50,
    shippingCost: 0,
    discountAmount: 0,
    totalAmount: 50,
    status: OrderStatus.DELIVERED,
    deliveryType: DeliveryType.HOME,
    shippingAddress: { street: 's', city: 'c', postalCode: 'p', country: 'FR' },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeReviewRepo(existing: ReviewEntity[] = []): IReviewRepository {
  return {
    create: jest.fn(async (data) => ({
      id: 'r1',
      ...data,
      images: data.images ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    findByOrderAndUser: jest.fn(async () => existing),
    getStats: jest.fn(async () => ({ averageRating: 4.5, total: 2, distribution: [] })),
    findByProduct: jest.fn(),
    findById: jest.fn(),
    findForSellerProducts: jest.fn(),
    setSellerResponse: jest.fn(),
  } as unknown as IReviewRepository;
}

function makeOrderRepo(order: OrderEntity | null): IOrderRepository {
  return { findById: jest.fn(async () => order) } as unknown as IOrderRepository;
}

function makeProductRepo(): IProductRepository {
  return { updateRating: jest.fn(async () => undefined) } as unknown as IProductRepository;
}

describe('ReviewUseCase.createReview', () => {
  const input = {
    productId: PRODUCT,
    orderId: 'o1',
    rating: 5,
    title: 'Super',
    comment: 'Très bon produit',
  };

  it('rejects a review on an order that is not delivered', async () => {
    const useCase = new ReviewUseCase(
      makeReviewRepo(),
      makeOrderRepo(buildOrder({ status: OrderStatus.SHIPPED })),
      makeProductRepo(),
    );
    await expect(useCase.createReview('u1', input)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a review on someone else's order", async () => {
    const useCase = new ReviewUseCase(
      makeReviewRepo(),
      makeOrderRepo(buildOrder()),
      makeProductRepo(),
    );
    await expect(useCase.createReview('intruder', input)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('rejects when the product is not part of the order', async () => {
    const useCase = new ReviewUseCase(
      makeReviewRepo(),
      makeOrderRepo(buildOrder()),
      makeProductRepo(),
    );
    await expect(
      useCase.createReview('u1', { ...input, productId: 'other' }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects a duplicate review for the same product/order', async () => {
    const existing = [{ productId: PRODUCT } as ReviewEntity];
    const useCase = new ReviewUseCase(
      makeReviewRepo(existing),
      makeOrderRepo(buildOrder()),
      makeProductRepo(),
    );
    await expect(useCase.createReview('u1', input)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('creates the review and resyncs the product rating', async () => {
    const reviewRepo = makeReviewRepo();
    const productRepo = makeProductRepo();
    const useCase = new ReviewUseCase(reviewRepo, makeOrderRepo(buildOrder()), productRepo);

    const dto = await useCase.createReview('u1', input);

    expect(dto.rating).toBe(5);
    expect(reviewRepo.create).toHaveBeenCalledTimes(1);
    expect(productRepo.updateRating).toHaveBeenCalledWith(PRODUCT, 4.5, 2);
  });
});
