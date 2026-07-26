import { z } from 'zod';
import {
  CreateStoreSchema,
  UpdateStoreSchema,
  StoreFilterSchema,
} from './store.schema';

export * from './store.schema';

/**
 * Inferred TypeScript types dari Zod
 */
export type CreateStoreDTO = z.infer<
  typeof CreateStoreSchema
>;
export type UpdateStoreDTO = z.infer<
  typeof UpdateStoreSchema
>;
export type StoreFilterDTO = z.infer<
  typeof StoreFilterSchema
>;
