import { z } from 'zod';
import {
  CreateFileSchema,
  UpdateFileSchema,
  QueryFilterFileSchema,
} from './file.schema';

export * from './file.schema';

/**
 * Inferred TypeScript types from Zod
 */
export type CreateFileDTO = z.infer<
  typeof CreateFileSchema
>;
export type UpdateFileDTO = z.infer<
  typeof UpdateFileSchema
>;
export type QueryFilterFileDTO = z.infer<
  typeof QueryFilterFileSchema
>;
