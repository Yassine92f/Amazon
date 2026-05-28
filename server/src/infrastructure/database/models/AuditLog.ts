import mongoose, { Schema, Document } from 'mongoose';
import { AuditAction } from '../../../domain/entities/AuditLog';

export interface AuditLogDocument extends Document {
  actorId: mongoose.Types.ObjectId;
  actorEmail: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorEmail: { type: String, required: true },
    action: { type: String, enum: Object.values(AuditAction), required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLogModel = mongoose.model<AuditLogDocument>('AuditLog', auditLogSchema);
