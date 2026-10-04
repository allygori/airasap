import z from 'zod';
import { TIMEZONE_VALUES } from '@/constant/timezone';
import { ORGANIZATION_FINANCE_STATUS_VALUES } from '@/constant/organization/status';

export { ORGANIZATION_FINANCE_STATUS_VALUES } from '@/constant/organization/status';

export const OrganizationFinanceStatusSchema = z.enum(
  ORGANIZATION_FINANCE_STATUS_VALUES
);

export const OrganizationFinanceSchema = z.object({
  status:
    OrganizationFinanceStatusSchema.default('not_started'),
  onboarding_version: z
    .number()
    .int()
    .positive()
    .default(1),
  calendar_timezone: z
    .enum(TIMEZONE_VALUES)
    .default('Asia/Jakarta'),
  started_at: z.date().optional(),
  blocked_reason: z.string().min(1).optional(),
  cut_off_date: z.date().optional(),
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
  finance: OrganizationFinanceSchema.optional(),
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
