import { DisputeStatus, DisputeReason } from '@ecommerce/shared';

export interface DisputeEntity {
  id: string;
  orderId: string;
  userId: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
