import {
  CreateOpeningBalanceSchema,
  OpeningBalanceBaseSchema,
  OpeningBalanceLineSchema,
  OpeningBalanceResponseSchema,
  OpeningBalanceStatusSchema,
  UpdateOpeningBalanceSchema,
} from './opening-balance.schema';

export type OpeningBalanceLineDTO = ReturnType<
  typeof OpeningBalanceLineSchema.parse
>;
export type OpeningBalanceStatusDTO = ReturnType<
  typeof OpeningBalanceStatusSchema.parse
>;
export type OpeningBalanceBaseDTO = ReturnType<
  typeof OpeningBalanceBaseSchema.parse
>;
export type CreateOpeningBalanceDTO = ReturnType<
  typeof CreateOpeningBalanceSchema.parse
>;
export type UpdateOpeningBalanceDTO = ReturnType<
  typeof UpdateOpeningBalanceSchema.parse
>;
export type OpeningBalanceResponseDTO = ReturnType<
  typeof OpeningBalanceResponseSchema.parse
>;
