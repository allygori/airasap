import { z } from 'zod';
import { TIMEZONE_VALUES } from '@/constant/timezone';
import { OpeningBalanceLineSchema } from './opening-balances/opening-balance.schema';

export const AccountingInventoryModeSchema = z.enum([
  'detailed',
  'aggregate',
]);

export const AccountingOnboardingAccountMappingsSchema = z
  .object({
    sales_revenue: z.string().optional(),
    marketplace_balance: z.string().optional(),
    marketplace_balances: z
      .record(z.string(), z.string())
      .optional(),
    marketplace_receivables: z
      .record(z.string(), z.string())
      .optional(),
    merchandise_inventory: z.string().optional(),
    merchandise_cogs: z.string().optional(),
    opening_balance_equity: z.string().optional(),
    expense_payable: z.string().optional(),
    marketplace_fee_accounts: z
      .record(z.string(), z.string())
      .optional(),
  })
  .optional();

export const AccountingInventoryOpeningLineSchema =
  z.object({
    product: z.string().optional(),
    variant_id: z.string().optional(),
    inventory_item: z.string().optional(),
    sku: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    unit: z.string().trim().min(1).default('unit'),
    quantity: z.number().int().nonnegative().default(0),
    unit_cost: z.number().int().positive().optional(),
    location: z.string().optional(),
    store: z.string().optional(),
    platform: z.string().optional(),
  });

export const AccountingBankAccountSchema = z.object({
  code: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  institution: z.string().trim().optional(),
  account_last4: z
    .string()
    .trim()
    .regex(/^\d{4}$/)
    .optional(),
  account_holder: z.string().trim().optional(),
  balance: z.number().int().nonnegative().default(0),
});

export const AccountingOnboardingFinalizeSchema = z.object({
  cutover_date: z.string().min(1),
  calendar_timezone: z.enum(TIMEZONE_VALUES).optional(),
  description: z
    .string()
    .trim()
    .min(1)
    .default('Saldo awal accounting'),
  inventory_mode:
    AccountingInventoryModeSchema.default('detailed'),
  bank_accounts: z
    .array(AccountingBankAccountSchema)
    .default([]),
  aggregate_inventory_value: z
    .number()
    .int()
    .nonnegative()
    .optional(),
  inventory_lines: z
    .array(AccountingInventoryOpeningLineSchema)
    .default([]),
  opening_balance_lines: z
    .array(OpeningBalanceLineSchema)
    .optional(),
  account_mappings:
    AccountingOnboardingAccountMappingsSchema,
});

export type AccountingOnboardingFinalizeInput = z.infer<
  typeof AccountingOnboardingFinalizeSchema
>;
