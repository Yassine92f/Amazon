import crypto from 'crypto';
import {
  Order,
  OrderSummary,
  OrderStatus,
  DeliveryType,
  CreateOrderRequest,
  PaginatedResponse,
  SellerOrderDto,
  UserRole,
} from '@ecommerce/shared';
import { IOrderRepository, OrderListFilters } from '../../domain/repositories/IOrderRepository';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ISellerRepository } from '../../domain/repositories/ISellerRepository';
import { ICartRepository } from '../../domain/repositories/ICartRepository';
import { OrderEntity, OrderItemEntity } from '../../domain/entities/Order';
import { CouponUseCase } from './CouponUseCase';

const SHIPPING_COST: Record<DeliveryType, number> = {
  [DeliveryType.HOME]: 4.99,
  [DeliveryType.PICKUP_POINT]: 2.99,
};
const FREE_SHIPPING_THRESHOLD = 50;

// Allowed forward transitions for seller/admin-driven status updates.
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

export interface OrderHistoryFilters {
  page: number;
  limit: number;
  status?: OrderStatus;
  fromDate?: Date;
  toDate?: Date;
}

export class OrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private userRepo: IUserRepository,
    private cartRepo: ICartRepository,
    private couponUseCase: CouponUseCase,
    private sellerRepo: ISellerRepository,
  ) {}

  async createOrder(userId: string, input: CreateOrderRequest): Promise<Order> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new OrderError(404, 'User not found');

    const address = user.addresses.find((a) => a.id === input.shippingAddressId);
    if (!address) throw new OrderError(400, 'Invalid shipping address');

    if (!input.items?.length) throw new OrderError(400, 'Order must contain at least one item');

    // Validate every line against live product data and snapshot name/price.
    const orderItems: OrderItemEntity[] = [];
    for (const line of input.items) {
      if (line.quantity < 1) throw new OrderError(400, 'Quantity must be at least 1');
      const product = await this.productRepo.findById(line.productId);
      if (!product || !product.isActive) {
        throw new OrderError(404, `Product ${line.productId} is unavailable`);
      }
      const variant = product.variants.find((v) => v.id === line.variantId);
      if (!variant) throw new OrderError(404, `Variant not found for ${product.name}`);
      if (variant.stock < line.quantity) {
        throw new OrderError(409, `Insufficient stock for ${product.name} — ${variant.name}`);
      }
      const unitPrice = variant.price;
      orderItems.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        quantity: line.quantity,
        unitPrice,
        totalPrice: Math.round(unitPrice * line.quantity * 100) / 100,
      });
    }

    const subtotal = Math.round(orderItems.reduce((s, i) => s + i.totalPrice, 0) * 100) / 100;
    const shippingCost =
      subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST[input.deliveryType];

    // Coupon (server-side validated — never trust a client-provided discount).
    let discountAmount = 0;
    let couponCode: string | undefined;
    let couponId: string | undefined;
    if (input.couponCode) {
      const { coupon, discount, validation } = await this.couponUseCase.evaluate(
        input.couponCode,
        subtotal,
      );
      if (!validation.valid || !coupon) {
        throw new OrderError(400, validation.message ?? 'Invalid coupon');
      }
      discountAmount = discount;
      couponCode = coupon.code;
      couponId = coupon.id;
    }

    const totalAmount = Math.max(
      0,
      Math.round((subtotal + shippingCost - discountAmount) * 100) / 100,
    );

    // Reserve stock atomically with rollback if any line can no longer be satisfied.
    const decremented: { productId: string; variantId: string; quantity: number }[] = [];
    for (const it of orderItems) {
      const ok = await this.productRepo.decrementVariantStock(
        it.productId,
        it.variantId,
        it.quantity,
      );
      if (!ok) {
        await this.restock(decremented);
        throw new OrderError(409, `Insufficient stock for ${it.productName} — ${it.variantName}`);
      }
      decremented.push({ productId: it.productId, variantId: it.variantId, quantity: it.quantity });
    }

    let order: OrderEntity;
    try {
      order = await this.orderRepo.create({
        userId,
        orderNumber: this.generateOrderNumber(),
        items: orderItems,
        subtotal,
        shippingCost,
        discountAmount,
        couponCode,
        totalAmount,
        deliveryType: input.deliveryType,
        shippingAddress: {
          street: address.street,
          city: address.city,
          postalCode: address.postalCode,
          country: address.country,
        },
      });
    } catch (err) {
      await this.restock(decremented);
      throw err;
    }

    // Best-effort post-creation side effects.
    for (const it of orderItems) {
      await this.productRepo.incrementTotalSold(it.productId, it.quantity);
    }
    if (couponId) await this.couponUseCase.markUsed(couponId);
    await this.cartRepo.clear({ type: 'user', id: userId });

    return this.toDto(order);
  }

  async getMyOrders(
    userId: string,
    filters: OrderHistoryFilters,
  ): Promise<PaginatedResponse<OrderSummary>> {
    const repoFilters: OrderListFilters = {
      page: filters.page,
      limit: filters.limit,
      status: filters.status,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    };
    const { orders, total } = await this.orderRepo.findByUser(userId, repoFilters);
    const totalPages = Math.ceil(total / filters.limit);
    return {
      items: orders.map((o) => this.toSummary(o)),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
      hasNext: filters.page < totalPages,
      hasPrev: filters.page > 1,
    };
  }

  async getOrderById(userId: string, role: string, orderId: string): Promise<Order> {
    const order = await this.requireOrder(orderId);
    if (order.userId !== userId && role !== UserRole.ADMIN) {
      throw new OrderError(403, 'You cannot access this order');
    }
    return this.toDto(order);
  }

  // Orders that include at least one of the seller's products. Each order is
  // narrowed to the seller's own line items so a vendor never sees another
  // seller's lines in a shared (multi-vendor) order.
  async getSellerOrders(
    sellerUserId: string,
    filters: OrderHistoryFilters,
  ): Promise<PaginatedResponse<SellerOrderDto>> {
    const productIds = await this.resolveSellerProductIds(sellerUserId);
    if (productIds.length === 0) {
      return this.emptyPage(filters);
    }

    const idSet = new Set(productIds);
    const { orders, total } = await this.orderRepo.findByProductIds(productIds, {
      page: filters.page,
      limit: filters.limit,
      status: filters.status,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    });
    const totalPages = Math.ceil(total / filters.limit);
    return {
      items: orders.map((o) => this.toSellerDto(o, idSet)),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
      hasNext: filters.page < totalPages,
      hasPrev: filters.page > 1,
    };
  }

  async updateStatus(
    userId: string,
    role: string,
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    if (role !== UserRole.ADMIN && role !== UserRole.SELLER) {
      throw new OrderError(403, 'Only sellers or admins can update order status');
    }
    const order = await this.requireOrder(orderId);

    // A seller may only act on orders that contain one of their own products.
    if (role === UserRole.SELLER) {
      const productIds = new Set(await this.resolveSellerProductIds(userId));
      const ownsLine = order.items.some((i) => productIds.has(i.productId));
      if (!ownsLine) throw new OrderError(403, 'This order does not contain your products');
    }

    const allowed = STATUS_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      throw new OrderError(400, `Cannot change status from ${order.status} to ${status}`);
    }

    const update = this.statusUpdate(status);
    if (status === OrderStatus.CANCELLED) {
      await this.restock(
        order.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      );
    }

    const updated = await this.orderRepo.updateById(orderId, update);
    if (!updated) throw new OrderError(500, 'Failed to update order');
    return this.toDto(updated);
  }

  async cancelOrder(userId: string, orderId: string): Promise<Order> {
    const order = await this.requireOrder(orderId);
    if (order.userId !== userId) throw new OrderError(403, 'You cannot cancel this order');
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new OrderError(400, 'Only pending or confirmed orders can be cancelled');
    }

    await this.restock(
      order.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    );
    const updated = await this.orderRepo.updateById(orderId, {
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date(),
    });
    if (!updated) throw new OrderError(500, 'Failed to cancel order');
    return this.toDto(updated);
  }

  private statusUpdate(status: OrderStatus): { status: OrderStatus } & Record<string, unknown> {
    const update: { status: OrderStatus } & Record<string, unknown> = { status };
    if (status === OrderStatus.SHIPPED) update.shippedAt = new Date();
    if (status === OrderStatus.DELIVERED) update.deliveredAt = new Date();
    if (status === OrderStatus.CANCELLED) update.cancelledAt = new Date();
    return update;
  }

  private async restock(
    items: { productId: string; variantId: string; quantity: number }[],
  ): Promise<void> {
    for (const it of items) {
      await this.productRepo.incrementVariantStock(it.productId, it.variantId, it.quantity);
    }
  }

  private async requireOrder(orderId: string): Promise<OrderEntity> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new OrderError(404, 'Order not found');
    return order;
  }

  // Maps an authenticated seller user to the ids of every product they own.
  private async resolveSellerProductIds(sellerUserId: string): Promise<string[]> {
    const seller = await this.sellerRepo.findByUserId(sellerUserId);
    if (!seller) throw new OrderError(403, 'You do not have a seller account');
    return this.productRepo.findIdsBySeller(seller.id);
  }

  private emptyPage(filters: OrderHistoryFilters): PaginatedResponse<SellerOrderDto> {
    return {
      items: [],
      total: 0,
      page: filters.page,
      limit: filters.limit,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    };
  }

  private toSellerDto(o: OrderEntity, sellerProductIds: Set<string>): SellerOrderDto {
    const items = o.items
      .filter((i) => sellerProductIds.has(i.productId))
      .map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        productName: i.productName,
        variantName: i.variantName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      }));
    const sellerSubtotal = Math.round(items.reduce((s, i) => s + i.totalPrice, 0) * 100) / 100;
    return {
      _id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      deliveryType: o.deliveryType,
      shippingAddress: o.shippingAddress,
      items,
      sellerSubtotal,
      sellerItemCount: items.reduce((s, i) => s + i.quantity, 0),
      buyerOrderTotal: o.totalAmount,
      createdAt: o.createdAt.toISOString(),
      paidAt: o.paidAt?.toISOString(),
      shippedAt: o.shippedAt?.toISOString(),
      deliveredAt: o.deliveredAt?.toISOString(),
      cancelledAt: o.cancelledAt?.toISOString(),
    };
  }

  private generateOrderNumber(): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate(),
    ).padStart(2, '0')}`;
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${datePart}-${rand}`;
  }

  private toDto(o: OrderEntity): Order {
    return {
      _id: o.id,
      userId: o.userId,
      orderNumber: o.orderNumber,
      items: o.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        productName: i.productName,
        variantName: i.variantName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
      subtotal: o.subtotal,
      shippingCost: o.shippingCost,
      discountAmount: o.discountAmount,
      couponCode: o.couponCode,
      totalAmount: o.totalAmount,
      status: o.status,
      deliveryType: o.deliveryType,
      shippingAddress: o.shippingAddress,
      paymentIntentId: o.paymentIntentId,
      paidAt: o.paidAt?.toISOString(),
      shippedAt: o.shippedAt?.toISOString(),
      deliveredAt: o.deliveredAt?.toISOString(),
      cancelledAt: o.cancelledAt?.toISOString(),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    };
  }

  private toSummary(o: OrderEntity): OrderSummary {
    return {
      _id: o.id,
      orderNumber: o.orderNumber,
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    };
  }
}

export class OrderError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, OrderError.prototype);
  }
}
