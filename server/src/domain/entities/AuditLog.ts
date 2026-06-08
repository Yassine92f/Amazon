export enum AuditAction {
  USER_STATUS_CHANGED = 'user.status_changed',
  USER_ROLE_CHANGED = 'user.role_changed',
  USER_DELETED = 'user.deleted',
  PRODUCT_STATUS_CHANGED = 'product.status_changed',
  PRODUCT_DELETED = 'product.deleted',
}

export interface AuditLogEntity {
  id: string;
  actorId: string;
  actorEmail: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
