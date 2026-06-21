import { z } from 'zod';
import {
  BaseAccountSchema,
  CreateAccountSchema,
  UpdateAccountSchema,
} from './account.schema';

export * from './account.schema';

/**
 * Inferred TypeScript types from Zod
 */
export type BaseAccountDTO = z.infer<
  typeof BaseAccountSchema
>;
export type CreateAccountDTO = z.infer<
  typeof CreateAccountSchema
>;
export type UpdateAccountDTO = z.infer<
  typeof UpdateAccountSchema
>;
