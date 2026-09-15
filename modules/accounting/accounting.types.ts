import { Types } from 'mongoose';

export type AccountingTenantContext = {
  organizationId: string;
  userId?: string;
};

export const ACCOUNTING_SOURCE_TYPE_VALUES = [
  'manual',
  'order',
  'expense',
  'purchase',
  'inventory_movement',
  'opening_balance',
  'marketplace_settlement',
  'capital_contribution',
  'owner_distribution',
  'journal_reversal',
] as const;

export type AccountingSourceType =
  (typeof ACCOUNTING_SOURCE_TYPE_VALUES)[number];

export type AccountingReference = {
  source_type?: string;
  source_id?: string;
  source_event?: string;
  idempotency_key?: string;
};

export type AuditEntityType =
  | 'account'
  | 'accounting_period'
  | 'journal_entry'
  | 'opening_balance'
  | 'expense'
  | 'inventory_movement'
  | 'settlement';

export type AccountingSessionOptions = {
  session?: import('mongoose').ClientSession;
};

export const toAccountingObjectId = (
  value: string,
  fieldName: string
) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new Error(
      `${fieldName} harus berupa ObjectId yang valid.`
    );
  }

  return new Types.ObjectId(value);
};

export const assertAccountingTenant = (
  context: AccountingTenantContext
) => {
  toAccountingObjectId(
    context.organizationId,
    'organizationId'
  );
};

export const getPeriodKeyFromDate = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(
    2,
    '0'
  );
  return `${year}-${month}`;
};

export const parseAccountingDate = (
  value: string | Date,
  fieldName: string
) => {
  const date =
    value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `${fieldName} harus berupa tanggal yang valid.`
    );
  }

  return date;
};

export const validateSourceReference = (
  reference: AccountingReference
) => {
  const hasSourceType = Boolean(reference.source_type);
  const hasSourceId = Boolean(reference.source_id);

  if (hasSourceType !== hasSourceId) {
    throw new Error(
      'source_type dan source_id harus diisi bersama.'
    );
  }

  if (reference.source_event && !hasSourceType) {
    throw new Error(
      'source_event membutuhkan source_type dan source_id.'
    );
  }
};
