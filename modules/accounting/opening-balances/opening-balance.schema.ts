import { z } from 'zod';
import {
  DEFAULT_CURRENCY,
  OPENING_BALANCE_STATUS_VALUES,
} from '../accounting.constant';

export const OpeningBalanceStatusSchema = z.enum(
  OPENING_BALANCE_STATUS_VALUES
);

export const OpeningBalanceLineSchema = z
  .object({
    account: z.string().min(1),
    debit: z.number().int().nonnegative().default(0),
    credit: z.number().int().nonnegative().default(0),
  })
  .refine(
    (line) =>
      (line.debit > 0 && line.credit === 0) ||
      (line.credit > 0 && line.debit === 0),
    'Opening balance line harus memiliki debit atau credit.'
  );

export const OpeningBalanceBaseSchema = z.object({
  opening_balance_number: z.string().trim().min(1),
  effective_date: z.string().min(1),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  currency: z.string().default(DEFAULT_CURRENCY),
  description: z.string().trim().min(1),
  status: OpeningBalanceStatusSchema.default('draft'),
  journal_entry: z.string().optional(),
  lines: z.array(OpeningBalanceLineSchema).min(2),
});

export const CreateOpeningBalanceSchema =
  OpeningBalanceBaseSchema;
export const UpdateOpeningBalanceSchema =
  OpeningBalanceBaseSchema.partial();
export const OpeningBalanceResponseSchema =
  OpeningBalanceBaseSchema.extend({
    _id: z.string(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  });
