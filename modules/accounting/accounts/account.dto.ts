import {
  AccountBaseSchema,
  AccountFilterSchema,
  AccountResponseSchema,
  CreateAccountSchema,
  UpdateAccountSchema,
} from './account.schema';

export type AccountBaseDTO = ReturnType<
  typeof AccountBaseSchema.parse
>;
export type CreateAccountDTO = ReturnType<
  typeof CreateAccountSchema.parse
>;
export type UpdateAccountDTO = ReturnType<
  typeof UpdateAccountSchema.parse
>;
export type AccountResponseDTO = ReturnType<
  typeof AccountResponseSchema.parse
>;
export type AccountFilterDTO = ReturnType<
  typeof AccountFilterSchema.parse
>;
