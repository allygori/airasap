import { z } from 'zod';
import { OrganizationFinanceSchema } from '@/modules/organizations/organization.schema';

export const FinanceReadinessStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'blocked',
  'active',
]);

export const FinanceReadinessBlockerCodeSchema = z.enum([
  'OWNER_REQUIRED',
  'FINANCE_BLOCKED',
]);

export const FinanceReadinessBlockerSchema = z.object({
  code: FinanceReadinessBlockerCodeSchema,
  message: z.string().min(1),
});

export const FinanceReadinessSchema = z.object({
  status: FinanceReadinessStatusSchema,
  owner_access: z.boolean(),
  can_start: z.boolean(),
  can_resume: z.boolean(),
  blockers: z.array(FinanceReadinessBlockerSchema),
});

export const FinanceReadinessResponseSchema = z.object({
  finance: OrganizationFinanceSchema,
  readiness: FinanceReadinessSchema,
});
