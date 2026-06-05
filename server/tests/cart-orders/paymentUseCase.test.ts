import { DeliveryType, OrderStatus, PaymentStatus, UserRole } from '@ecommerce/shared';
import { PaymentUseCase } from '../../src/application/use-cases/PaymentUseCase';
import { IOrderRepository } from '../../src/domain/repositories/IOrderRepository';
import { buildPayment, makeOrderRepo, makePaymentRepo, makePaymentService } from './helpers';

async function seedOrder(orderRepo: IOrderRepository, overrides = {}) {
  return orderRepo.create({
    userId: 'user-1',
    orderNumber: 'ORD-1',
    items: [],
    subtotal: 50,
    shippingCost: 0,
    discountAmount: 0,
    totalAmount: 50,
    deliveryType: DeliveryType.HOME,
    shippingAddress: { street: 's', city: 'c', postalCode: 'p', country: 'FR' },
    ...overrides,
  });
}

describe('PaymentUseCase.createIntent', () => {
  it('rejects an order that is not owned by the user', async () => {
    const orderRepo = makeOrderRepo();
    const order = await seedOrder(orderRepo);
    const useCase = new PaymentUseCase(makePaymentService(), makePaymentRepo(), orderRepo);
    await expect(useCase.createIntent('intruder', order.id)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('rejects an order that is not pending', async () => {
    const orderRepo = makeOrderRepo();
    const order = await seedOrder(orderRepo);
    await orderRepo.updateById(order.id, { status: OrderStatus.CONFIRMED });
    const useCase = new PaymentUseCase(makePaymentService(), makePaymentRepo(), orderRepo);
    await expect(useCase.createIntent('user-1', order.id)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('creates an intent with the server-side amount and records a processing payment', async () => {
    const orderRepo = makeOrderRepo();
    const order = await seedOrder(orderRepo);
    const service = makePaymentService();
    const paymentRepo = makePaymentRepo();
    const useCase = new PaymentUseCase(service, paymentRepo, orderRepo);

    const result = await useCase.createIntent('user-1', order.id);

    expect(result.clientSecret).toBe('secret_123');
    expect(service.createPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 5000, currency: 'eur' }),
    );
    const payment = await paymentRepo.findByOrderId(order.id);
    expect(payment?.status).toBe(PaymentStatus.PROCESSING);
  });
});

describe('PaymentUseCase.confirmPayment', () => {
  it('confirms a pending order when Stripe reports the intent succeeded', async () => {
    const orderRepo = makeOrderRepo();
    const order = await seedOrder(orderRepo);
    const paymentRepo = makePaymentRepo([
      buildPayment({
        orderId: order.id,
        status: PaymentStatus.PROCESSING,
        stripePaymentIntentId: 'pi_123',
      }),
    ]);
    const service = makePaymentService(); // retrievePaymentIntent → 'succeeded'
    const useCase = new PaymentUseCase(service, paymentRepo, orderRepo);

    const result = await useCase.confirmPayment('user-1', order.id);

    expect(result).toEqual({ status: OrderStatus.CONFIRMED, paid: true });
    expect((await orderRepo.findById(order.id))?.status).toBe(OrderStatus.CONFIRMED);
  });

  it('does not confirm while the intent is still processing', async () => {
    const orderRepo = makeOrderRepo();
    const order = await seedOrder(orderRepo);
    const paymentRepo = makePaymentRepo([
      buildPayment({
        orderId: order.id,
        stripePaymentIntentId: 'pi_p',
        status: PaymentStatus.PROCESSING,
      }),
    ]);
    const service = makePaymentService({
      retrievePaymentIntent: jest.fn(async (id: string) => ({ id, status: 'processing' })),
    });
    const useCase = new PaymentUseCase(service, paymentRepo, orderRepo);

    const result = await useCase.confirmPayment('user-1', order.id);
    expect(result.paid).toBe(false);
    expect((await orderRepo.findById(order.id))?.status).toBe(OrderStatus.PENDING);
  });

  it('rejects confirming an order the user does not own', async () => {
    const orderRepo = makeOrderRepo();
    const order = await seedOrder(orderRepo);
    const useCase = new PaymentUseCase(makePaymentService(), makePaymentRepo(), orderRepo);
    await expect(useCase.confirmPayment('intruder', order.id)).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

describe('PaymentUseCase.handleWebhook', () => {
  it('confirms the order on payment_intent.succeeded and is idempotent', async () => {
    const orderRepo = makeOrderRepo();
    const order = await seedOrder(orderRepo);
    const paymentRepo = makePaymentRepo([
      buildPayment({
        orderId: order.id,
        status: PaymentStatus.PROCESSING,
        stripePaymentIntentId: 'pi_123',
      }),
    ]);
    const service = makePaymentService({
      constructEvent: jest.fn(() => ({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123' } },
      })),
    });
    const useCase = new PaymentUseCase(service, paymentRepo, orderRepo);

    await useCase.handleWebhook(Buffer.from('{}'), 'sig');
    let updated = await orderRepo.findById(order.id);
    expect(updated?.status).toBe(OrderStatus.CONFIRMED);
    expect(updated?.paidAt).toBeDefined();
    expect((await paymentRepo.findByPaymentIntentId('pi_123'))?.status).toBe(
      PaymentStatus.SUCCEEDED,
    );

    // second delivery must not change anything
    await useCase.handleWebhook(Buffer.from('{}'), 'sig');
    updated = await orderRepo.findById(order.id);
    expect(updated?.status).toBe(OrderStatus.CONFIRMED);
  });

  it('throws 400 on an invalid signature', async () => {
    const service = makePaymentService({
      constructEvent: jest.fn(() => {
        throw new Error('bad signature');
      }),
    });
    const useCase = new PaymentUseCase(service, makePaymentRepo(), makeOrderRepo());
    await expect(useCase.handleWebhook(Buffer.from('{}'), 'sig')).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

describe('PaymentUseCase.refund', () => {
  it('forbids non-admins', async () => {
    const useCase = new PaymentUseCase(makePaymentService(), makePaymentRepo(), makeOrderRepo());
    await expect(useCase.refund(UserRole.USER, { paymentId: 'pay-1' })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('issues a full refund and marks the order refunded', async () => {
    const orderRepo = makeOrderRepo();
    const order = await seedOrder(orderRepo);
    const paymentRepo = makePaymentRepo([
      buildPayment({ id: 'pay-1', orderId: order.id, amount: 50, status: PaymentStatus.SUCCEEDED }),
    ]);
    const service = makePaymentService();
    const useCase = new PaymentUseCase(service, paymentRepo, orderRepo);

    const result = await useCase.refund(UserRole.ADMIN, { paymentId: 'pay-1' });
    expect(result.refundedAmount).toBe(50);
    expect((await orderRepo.findById(order.id))?.status).toBe(OrderStatus.REFUNDED);
    expect((await paymentRepo.findById('pay-1'))?.status).toBe(PaymentStatus.REFUNDED);
  });
});
