import { z } from 'zod';
import {
  FINANCE_ACCOUNT_TYPE_VALUES,
  FINANCE_NORMAL_BALANCE_VALUES,
} from './finance-account.constants';

export const FinanceAccountTypeSchema = z.enum(
  FINANCE_ACCOUNT_TYPE_VALUES
);

export const FinanceNormalBalanceSchema = z.enum(
  FINANCE_NORMAL_BALANCE_VALUES
);

export const FinanceAccountTemplateRecordSchema = z
  .object({
    code: z.string().trim().min(1),
    name: z.string().trim().min(1),
    type: FinanceAccountTypeSchema,
    subtype: z.string().trim().min(1).optional(),
    parent_code: z.string().trim().min(1).nullable(),
    normal_balance: FinanceNormalBalanceSchema,
    is_system: z.boolean(),
    is_postable: z.boolean(),
    is_active: z.boolean(),
    display_order: z.number().int(),
    description: z.string().trim().optional(),
  })
  .strict();

export const FinanceAccountUpdateDetailsSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).nullable(),
  })
  .strict();

export const FinanceAccountDetailsResponseSchema = z.object(
  {
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
  }
);

const BooleanQuerySchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const FinanceAccountFilterSchema = z
  .object({
    type: FinanceAccountTypeSchema.optional(),
    is_active: BooleanQuerySchema.optional(),
    is_postable: BooleanQuerySchema.optional(),
    search: z.string().trim().max(80).optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(500)
      .default(500),
  })
  .strict();

export const FinanceAccountResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: FinanceAccountTypeSchema,
  subtype: z.string().nullable(),
  parent_account_id: z.string().nullable(),
  normal_balance: FinanceNormalBalanceSchema,
  is_system: z.boolean(),
  is_postable: z.boolean(),
  is_active: z.boolean(),
  is_selectable: z.boolean(),
  display_order: z.number().int(),
  depth: z.number().int().min(0),
  description: z.string().nullable(),
});

export const FinanceAccountListResponseSchema = z.object({
  accounts: z.array(FinanceAccountResponseSchema),
  meta: z.object({
    total: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
  }),
});
