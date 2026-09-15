import {
  CreateSettlementSchema,
  SettlementBaseSchema,
  SettlementResponseSchema,
} from './settlement.schema';

export type SettlementBaseDTO = ReturnType<
  typeof SettlementBaseSchema.parse
>;
export type CreateSettlementDTO = ReturnType<
  typeof CreateSettlementSchema.parse
>;
export type SettlementResponseDTO = ReturnType<
  typeof SettlementResponseSchema.parse
>;
