import z from 'zod';

export const ORGANIZATION_ACCOUNTING_STATUS_VALUES = [
  'not_started',
  'in_progress',
  'active',
] as const;

export const OrganizationAccountingStatusSchema = z.enum(
  ORGANIZATION_ACCOUNTING_STATUS_VALUES
);

export const OrganizationAccountingSchema = z.object({
  status:
    OrganizationAccountingStatusSchema.default(
      'not_started'
    ),
  onboarding_version: z
    .number()
    .int()
    .positive()
    .default(1),
  calendar_timezone: z.string().min(1).optional(),
  cutover_date: z.date().optional(),
  account_mappings: z
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
    .optional(),
  started_at: z.date().optional(),
  completed_at: z.date().optional(),
  completed_by: z.string().optional(),
});

export const OrganizationBaseSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1, 'Nama organisasi wajib diisi'),
  slug: z.string().min(1, 'Slug organisasi wajib diisi'),
  logo: z.string().optional(),
  metadata: z.object().optional(),
  plan: z.string().optional().default('free'),
  accounting: OrganizationAccountingSchema.optional(),
  // user: z
  //   .string()
  //   .optional()
  //   .refine((val) => mongoose.isValidObjectId(val), {
  //     message: 'Mongoose ObjectId tidak valid',
  //   })
  //   .transform((val) => new mongoose.Types.ObjectId(val)),
});

export const OrganizationSchema =
  OrganizationBaseSchema.extend({
    _id: z
      .string()
      .optional()
      .refine((val) => mongoose.isValidObjectId(val), {
        message: 'Mongoose ObjectId tidak valid',
      })
      .transform((val) => new mongoose.Types.ObjectId(val)),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    deletedAt: z.string().nullable().optional(),
  });

export const OrganizationResponseSchema =
  OrganizationSchema;
