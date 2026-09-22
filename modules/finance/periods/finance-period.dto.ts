import {
  FinanceClosePeriodSchema,
  FinancePeriodKeySchema,
  FinancePeriodResponseSchema,
  FinancePeriodStatusSchema,
} from './finance-period.schema';

export type FinancePeriodKeyDTO = ReturnType<
  typeof FinancePeriodKeySchema.parse
>;

export type FinancePeriodStatusDTO = ReturnType<
  typeof FinancePeriodStatusSchema.parse
>;

export type FinanceClosePeriodDTO = ReturnType<
  typeof FinanceClosePeriodSchema.parse
>;

export type FinancePeriodResponseDTO = ReturnType<
  typeof FinancePeriodResponseSchema.parse
>;
