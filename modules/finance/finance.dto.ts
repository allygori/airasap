import { z } from 'zod';
import { OrganizationFinanceSchema } from '@/modules/organizations/organization.schema';

export const FinanceStatusResponseSchema = z.object({
  finance: OrganizationFinanceSchema,
});

export type FinanceStatusResponseDTO = z.infer<
  typeof FinanceStatusResponseSchema
>;
