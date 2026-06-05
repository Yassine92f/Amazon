import { DeliveryType, OrderStatus, UserRole } from '@ecommerce/shared';
import { OrderUseCase } from '../../src/application/use-cases/OrderUseCase';
import { CouponUseCase } from '../../src/application/use-cases/CouponUseCase';
import {
  buildProduct,
  buildUser,
  buildCoupon,
  makeProductRepo,
  makeUserRepo,
  makeCouponRepo,
  makeOrderRepo,
  makeCartRepo,
  makeSellerRepo,
} from './helpers';

function setup(
  opts: {
    products?: ReturnType<typeof buildProduct>[];
    user?: ReturnType<typeof buildUser>;
    coupons?: ReturnType<typeof buildCoupon>[];
  } = {},
) {
  const products = opts.products ?? [buildProduct()];
  const user = opts.user ?? buildUser();
  const productRepo = makeProductRepo(products);
  const userRepo = makeUserRepo(user);
  const orderRepo = makeOrderRepo();
  const cartRepo = makeCartRepo();
  const couponUseCase = new CouponUseCase(makeCouponRepo(opts.coupons ?? []));
  const sellerRepo = makeSellerRepo();
  const useCase = new OrderUseCase(
    orderRepo,
    productRepo,
    userRepo,
    cartRepo,
    couponUseCase,
    sellerRepo,
  );
  return { useCase, productRepo, userRepo, orderRepo, cartRepo, sellerRepo };
}

const baseInput = {
  items: [{ productId: 'product-1', variantId: 'v1', quantity: 2 }],
  deliveryType: DeliveryType.HOME,
  shippingAddressId: 'addr-1',
};

describe('OrderUseCase.createOrder', () => {
  it("credits the seller's sales count and revenue", async () => {
    const { useCase, sellerRepo } = setup(); // product price 30, sellerId 'seller-1'
    await useCase.createOrder('user-1', baseInput); // qty 2 -> revenue 60
    expect(sellerRepo.incrementSales).toHaveBeenCalledWith('seller-1', 2, 60);
  });

  it('rejects an invalid shipping address', async () => {
    const { useCase } = setup();
    await expect(
      useCase.createOrder('user-1', { ...baseInput, shippingAddressId: 'nope' }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects when stock is insufficient and does not touch stock', async () => {
    const product = buildProduct({ variants: [{ ...buildProduct().variants[0], stock: 1 }] });
    const { useCase, productRepo } = setup({ products: [product] });
    await expect(useCase.createOrder('user-1', baseInput)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(productRepo.decrementVariantStock).not.toHaveBeenCalled();
    expect(product.variants[0].stock).toBe(1);
  });

  it('snapshots the server-side price (ignores any client price) and computes totals', async () => {
    const { useCase, orderRepo, cartRepo } = setup();
    // subtotal = 2 * 30 = 60 -> free shipping (>= 50), no coupon
    const order = await useCase.createOrder('user-1', baseInput);

    expect(order.items[0].unitPrice).toBe(30);
    expect(order.items[0].totalPrice).toBe(60);
    expect(order.subtotal).toBe(60);
    expect(order.shippingCost).toBe(0);
    expect(order.totalAmount).toBe(60);
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(orderRepo.create).toHaveBeenCalledTimes(1);
    expect(cartRepo.clear).toHaveBeenCalledWith({ type: 'user', id: 'user-1' });
  });

  it('adds shipping cost below the free-shipping threshold', async () => {
    const { useCase } = setup();
    const order = await useCase.createOrder('user-1', {
      ...baseInput,
      items: [{ productId: 'product-1', variantId: 'v1', quantity: 1 }], // subtotal 30
    });
    expect(order.shippingCost).toBe(4.99);
    expect(order.totalAmount).toBe(34.99);
  });

  it('applies a valid coupon and rejects an invalid one', async () => {
    const { useCase } = setup({ coupons: [buildCoupon({ code: 'SAVE10', discountValue: 10 })] });
    const order = await useCase.createOrder('user-1', { ...baseInput, couponCode: 'save10' });
    // subtotal 60, 10% -> 6 discount
    expect(order.discountAmount).toBe(6);
    expect(order.couponCode).toBe('SAVE10');
    expect(order.totalAmount).toBe(54);

    const bad = setup();
    await expect(
      bad.useCase.createOrder('user-1', { ...baseInput, couponCode: 'GHOST' }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rolls back reserved stock when a later line cannot be satisfied', async () => {
    // Single variant with stock 1, ordered twice as separate lines: line 1
    // decrements to 0, line 2 fails -> line 1 must be restored.
    const product = buildProduct({ variants: [{ ...buildProduct().variants[0], stock: 1 }] });
    const { useCase, orderRepo } = setup({ products: [product] });
    await expect(
      useCase.createOrder('user-1', {
        ...baseInput,
        items: [
          { productId: 'product-1', variantId: 'v1', quantity: 1 },
          { productId: 'product-1', variantId: 'v1', quantity: 1 },
        ],
      }),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(product.variants[0].stock).toBe(1); // fully restored
    expect(orderRepo.create).not.toHaveBeenCalled();
  });
});

describe('OrderUseCase access control & lifecycle', () => {
  it('forbids reading another user order but allows admin', async () => {
    const { useCase } = setup();
    const order = await useCase.createOrder('user-1', baseInput);
    await expect(useCase.getOrderById('intruder', UserRole.USER, order._id)).rejects.toMatchObject({
      statusCode: 403,
    });
    await expect(
      useCase.getOrderById('intruder', UserRole.ADMIN, order._id),
    ).resolves.toMatchObject({ _id: order._id });
  });

  it('enforces allowed status transitions and restocks on cancel', async () => {
    const product = buildProduct();
    const { useCase } = setup({ products: [product] });
    const order = await useCase.createOrder('user-1', baseInput); // stock 10 -> 8

    // invalid jump pending -> delivered
    await expect(
      useCase.updateStatus('admin-1', UserRole.ADMIN, order._id, OrderStatus.DELIVERED),
    ).rejects.toMatchObject({ statusCode: 400 });

    // a regular user cannot update status
    await expect(
      useCase.updateStatus('user-1', UserRole.USER, order._id, OrderStatus.CONFIRMED),
    ).rejects.toMatchObject({ statusCode: 403 });

    const cancelled = await useCase.updateStatus(
      'admin-1',
      UserRole.ADMIN,
      order._id,
      OrderStatus.CANCELLED,
    );
    expect(cancelled.status).toBe(OrderStatus.CANCELLED);
    expect(product.variants[0].stock).toBe(10); // restocked
  });

  it('lets the owner cancel a pending order but not a shipped one', async () => {
    const { useCase, orderRepo } = setup();
    const order = await useCase.createOrder('user-1', baseInput);

    await expect(useCase.cancelOrder('intruder', order._id)).rejects.toMatchObject({
      statusCode: 403,
    });

    const cancelled = await useCase.cancelOrder('user-1', order._id);
    expect(cancelled.status).toBe(OrderStatus.CANCELLED);

    // force shipped then attempt cancel
    await orderRepo.updateById(order._id, { status: OrderStatus.SHIPPED });
    await expect(useCase.cancelOrder('user-1', order._id)).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
