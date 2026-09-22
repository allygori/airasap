import {
  FinanceOpeningBalanceAccountOptionSchema,
  FinanceOpeningBalanceDraftInputSchema,
  FinanceOpeningBalanceDraftSchema,
  FinanceOpeningBalanceInventoryItemOptionSchema,
  FinanceOpeningBalanceLocationOptionSchema,
  FinanceOpeningBalanceModeSchema,
  FinanceOpeningBalanceSetupResponseSchema,
  FinanceOpeningBalanceStatusSchema,
  FinanceOpeningBalanceSummarySchema,
} from './finance-opening-balance.schema';

export type FinanceOpeningBalanceModeDTO = ReturnType<
  typeof FinanceOpeningBalanceModeSchema.parse
>;

export type FinanceOpeningBalanceStatusDTO = ReturnType<
  typeof FinanceOpeningBalanceStatusSchema.parse
>;

export type FinanceOpeningBalanceDraftInputDTO = ReturnType<
  typeof FinanceOpeningBalanceDraftInputSchema.parse
>;

export type FinanceOpeningBalanceDraftDTO = ReturnType<
  typeof FinanceOpeningBalanceDraftSchema.parse
>;

export type FinanceOpeningBalanceAccountOptionDTO =
  ReturnType<
    typeof FinanceOpeningBalanceAccountOptionSchema.parse
  >;

export type FinanceOpeningBalanceInventoryItemOptionDTO =
  ReturnType<
    typeof FinanceOpeningBalanceInventoryItemOptionSchema.parse
  >;

export type FinanceOpeningBalanceLocationOptionDTO =
  ReturnType<
    typeof FinanceOpeningBalanceLocationOptionSchema.parse
  >;

export type FinanceOpeningBalanceSummaryDTO = ReturnType<
  typeof FinanceOpeningBalanceSummarySchema.parse
>;

export type FinanceOpeningBalanceSetupResponseDTO =
  ReturnType<
    typeof FinanceOpeningBalanceSetupResponseSchema.parse
  >;
