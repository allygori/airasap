import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import type {
  AuditEntityType,
  AccountingTenantContext,
} from '../accounting.types';

export type TAuditLog = Document & {
  organization: Types.ObjectId;
  action: string;
  entity_type: AuditEntityType;
  entity_id: Types.ObjectId;
  actor_id?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  created_at?: Date;
  updated_at?: Date;
};

const AuditLogSchema = new Schema<TAuditLog>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      select: false,
    },
    action: { type: String, required: true, trim: true },
    entity_type: {
      type: String,
      required: true,
      enum: [
        'account',
        'accounting_period',
        'journal_entry',
        'opening_balance',
        'expense',
        'inventory_movement',
      ],
    },
    entity_id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    actor_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

AuditLogSchema.index({
  organization: 1,
  entity_type: 1,
  entity_id: 1,
  created_at: -1,
});

AuditLogSchema.plugin(multiTenancyPlugin);

export const AuditLogModel =
  models.AccountingAuditLog ||
  model<TAuditLog>(
    'AccountingAuditLog',
    AuditLogSchema,
    'accounting_audit_logs'
  );

export type CreateAuditLogInput = {
  action: string;
  entity_type: AuditEntityType;
  entity_id: Types.ObjectId;
  actor_id?: Types.ObjectId;
  metadata?: Record<string, unknown>;
};

export const createAuditLog = async (
  context: AccountingTenantContext,
  input: CreateAuditLogInput,
  session?: import('mongoose').ClientSession
) => {
  const document = new AuditLogModel({
    ...input,
    organization: new Types.ObjectId(
      context.organizationId
    ),
  });

  return document.save(session ? { session } : undefined);
};
