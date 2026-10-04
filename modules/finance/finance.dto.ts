import { z } from 'zod';
import { FinanceStateSchema } from './onboarding/finance-onboarding.schema';

export const FinanceStatusResponseSchema = z.object({
  finance: FinanceStateSchema,
});

export type FinanceStatusResponseDTO = z.infer<
  typeof FinanceStatusResponseSchema
>;
