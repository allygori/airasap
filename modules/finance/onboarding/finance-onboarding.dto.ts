import {
  FinanceReadinessBlockerSchema,
  FinanceReadinessResponseSchema,
  FinanceReadinessSchema,
} from './finance-onboarding.schema';

export type FinanceReadinessBlockerDTO = ReturnType<
  typeof FinanceReadinessBlockerSchema.parse
>;

export type FinanceReadinessDTO = ReturnType<
  typeof FinanceReadinessSchema.parse
>;

export type FinanceReadinessResponseDTO = ReturnType<
  typeof FinanceReadinessResponseSchema.parse
>;
