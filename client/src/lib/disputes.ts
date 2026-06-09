import { api } from './api';
import type {
  Dispute,
  DisputeStatus,
  CreateDisputeRequest,
  ResolveDisputeRequest,
} from '@ecommerce/shared';

export type { Dispute, CreateDisputeRequest, ResolveDisputeRequest };
export { DisputeReason, DisputeStatus } from '@ecommerce/shared';

export interface DisputeListResult {
  items: Dispute[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export async function openDispute(input: CreateDisputeRequest): Promise<Dispute> {
  const { data } = await api.post('/disputes', input);
  return data.data;
}

export async function listMyDisputes(
  params: { page?: number; limit?: number } = {},
): Promise<DisputeListResult> {
  const { data } = await api.get('/disputes/mine', { params });
  return data.data;
}

export async function listAllDisputes(
  params: { page?: number; limit?: number; status?: DisputeStatus } = {},
): Promise<DisputeListResult> {
  const { data } = await api.get('/disputes', { params });
  return data.data;
}

export async function resolveDispute(id: string, input: ResolveDisputeRequest): Promise<Dispute> {
  const { data } = await api.patch(`/disputes/${id}`, input);
  return data.data;
}
