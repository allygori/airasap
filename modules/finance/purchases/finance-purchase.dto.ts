import {
  FinancePurchaseDetailResponseSchema,
  FinancePurchaseInputSchema,
  FinancePurchaseLineInputSchema,
  FinancePurchaseLineResponseSchema,
  FinancePurchaseListQuerySchema,
  FinancePurchaseListResponseSchema,
  FinancePurchasePaymentTimingSchema,
  FinancePurchaseResponseSchema,
  FinancePurchaseStatusSchema,
  FinancePurchaseSummarySchema,
} from './finance-purchase.schema';

export type FinancePurchaseInputDTO = ReturnType<
  typeof FinancePurchaseInputSchema.parse
>;

export type FinancePurchaseLineInputDTO = ReturnType<
  typeof FinancePurchaseLineInputSchema.parse
>;

export type FinancePurchaseLineResponseDTO = ReturnType<
  typeof FinancePurchaseLineResponseSchema.parse
>;

export type FinancePurchaseStatusDTO = ReturnType<
  typeof FinancePurchaseStatusSchema.parse
>;

export type FinancePurchasePaymentTimingDTO = ReturnType<
  typeof FinancePurchasePaymentTimingSchema.parse
>;

export type FinancePurchaseResponseDTO = ReturnType<
  typeof FinancePurchaseResponseSchema.parse
>;

export type FinancePurchaseSummaryDTO = ReturnType<
  typeof FinancePurchaseSummarySchema.parse
>;

export type FinancePurchaseListQueryDTO = ReturnType<
  typeof FinancePurchaseListQuerySchema.parse
>;

export type FinancePurchaseListResponseDTO = ReturnType<
  typeof FinancePurchaseListResponseSchema.parse
>;

export type FinancePurchaseDetailResponseDTO = ReturnType<
  typeof FinancePurchaseDetailResponseSchema.parse
>;
