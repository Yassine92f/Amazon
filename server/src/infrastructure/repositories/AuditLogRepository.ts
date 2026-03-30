import {
  IAuditLogRepository,
  CreateAuditLogData,
  FindAuditLogsParams,
} from '../../domain/repositories/IAuditLogRepository';
import { AuditLogEntity } from '../../domain/entities/AuditLog';
import { AuditLogModel, AuditLogDocument } from '../database/models/AuditLog';

export class AuditLogRepository implements IAuditLogRepository {
  async create(data: CreateAuditLogData): Promise<AuditLogEntity> {
    const doc = await AuditLogModel.create({
      actorId: data.actorId,
      actorEmail: data.actorEmail,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      metadata: data.metadata ?? {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
    return this.toEntity(doc);
  }

  async findMany(params: FindAuditLogsParams): Promise<{ logs: AuditLogEntity[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (params.actorId) filter.actorId = params.actorId;
    if (params.targetId) filter.targetId = params.targetId;
    if (params.action) filter.action = params.action;

    const [docs, total] = await Promise.all([
      AuditLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((params.page - 1) * params.limit)
        .limit(params.limit),
      AuditLogModel.countDocuments(filter),
    ]);

    return { logs: docs.map((d) => this.toEntity(d)), total };
  }

  private toEntity(doc: AuditLogDocument): AuditLogEntity {
    return {
      id: doc._id?.toString() ?? '',
      actorId: doc.actorId.toString(),
      actorEmail: doc.actorEmail,
      action: doc.action,
      targetType: doc.targetType,
      targetId: doc.targetId,
      metadata: doc.metadata ?? {},
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent,
      createdAt: doc.createdAt,
    };
  }
}
