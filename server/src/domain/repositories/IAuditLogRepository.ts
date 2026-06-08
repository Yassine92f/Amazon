import { AuditAction, AuditLogEntity } from '../entities/AuditLog';

export interface CreateAuditLogData {
  actorId: string;
  actorEmail: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface FindAuditLogsParams {
  page: number;
  limit: number;
  actorId?: string;
  targetId?: string;
  action?: AuditAction;
}

export interface IAuditLogRepository {
  create(data: CreateAuditLogData): Promise<AuditLogEntity>;
  findMany(params: FindAuditLogsParams): Promise<{ logs: AuditLogEntity[]; total: number }>;
}
