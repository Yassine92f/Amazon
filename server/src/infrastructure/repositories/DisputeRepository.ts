import mongoose from 'mongoose';
import { DisputeStatus } from '@ecommerce/shared';
import { DisputeEntity } from '../../domain/entities/Dispute';
import {
  IDisputeRepository,
  CreateDisputeData,
  DisputeListFilters,
  DisputeListResult,
  UpdateDisputeData,
} from '../../domain/repositories/IDisputeRepository';
import { DisputeModel, DisputeDocument } from '../database/models/Dispute';

export class DisputeRepository implements IDisputeRepository {
  async create(data: CreateDisputeData): Promise<DisputeEntity> {
    const doc = await DisputeModel.create({
      orderId: new mongoose.Types.ObjectId(data.orderId),
      userId: new mongoose.Types.ObjectId(data.userId),
      reason: data.reason,
      description: data.description,
      status: DisputeStatus.OPEN,
    });
    return this.toEntity(doc);
  }

  async findById(id: string): Promise<DisputeEntity | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await DisputeModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findMany(filters: DisputeListFilters): Promise<DisputeListResult> {
    const query: Record<string, unknown> = {};
    if (filters.status) query.status = filters.status;
    if (filters.userId) query.userId = new mongoose.Types.ObjectId(filters.userId);

    const skip = (filters.page - 1) * filters.limit;
    const [docs, total] = await Promise.all([
      DisputeModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(filters.limit),
      DisputeModel.countDocuments(query),
    ]);
    return { disputes: docs.map((d) => this.toEntity(d)), total };
  }

  async findOpenByOrder(orderId: string): Promise<DisputeEntity | null> {
    if (!mongoose.isValidObjectId(orderId)) return null;
    const doc = await DisputeModel.findOne({
      orderId: new mongoose.Types.ObjectId(orderId),
      status: { $in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
    });
    return doc ? this.toEntity(doc) : null;
  }

  async updateById(id: string, data: UpdateDisputeData): Promise<DisputeEntity | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await DisputeModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    return doc ? this.toEntity(doc) : null;
  }

  private toEntity(doc: DisputeDocument): DisputeEntity {
    return {
      id: (doc._id as mongoose.Types.ObjectId).toString(),
      orderId: doc.orderId.toString(),
      userId: doc.userId.toString(),
      reason: doc.reason,
      description: doc.description,
      status: doc.status,
      resolution: doc.resolution,
      resolvedAt: doc.resolvedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
