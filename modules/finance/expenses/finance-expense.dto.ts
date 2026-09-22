import {
  FinanceExpenseDetailResponseSchema,
  FinanceExpenseInputSchema,
  FinanceExpenseListQuerySchema,
  FinanceExpenseListResponseSchema,
  FinanceExpensePaymentTimingSchema,
  FinanceExpenseResponseSchema,
  FinanceExpenseStatusSchema,
  FinanceExpenseSummarySchema,
} from './finance-expense.schema';

export type FinanceExpenseInputDTO = ReturnType<
  typeof FinanceExpenseInputSchema.parse
>;

export type FinanceExpenseStatusDTO = ReturnType<
  typeof FinanceExpenseStatusSchema.parse
>;

export type FinanceExpensePaymentTimingDTO = ReturnType<
  typeof FinanceExpensePaymentTimingSchema.parse
>;

export type FinanceExpenseResponseDTO = ReturnType<
  typeof FinanceExpenseResponseSchema.parse
>;

export type FinanceExpenseSummaryDTO = ReturnType<
  typeof FinanceExpenseSummarySchema.parse
>;

export type FinanceExpenseListQueryDTO = ReturnType<
  typeof FinanceExpenseListQuerySchema.parse
>;

export type FinanceExpenseListResponseDTO = ReturnType<
  typeof FinanceExpenseListResponseSchema.parse
>;

export type FinanceExpenseDetailResponseDTO = ReturnType<
  typeof FinanceExpenseDetailResponseSchema.parse
>;
