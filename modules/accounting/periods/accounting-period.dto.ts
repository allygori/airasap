import {
  AccountingPeriodBaseSchema,
  AccountingPeriodResponseSchema,
  CreateAccountingPeriodSchema,
  UpdateAccountingPeriodSchema,
} from './accounting-period.schema';

export type AccountingPeriodBaseDTO = ReturnType<
  typeof AccountingPeriodBaseSchema.parse
>;
export type CreateAccountingPeriodDTO = ReturnType<
  typeof CreateAccountingPeriodSchema.parse
>;
export type UpdateAccountingPeriodDTO = ReturnType<
  typeof UpdateAccountingPeriodSchema.parse
>;
export type AccountingPeriodResponseDTO = ReturnType<
  typeof AccountingPeriodResponseSchema.parse
>;
