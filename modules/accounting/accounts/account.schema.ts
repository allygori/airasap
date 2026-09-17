import { z } from 'zod';
import {
  ACCOUNT_TYPE_VALUES,
  NORMAL_BALANCE_VALUES,
} from '../accounting.constant';

export const AccountTypeSchema = z.enum(
  ACCOUNT_TYPE_VALUES
);

export const NormalBalanceSchema = z.enum(
  NORMAL_BALANCE_VALUES
);

export const AccountMetadataSchema = z
  .object({
    institution: z.string().trim().optional(),
    account_last4: z
      .string()
      .trim()
      .regex(/^\d{4}$/)
      .optional(),
    account_holder: z.string().trim().optional(),
    provider: z.string().trim().optional(),
  })
  .optional();

export const AccountBaseSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: AccountTypeSchema,
  subtype: z.string().trim().min(1).optional(),
  parent_account: z.string().min(1).nullable().optional(),
  normal_balance: NormalBalanceSchema,
  is_system: z.boolean().default(false),
  is_postable: z.boolean().default(true),
  is_active: z.boolean().default(true),
  display_order: z.number().int().default(0),
  description: z.string().trim().optional(),
  account_metadata: AccountMetadataSchema,
});

export const CreateAccountSchema = AccountBaseSchema;
export const UpdateAccountSchema =
  AccountBaseSchema.partial();

export const AccountResponseSchema =
  AccountBaseSchema.extend({
    _id: z.string(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  });

export const AccountFilterSchema = z.object({
  type: AccountTypeSchema.optional(),
  is_active: z.coerce.boolean().optional(),
  is_postable: z.coerce.boolean().optional(),
  search: z.string().optional(),
});
