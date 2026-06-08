import { BaseEntity } from './common';

// Order disputes / claims ("litiges"): a buyer opens one against an order, an
// admin reviews and resolves or rejects it.
export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum DisputeReason {
  NOT_RECEIVED = 'not_received',
  DAMAGED = 'damaged',
  WRONG_ITEM = 'wrong_item',
  NOT_AS_DESCRIBED = 'not_as_described',
  OTHER = 'other',
}

export interface Dispute extends BaseEntity {
  orderId: string;
  orderNumber?: string;
  userId: string;
  userEmail?: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  resolution?: string;
  resolvedAt?: string;
}

export interface CreateDisputeRequest {
  orderId: string;
  reason: DisputeReason;
  description: string;
}

export interface ResolveDisputeRequest {
  status: DisputeStatus.RESOLVED | DisputeStatus.REJECTED | DisputeStatus.UNDER_REVIEW;
  resolution?: string;
}
