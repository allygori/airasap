import { z } from 'zod';
import {
  FINANCE_OPENING_BALANCE_MAX_AMOUNT,
  FINANCE_OPENING_BALANCE_MODE_VALUES,
  FINANCE_OPENING_BALANCE_STATUS_VALUES,
} from './finance-opening-balance.constants';

const ObjectIdStringSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId tidak valid');

const MoneySchema = z.coerce
  .number()
  .int()
  .nonnegative()
  .max(FINANCE_OPENING_BALANCE_MAX_AMOUNT);

const OpeningAccountAmountSchema = z
  .object({
    account_id: ObjectIdStringSchema,
    amount: MoneySchema,
  })
  .strict();

const OpeningInventoryLineSchema = z
  .object({
    inventory_item_id: ObjectIdStringSchema,
    location_id: ObjectIdStringSchema,
    quantity: z.coerce
      .number()
      .int()
      .nonnegative()
      .max(1_000_000),
    unit_cost: MoneySchema.optional(),
  })
  .strict();

const OpeningSubledgerLineSchema = z
  .object({
    account_id: ObjectIdStringSchema,
    amount: MoneySchema,
    counterparty: z.string().trim().max(160).optional(),
    reference: z.string().trim().max(160).optional(),
  })
  .strict();

const OpeningBalancePreviewLineSchema = z.object({
  account_id: ObjectIdStringSchema,
  account_code: z.string().min(1),
  account_name: z.string().min(1),
  debit: z.number().int().nonnegative(),
  credit: z.number().int().nonnegative(),
  description: z.string().min(1),
});

const OpeningBalancePreviewInventoryMovementSchema =
  z.object({
    inventory_item_id: ObjectIdStringSchema,
    sku: z.string().min(1),
    item_name: z.string().min(1),
    location_id: ObjectIdStringSchema,
    location_name: z.string().min(1),
    quantity: z.number().int().positive(),
    unit: z.string().min(1),
    unit_cost: z.number().int().nonnegative(),
    total_cost: z.number().int().nonnegative(),
  });

const OpeningBalancePreviewSubledgerItemSchema = z.object({
  balance_type: z.enum(['receivable', 'payable']),
  source_label: z.string().min(1),
  amount: z.number().int().positive(),
});

export const FinanceOpeningBalanceModeSchema = z.enum(
  FINANCE_OPENING_BALANCE_MODE_VALUES
);

export const FinanceOpeningBalanceStatusSchema = z.enum(
  FINANCE_OPENING_BALANCE_STATUS_VALUES
);

export const FinanceOpeningBalanceDraftInputSchema = z
  .object({
    cut_off_date: z.string().date(),
    mode: FinanceOpeningBalanceModeSchema,
    description: z
      .string()
      .trim()
      .min(1)
      .max(240)
      .default('Saldo awal Finance'),
    cash_bank_lines: z
      .array(OpeningAccountAmountSchema)
      .max(100)
      .default([]),
    inventory_lines: z
      .array(OpeningInventoryLineSchema)
      .max(500)
      .default([]),
    payable_lines: z
      .array(OpeningSubledgerLineSchema)
      .max(100)
      .default([]),
    receivable_lines: z
      .array(OpeningSubledgerLineSchema)
      .max(100)
      .default([]),
    owner_capital_account_id:
      ObjectIdStringSchema.optional(),
    owner_capital_amount: MoneySchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.mode === 'zero') {
      const hasValues =
        value.cash_bank_lines.some(
          (line) => line.amount > 0
        ) ||
        value.inventory_lines.some(
          (line) => line.quantity > 0
        ) ||
        value.payable_lines.some(
          (line) => line.amount > 0
        ) ||
        value.receivable_lines.some(
          (line) => line.amount > 0
        ) ||
        (value.owner_capital_amount ?? 0) > 0;

      if (hasValues) {
        context.addIssue({
          code: 'custom',
          path: ['mode'],
          message:
            'Mode mulai dari nol tidak dapat menyimpan saldo opening.',
        });
      }
    }

    if (value.mode === 'entered') {
      if (!value.owner_capital_account_id) {
        context.addIssue({
          code: 'custom',
          path: ['owner_capital_account_id'],
          message: 'Akun Modal Pemilik wajib dipilih.',
        });
      }
      if (value.owner_capital_amount === undefined) {
        context.addIssue({
          code: 'custom',
          path: ['owner_capital_amount'],
          message: 'Modal Pemilik wajib diisi.',
        });
      }
    }

    for (const [
      index,
      line,
    ] of value.inventory_lines.entries()) {
      if (
        line.quantity > 0 &&
        line.unit_cost === undefined
      ) {
        context.addIssue({
          code: 'custom',
          path: ['inventory_lines', index, 'unit_cost'],
          message:
            'Unit cost wajib diisi untuk inventory dengan quantity di atas nol.',
        });
      }
    }

    for (const [
      index,
      line,
    ] of value.payable_lines.entries()) {
      if (!line.counterparty && !line.reference) {
        context.addIssue({
          code: 'custom',
          path: ['payable_lines', index, 'counterparty'],
          message:
            'Isi nama supplier atau reference agar saldo hutang dapat dikenali.',
        });
      }
    }

    for (const [
      index,
      line,
    ] of value.receivable_lines.entries()) {
      if (!line.counterparty && !line.reference) {
        context.addIssue({
          code: 'custom',
          path: ['receivable_lines', index, 'counterparty'],
          message:
            'Isi counterparty atau reference agar saldo piutang dapat dikenali.',
        });
      }
    }
  });

export const FinanceOpeningBalanceDraftSchema =
  FinanceOpeningBalanceDraftInputSchema.extend({
    id: ObjectIdStringSchema,
    status: FinanceOpeningBalanceStatusSchema,
    onboarding_version: z.number().int().positive(),
    created_at: z.string().datetime().nullable(),
    updated_at: z.string().datetime().nullable(),
    journal_entry_id: ObjectIdStringSchema.nullable(),
    inventory_movement_ids: z.array(ObjectIdStringSchema),
    finalized_at: z.string().datetime().nullable(),
  });

export const FinanceOpeningBalanceAccountOptionSchema =
  z.object({
    id: ObjectIdStringSchema,
    code: z.string().min(1),
    name: z.string().min(1),
    type: z.string().min(1),
    subtype: z.string().nullable(),
    normal_balance: z.enum(['debit', 'credit']),
  });

export const FinanceOpeningBalanceInventoryItemOptionSchema =
  z.object({
    id: ObjectIdStringSchema,
    sku: z.string().min(1),
    name: z.string().min(1),
    item_type: z.string().min(1),
    unit: z.string().min(1),
    track_quantity: z.boolean(),
    track_value: z.boolean(),
  });

export const FinanceOpeningBalanceLocationOptionSchema =
  z.object({
    id: ObjectIdStringSchema,
    code: z.string().min(1),
    name: z.string().min(1),
  });

export const FinanceOpeningBalanceSummarySchema = z.object({
  cash_bank_total: z.number().int().nonnegative(),
  inventory_total: z.number().int().nonnegative(),
  receivable_total: z.number().int().nonnegative(),
  total_assets: z.number().int().nonnegative(),
  payable_total: z.number().int().nonnegative(),
  owner_capital_total: z.number().int().nonnegative(),
  retained_earnings_balance: z.number().int(),
});

export const FinanceOpeningBalanceSetupResponseSchema =
  z.object({
    finance_status: z.enum([
      'not_started',
      'in_progress',
      'blocked',
      'active',
    ]),
    draft: FinanceOpeningBalanceDraftSchema.nullable(),
    options: z.object({
      cash_bank_accounts: z.array(
        FinanceOpeningBalanceAccountOptionSchema
      ),
      liability_accounts: z.array(
        FinanceOpeningBalanceAccountOptionSchema
      ),
      receivable_accounts: z.array(
        FinanceOpeningBalanceAccountOptionSchema
      ),
      equity_accounts: z.array(
        FinanceOpeningBalanceAccountOptionSchema
      ),
      retained_earnings_accounts: z.array(
        FinanceOpeningBalanceAccountOptionSchema
      ),
      inventory_items: z.array(
        FinanceOpeningBalanceInventoryItemOptionSchema
      ),
      locations: z.array(
        FinanceOpeningBalanceLocationOptionSchema
      ),
    }),
    summary: FinanceOpeningBalanceSummarySchema,
  });

export const FinanceOpeningBalancePreviewSchema = z.object({
  cut_off_date: z.string().date(),
  mode: FinanceOpeningBalanceModeSchema,
  summary: FinanceOpeningBalanceSummarySchema,
  journal_lines: z.array(OpeningBalancePreviewLineSchema),
  inventory_movements: z.array(
    OpeningBalancePreviewInventoryMovementSchema
  ),
  subledger_items: z.array(
    OpeningBalancePreviewSubledgerItemSchema
  ),
  total_debit: z.number().int().nonnegative(),
  total_credit: z.number().int().nonnegative(),
  will_create_journal: z.boolean(),
  inventory_movement_count: z.number().int().nonnegative(),
  payable_item_count: z.number().int().nonnegative(),
  receivable_item_count: z.number().int().nonnegative(),
});

export const FinanceOpeningBalanceFinalizeInputSchema = z
  .object({ confirmed: z.literal(true) })
  .strict();

export const FinanceOpeningBalanceFinalizeResponseSchema =
  z.object({
    finance_status: z.literal('active'),
    status: z.enum(['posted', 'skipped']),
    cut_off_date: z.string().date(),
    journal_entry_id: ObjectIdStringSchema.nullable(),
    inventory_movement_count: z
      .number()
      .int()
      .nonnegative(),
    payable_item_count: z.number().int().nonnegative(),
    receivable_item_count: z.number().int().nonnegative(),
    replayed: z.boolean(),
  });
