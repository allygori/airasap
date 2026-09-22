import {
  FinanceSettlementInputSchema,
  FinanceSettlementResponseSchema,
  FinanceSettlementStatusSchema,
  FinanceSettlementSummarySchema,
  FinanceSettlementListResponseSchema,
  FinanceSubledgerBalanceSchema,
  FinanceSubledgerListQuerySchema,
  FinanceSubledgerListResponseSchema,
  FinanceSubledgerOverdueStatusSchema,
  FinanceSubledgerSettlementStatusSchema,
  FinanceSubledgerTypeSchema,
} from './finance-subledger.schema';

export type FinanceSubledgerTypeDTO = ReturnType<
  typeof FinanceSubledgerTypeSchema.parse
>;

export type FinanceSubledgerSettlementStatusDTO =
  ReturnType<
    typeof FinanceSubledgerSettlementStatusSchema.parse
  >;

export type FinanceSubledgerOverdueStatusDTO = ReturnType<
  typeof FinanceSubledgerOverdueStatusSchema.parse
>;

export type FinanceSettlementStatusDTO = ReturnType<
  typeof FinanceSettlementStatusSchema.parse
>;

export type FinanceSubledgerListQueryDTO = ReturnType<
  typeof FinanceSubledgerListQuerySchema.parse
>;

export type FinanceSettlementInputDTO = ReturnType<
  typeof FinanceSettlementInputSchema.parse
>;

export type FinanceSubledgerBalanceDTO = ReturnType<
  typeof FinanceSubledgerBalanceSchema.parse
>;

export type FinanceSubledgerListResponseDTO = ReturnType<
  typeof FinanceSubledgerListResponseSchema.parse
>;

export type FinanceSettlementResponseDTO = ReturnType<
  typeof FinanceSettlementResponseSchema.parse
>;

export type FinanceSettlementSummaryDTO = ReturnType<
  typeof FinanceSettlementSummarySchema.parse
>;

export type FinanceSettlementListResponseDTO = ReturnType<
  typeof FinanceSettlementListResponseSchema.parse
>;
