import {
  FinanceAccountFilterSchema,
  FinanceAccountListResponseSchema,
  FinanceAccountResponseSchema,
} from './finance-account.schema';

export type FinanceAccountFilterDTO = ReturnType<
  typeof FinanceAccountFilterSchema.parse
>;

export type FinanceAccountDTO = ReturnType<
  typeof FinanceAccountResponseSchema.parse
>;

export type FinanceAccountListResponseDTO = ReturnType<
  typeof FinanceAccountListResponseSchema.parse
>;
