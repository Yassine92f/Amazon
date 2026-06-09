import { DisputeStatus, DisputeReason } from '@ecommerce/shared';
import { DisputeEntity } from '../entities/Dispute';

export interface CreateDisputeData {
  orderId: string;
  userId: string;
  reason: DisputeReason;
  description: string;
}

export interface DisputeListFilters {
  page: number;
  limit: number;
  status?: DisputeStatus;
  userId?: string;
}

export interface DisputeListResult {
  disputes: DisputeEntity[];
  total: number;
}

export interface UpdateDisputeData {
  status?: DisputeStatus;
  resolution?: string;
  resolvedAt?: Date;
}

export interface IDisputeRepository {
  create(data: CreateDisputeData): Promise<DisputeEntity>;
  findById(id: string): Promise<DisputeEntity | null>;
  findMany(filters: DisputeListFilters): Promise<DisputeListResult>;
  /** An order can have at most one non-closed dispute at a time. */
  findOpenByOrder(orderId: string): Promise<DisputeEntity | null>;
  updateById(id: string, data: UpdateDisputeData): Promise<DisputeEntity | null>;
}
