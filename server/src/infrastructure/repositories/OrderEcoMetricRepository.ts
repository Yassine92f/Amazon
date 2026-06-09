import mongoose from 'mongoose';
import { IOrderEcoMetricRepository } from '../../domain/repositories/IOrderEcoMetricRepository';
import { OrderEcoMetricEntity } from '../../domain/entities/OrderEcoMetric';
import { OrderEcoMetricModel, OrderEcoMetricDocument } from '../database/models/OrderEcoMetric';

export class OrderEcoMetricRepository implements IOrderEcoMetricRepository {
  async upsert(metric: OrderEcoMetricEntity): Promise<OrderEcoMetricEntity> {
    if (!mongoose.isValidObjectId(metric.orderId)) {
      throw new Error('Invalid order id');
    }
    const doc = await OrderEcoMetricModel.findOneAndUpdate(
      { orderId: new mongoose.Types.ObjectId(metric.orderId) },
      {
        orderId: new mongoose.Types.ObjectId(metric.orderId),
        optionId: metric.optionId,
        co2EmittedKg: metric.co2EmittedKg,
        co2SavedKg: metric.co2SavedKg,
        treeDonationCents: metric.treeDonationCents,
        treesPlanted: metric.treesPlanted,
        recordedAt: metric.recordedAt,
      },
      { upsert: true, new: true },
    );
    return this.toEntity(doc);
  }

  async findByOrderId(orderId: string): Promise<OrderEcoMetricEntity | null> {
    if (!mongoose.isValidObjectId(orderId)) return null;
    const doc = await OrderEcoMetricModel.findOne({
      orderId: new mongoose.Types.ObjectId(orderId),
    });
    return doc ? this.toEntity(doc) : null;
  }

  async sumSavedByOrderIds(
    orderIds: string[],
  ): Promise<{ totalSavedKg: number; orderCount: number }> {
    const validIds = orderIds.filter((id) => mongoose.isValidObjectId(id));
    if (validIds.length === 0) return { totalSavedKg: 0, orderCount: 0 };

    const result = await OrderEcoMetricModel.aggregate<{
      _id: null;
      total: number;
      count: number;
    }>([
      {
        $match: {
          orderId: { $in: validIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
      { $group: { _id: null, total: { $sum: '$co2SavedKg' }, count: { $sum: 1 } } },
    ]);

    const first = result[0];
    return {
      totalSavedKg: first?.total ?? 0,
      orderCount: first?.count ?? 0,
    };
  }

  async countTreesPlanted(): Promise<{ totalTrees: number; totalDonationCents: number }> {
    const result = await OrderEcoMetricModel.aggregate<{
      _id: null;
      trees: number;
      cents: number;
    }>([
      { $match: { treesPlanted: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          trees: { $sum: '$treesPlanted' },
          cents: { $sum: '$treeDonationCents' },
        },
      },
    ]);
    const first = result[0];
    return {
      totalTrees: first?.trees ?? 0,
      totalDonationCents: first?.cents ?? 0,
    };
  }

  private toEntity(doc: OrderEcoMetricDocument): OrderEcoMetricEntity {
    return {
      orderId: doc.orderId.toString(),
      optionId: doc.optionId,
      co2EmittedKg: doc.co2EmittedKg,
      co2SavedKg: doc.co2SavedKg,
      treeDonationCents: doc.treeDonationCents ?? 0,
      treesPlanted: doc.treesPlanted ?? 0,
      recordedAt: doc.recordedAt,
    };
  }
}
