import mongoose from 'mongoose';
import {
  IOrderRepository,
  CreateOrderData,
  OrderListFilters,
  OrderListResult,
  UpdateOrderData,
} from '../../domain/repositories/IOrderRepository';
import { OrderEntity, OrderItemEntity } from '../../domain/entities/Order';
import { OrderModel, OrderDocument, OrderItemSubdoc } from '../database/models/Order';

export class OrderRepository implements IOrderRepository {
  async create(data: CreateOrderData): Promise<OrderEntity> {
    const doc = await OrderModel.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      orderNumber: data.orderNumber,
      items: data.items.map((i) => ({
        productId: new mongoose.Types.ObjectId(i.productId),
        variantId: new mongoose.Types.ObjectId(i.variantId),
        productName: i.productName,
        variantName: i.variantName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
      subtotal: data.subtotal,
      shippingCost: data.shippingCost,
      discountAmount: data.discountAmount,
      couponCode: data.couponCode,
      totalAmount: data.totalAmount,
      deliveryType: data.deliveryType,
      shippingAddress: data.shippingAddress,
    });
    return this.toEntity(doc);
  }

  async findById(id: string): Promise<OrderEntity | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await OrderModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByUser(userId: string, filters: OrderListFilters): Promise<OrderListResult> {
    const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
    if (filters.status) query.status = filters.status;
    if (filters.fromDate || filters.toDate) {
      const createdAt: Record<string, Date> = {};
      if (filters.fromDate) createdAt.$gte = filters.fromDate;
      if (filters.toDate) createdAt.$lte = filters.toDate;
      query.createdAt = createdAt;
    }

    const skip = (filters.page - 1) * filters.limit;
    const [docs, total] = await Promise.all([
      OrderModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(filters.limit),
      OrderModel.countDocuments(query),
    ]);

    return { orders: docs.map((d) => this.toEntity(d)), total };
  }

  async updateById(id: string, data: UpdateOrderData): Promise<OrderEntity | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await OrderModel.findByIdAndUpdate(id, data, { new: true });
    return doc ? this.toEntity(doc) : null;
  }

  async countByUser(userId: string): Promise<number> {
    return OrderModel.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
  }

  private toEntity(doc: OrderDocument): OrderEntity {
    return {
      id: (doc._id as { toString: () => string }).toString(),
      userId: doc.userId.toString(),
      orderNumber: doc.orderNumber,
      items: doc.items.map((i) => this.itemToEntity(i)),
      subtotal: doc.subtotal,
      shippingCost: doc.shippingCost,
      discountAmount: doc.discountAmount,
      couponCode: doc.couponCode,
      totalAmount: doc.totalAmount,
      status: doc.status,
      deliveryType: doc.deliveryType,
      shippingAddress: {
        street: doc.shippingAddress.street,
        city: doc.shippingAddress.city,
        postalCode: doc.shippingAddress.postalCode,
        country: doc.shippingAddress.country,
      },
      paymentIntentId: doc.paymentIntentId,
      paidAt: doc.paidAt,
      shippedAt: doc.shippedAt,
      deliveredAt: doc.deliveredAt,
      cancelledAt: doc.cancelledAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private itemToEntity(i: OrderItemSubdoc): OrderItemEntity {
    return {
      productId: i.productId.toString(),
      variantId: i.variantId.toString(),
      productName: i.productName,
      variantName: i.variantName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
    };
  }
}
