import {
  FinanceOfflineSaleFormOptionsSchema,
  FinanceOfflineSaleInputSchema,
  FinanceOfflineSaleResponseSchema,
} from './finance-offline-sale.schema';

export type FinanceOfflineSaleInputDTO = ReturnType<
  typeof FinanceOfflineSaleInputSchema.parse
>;

export type FinanceOfflineSaleFormOptionsDTO = ReturnType<
  typeof FinanceOfflineSaleFormOptionsSchema.parse
>;

export type FinanceOfflineSaleResponseDTO = ReturnType<
  typeof FinanceOfflineSaleResponseSchema.parse
>;
