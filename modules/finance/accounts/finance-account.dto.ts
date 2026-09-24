import {
  FinanceAccountFilterSchema,
  FinanceAccountDetailsResponseSchema,
  FinanceAccountListResponseSchema,
  FinanceAccountResponseSchema,
  FinanceAccountUpdateDetailsSchema,
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

export type FinanceAccountUpdateDetailsDTO = ReturnType<
  typeof FinanceAccountUpdateDetailsSchema.parse
>;

export type FinanceAccountDetailsDTO = ReturnType<
  typeof FinanceAccountDetailsResponseSchema.parse
>;
