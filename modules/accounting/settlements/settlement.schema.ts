import { z } from 'zod';
import { ORDER_PLATFORM_VALUES } from '@/constant/order-platform';

export const SETTLEMENT_STATUS_VALUES = [
  'draft',
  'posted',
  'blocked',
  'voided',
] as const;

export const SETTLEMENT_RECONCILIATION_STATUS_VALUES = [
  'matched',
  'exception',
] as const;

export const SETTLEMENT_STAGE_VALUES = [
  'funds_released',
  'payout_received',
] as const;

export const SettlementStatusSchema = z.enum(
  SETTLEMENT_STATUS_VALUES
);
export const SettlementReconciliationStatusSchema = z.enum(
  SETTLEMENT_RECONCILIATION_STATUS_VALUES
);
export const SettlementStageSchema = z.enum(
  SETTLEMENT_STAGE_VALUES
);

export const SettlementFeeLineSchema = z.object({
  category: z.string().trim().min(1),
  account: z.string().regex(/^[0-9a-fA-F]{24}$/),
  amount: z.number().int().positive(),
});

export const SettlementBaseSchema = z.object({
  order: z.string().regex(/^[0-9a-fA-F]{24}$/),
  source_settlement: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  store: z.string().regex(/^[0-9a-fA-F]{24}$/),
  order_id: z.string().trim().min(1),
  platform: z.enum(ORDER_PLATFORM_VALUES),
  settlement_reference: z.string().trim().min(1),
  settled_at: z.string().min(1),
  settlement_stage: SettlementStageSchema.default(
    'funds_released'
  ),
  destination_account: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/),
  gross_amount: z.number().int().positive(),
  fee_amount: z.number().int().nonnegative(),
  net_amount: z.number().int().nonnegative(),
  fee_lines: z.array(SettlementFeeLineSchema).default([]),
  reconciliation_status:
    SettlementReconciliationStatusSchema.default('matched'),
  reconciliation_difference: z.number().int().default(0),
  source_file: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  idempotency_key: z.string().trim().min(1),
  blocked_reason: z.string().trim().optional(),
  status: SettlementStatusSchema.default('draft'),
  journal_entry: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
});

export const CreateSettlementSchema = SettlementBaseSchema;
export const SettlementResponseSchema =
  SettlementBaseSchema.extend({
    _id: z.string(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  });
