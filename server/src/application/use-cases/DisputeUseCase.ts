import { Dispute, DisputeStatus, DisputeReason } from '@ecommerce/shared';
import { IDisputeRepository } from '../../domain/repositories/IDisputeRepository';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { DisputeEntity } from '../../domain/entities/Dispute';

export interface OpenDisputeInput {
  orderId: string;
  reason: DisputeReason;
  description: string;
}

export interface ResolveDisputeInput {
  status: DisputeStatus;
  resolution?: string;
}

export interface PaginatedDisputes {
  items: Dispute[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class DisputeError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, DisputeError.prototype);
  }
}

export class DisputeUseCase {
  constructor(
    private disputeRepo: IDisputeRepository,
    private orderRepo: IOrderRepository,
    private userRepo: IUserRepository,
  ) {}

  /** A buyer opens a dispute on one of their own orders. */
  async open(userId: string, input: OpenDisputeInput): Promise<Dispute> {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) throw new DisputeError(404, 'Order not found');
    if (order.userId !== userId) throw new DisputeError(403, 'This order does not belong to you');

    const existing = await this.disputeRepo.findOpenByOrder(input.orderId);
    if (existing) throw new DisputeError(409, 'A dispute is already open for this order');

    const dispute = await this.disputeRepo.create({
      orderId: input.orderId,
      userId,
      reason: input.reason,
      description: input.description,
    });
    return this.toDto(dispute, order.orderNumber);
  }

  async listMine(userId: string, page: number, limit: number): Promise<PaginatedDisputes> {
    const { disputes, total } = await this.disputeRepo.findMany({ page, limit, userId });
    return this.paginate(await this.enrich(disputes, false), total, page, limit);
  }

  /** Admin view: every dispute, optionally filtered by status, enriched with buyer email. */
  async listAll(page: number, limit: number, status?: DisputeStatus): Promise<PaginatedDisputes> {
    const { disputes, total } = await this.disputeRepo.findMany({ page, limit, status });
    return this.paginate(await this.enrich(disputes, true), total, page, limit);
  }

  /** Admin moves a dispute to under-review, resolved or rejected. */
  async resolve(disputeId: string, input: ResolveDisputeInput): Promise<Dispute> {
    const dispute = await this.disputeRepo.findById(disputeId);
    if (!dispute) throw new DisputeError(404, 'Dispute not found');

    const closed =
      input.status === DisputeStatus.RESOLVED || input.status === DisputeStatus.REJECTED;
    const updated = await this.disputeRepo.updateById(disputeId, {
      status: input.status,
      resolution: input.resolution,
      resolvedAt: closed ? new Date() : undefined,
    });
    if (!updated) throw new DisputeError(500, 'Failed to update dispute');

    const order = await this.orderRepo.findById(updated.orderId);
    return this.toDto(updated, order?.orderNumber);
  }

  private async enrich(disputes: DisputeEntity[], withUserEmail: boolean): Promise<Dispute[]> {
    const out: Dispute[] = [];
    for (const d of disputes) {
      const order = await this.orderRepo.findById(d.orderId);
      const userEmail = withUserEmail ? (await this.userRepo.findById(d.userId))?.email : undefined;
      out.push(this.toDto(d, order?.orderNumber, userEmail));
    }
    return out;
  }

  private toDto(d: DisputeEntity, orderNumber?: string, userEmail?: string): Dispute {
    return {
      _id: d.id,
      orderId: d.orderId,
      orderNumber,
      userId: d.userId,
      userEmail,
      reason: d.reason,
      description: d.description,
      status: d.status,
      resolution: d.resolution,
      resolvedAt: d.resolvedAt?.toISOString(),
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  }

  private paginate(
    items: Dispute[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedDisputes {
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}
