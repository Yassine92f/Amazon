import { UserRole, UserStatus, OrderStatus, PaymentStatus, PaymentMethod } from '@ecommerce/shared';
import { ProductEntity } from '../../src/domain/entities/Product';
import { UserEntity } from '../../src/domain/entities/User';
import { CouponEntity } from '../../src/domain/entities/Coupon';
import { OrderEntity } from '../../src/domain/entities/Order';
import { PaymentEntity } from '../../src/domain/entities/Payment';
import { IProductRepository } from '../../src/domain/repositories/IProductRepository';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';
import { ICouponRepository } from '../../src/domain/repositories/ICouponRepository';
import { IOrderRepository } from '../../src/domain/repositories/IOrderRepository';
import { ICartRepository } from '../../src/domain/repositories/ICartRepository';
import { IPaymentRepository } from '../../src/domain/repositories/IPaymentRepository';
import { ISellerRepository } from '../../src/domain/repositories/ISellerRepository';
import { IPaymentService } from '../../src/domain/services/IPaymentService';
import { IEmailService } from '../../src/domain/services/IEmailService';
import { CartItemEntity, CartOwner } from '../../src/domain/entities/Cart';
import { SellerEntity } from '../../src/domain/entities/Seller';

// --- Builders -------------------------------------------------------------

export function buildProduct(overrides: Partial<ProductEntity> = {}): ProductEntity {
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
        price: 30,
        stock: 10,
        attributes: {},
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

export function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-1',
    email: 'buyer@example.com',
    password: 'hashed',
    firstName: 'Jane',
    lastName: 'Doe',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    addresses: [
      {
        id: 'addr-1',
        label: 'Home',
        street: '1 rue de Paris',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
        isDefault: true,
      },
    ],
    preferences: {
      language: 'fr',
      currency: 'EUR',
      notifications: {
        email: true,
        push: true,
        orderUpdates: true,
        promotions: false,
        priceDrops: false,
      },
    },
    emailVerified: true,
    failedLoginAttempts: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export function buildCoupon(overrides: Partial<CouponEntity> = {}): CouponEntity {
  return {
    id: 'coupon-1',
    code: 'SAVE10',
    discountType: 'percentage',
    discountValue: 10,
    usedCount: 0,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export function buildPayment(overrides: Partial<PaymentEntity> = {}): PaymentEntity {
  return {
    id: 'pay-1',
    orderId: 'order-1',
    userId: 'user-1',
    amount: 50,
    currency: 'eur',
    status: PaymentStatus.SUCCEEDED,
    method: PaymentMethod.CARD,
    stripePaymentIntentId: 'pi_123',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

// --- Mock repositories ----------------------------------------------------

export function makeProductRepo(products: ProductEntity[]): IProductRepository {
  const map = new Map(products.map((p) => [p.id, p]));
  const findVariant = (pid: string, vid: string) =>
    map.get(pid)?.variants.find((v) => v.id === vid);
  return {
    findById: jest.fn(async (id: string) => map.get(id) ?? null),
    findBySlug: jest.fn(),
    slugExists: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    search: jest.fn(),
    countBySeller: jest.fn(),
    findIdsBySeller: jest.fn(async (sellerId: string) =>
      products.filter((p) => p.sellerId === sellerId).map((p) => p.id),
    ),
    countByCategory: jest.fn(),
    decrementVariantStock: jest.fn(async (pid: string, vid: string, qty: number) => {
      const v = findVariant(pid, vid);
      if (!v || v.stock < qty) return false;
      v.stock -= qty;
      return true;
    }),
    incrementVariantStock: jest.fn(async (pid: string, vid: string, qty: number) => {
      const v = findVariant(pid, vid);
      if (v) v.stock += qty;
    }),
    incrementTotalSold: jest.fn(async (pid: string, qty: number) => {
      const p = map.get(pid);
      if (p) p.totalSold += qty;
    }),
  } as IProductRepository;
}

export function makeUserRepo(user: UserEntity): IUserRepository {
  return {
    findById: jest.fn(async (id: string) => (id === user.id ? user : null)),
    findByEmail: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    updatePassword: jest.fn(),
    updateLastLogin: jest.fn(),
    findMany: jest.fn(),
    deleteById: jest.fn(),
    setResetToken: jest.fn(),
    findByResetToken: jest.fn(),
    clearResetToken: jest.fn(),
    setEmailVerificationToken: jest.fn(),
    findByEmailVerificationToken: jest.fn(),
    markEmailVerified: jest.fn(),
    incrementFailedLoginAttempts: jest.fn(),
    lockAccount: jest.fn(),
    resetFailedLoginAttempts: jest.fn(),
    addAddress: jest.fn(),
    updateAddress: jest.fn(),
    deleteAddress: jest.fn(),
    updatePreferences: jest.fn(),
  } as unknown as IUserRepository;
}

export function makeCouponRepo(coupons: CouponEntity[]): ICouponRepository {
  const map = new Map(coupons.map((c) => [c.code, c]));
  return {
    findByCode: jest.fn(async (code: string) => map.get(code.toUpperCase().trim()) ?? null),
    incrementUsage: jest.fn(async () => undefined),
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(async () => ({ coupons: [...map.values()], total: map.size })),
    updateById: jest.fn(),
    deleteById: jest.fn(async () => undefined),
    codeExists: jest.fn(async (code: string) => map.has(code.toUpperCase().trim())),
  } as unknown as ICouponRepository;
}

export function makeOrderRepo(): IOrderRepository {
  const orders = new Map<string, OrderEntity>();
  let seq = 0;
  return {
    create: jest.fn(async (data) => {
      const id = `order-${++seq}`;
      const now = new Date();
      const order: OrderEntity = {
        id,
        status: OrderStatus.PENDING,
        createdAt: now,
        updatedAt: now,
        ...data,
      };
      orders.set(id, order);
      return order;
    }),
    findById: jest.fn(async (id: string) => orders.get(id) ?? null),
    findByUser: jest.fn(async (userId: string) => {
      const all = [...orders.values()].filter((o) => o.userId === userId);
      return { orders: all, total: all.length };
    }),
    findByProductIds: jest.fn(async (productIds: string[]) => {
      const set = new Set(productIds);
      const all = [...orders.values()].filter((o) => o.items.some((i) => set.has(i.productId)));
      return { orders: all, total: all.length };
    }),
    updateById: jest.fn(async (id: string, data) => {
      const order = orders.get(id);
      if (!order) return null;
      Object.assign(order, data, { updatedAt: new Date() });
      return order;
    }),
    countByUser: jest.fn(async () => orders.size),
  };
}

export function buildSeller(overrides: Partial<SellerEntity> = {}): SellerEntity {
  return {
    id: 'seller-1',
    userId: 'seller-user-1',
    shopName: 'AudioVault',
    shopSlug: 'audiovault',
    description: 'Premium audio gear',
    rating: 4.7,
    reviewCount: 30,
    totalSales: 120,
    totalRevenue: 5000,
    isVerified: true,
    commissionRate: 0.1,
    joinedAt: new Date('2026-01-01'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export function makeSellerRepo(sellers: SellerEntity[] = [buildSeller()]): ISellerRepository {
  const byUser = new Map(sellers.map((s) => [s.userId, s]));
  const byId = new Map(sellers.map((s) => [s.id, s]));
  return {
    findById: jest.fn(async (id: string) => byId.get(id) ?? null),
    findByUserId: jest.fn(async (userId: string) => byUser.get(userId) ?? null),
    findBySlug: jest.fn(),
    shopNameExists: jest.fn(),
    create: jest.fn(),
    updateByUserId: jest.fn(),
    setVerified: jest.fn(),
    findMany: jest.fn(),
  } as unknown as ISellerRepository;
}

export function makeCartRepo(): ICartRepository {
  const store = new Map<string, CartItemEntity[]>();
  const key = (o: CartOwner) => `${o.type}:${o.id}`;
  return {
    get: jest.fn(async (o: CartOwner) => {
      const items = store.get(key(o));
      return items ? { owner: o, items } : null;
    }),
    save: jest.fn(async (o: CartOwner, items: CartItemEntity[]) => {
      store.set(key(o), items);
      return { owner: o, items };
    }),
    clear: jest.fn(async (o: CartOwner) => {
      store.delete(key(o));
    }),
  };
}

export function makePaymentRepo(payments: PaymentEntity[] = []): IPaymentRepository {
  const map = new Map(payments.map((p) => [p.id, p]));
  let seq = payments.length;
  return {
    create: jest.fn(async (data) => {
      const id = `pay-${++seq}`;
      const now = new Date();
      const payment: PaymentEntity = { id, createdAt: now, updatedAt: now, ...data };
      map.set(id, payment);
      return payment;
    }),
    findById: jest.fn(async (id: string) => map.get(id) ?? null),
    findByOrderId: jest.fn(
      async (orderId: string) => [...map.values()].find((p) => p.orderId === orderId) ?? null,
    ),
    findByPaymentIntentId: jest.fn(
      async (pi: string) => [...map.values()].find((p) => p.stripePaymentIntentId === pi) ?? null,
    ),
    updateById: jest.fn(async (id: string, data) => {
      const payment = map.get(id);
      if (!payment) return null;
      Object.assign(payment, data, { updatedAt: new Date() });
      return payment;
    }),
  };
}

export function makeEmailService(): IEmailService {
  return {
    sendPasswordReset: jest.fn(async () => undefined),
    sendWelcome: jest.fn(async () => undefined),
    sendEmailVerification: jest.fn(async () => undefined),
    sendOrderConfirmation: jest.fn(async () => undefined),
  };
}

export function makePaymentService(overrides: Partial<IPaymentService> = {}): IPaymentService {
  return {
    createPaymentIntent: jest.fn(async () => ({ id: 'pi_123', clientSecret: 'secret_123' })),
    retrievePaymentIntent: jest.fn(async (id: string) => ({ id, status: 'succeeded' })),
    refund: jest.fn(async (_pi: string, amount?: number) => ({
      id: 're_1',
      status: 'succeeded',
      amount: amount ?? 5000,
    })),
    constructEvent: jest.fn(),
    ...overrides,
  };
}
