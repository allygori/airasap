import { z } from 'zod';
import {
  BaseFileSchema,
  CreateFileSchema,
  UpdateFileSchema,
  QueryFilterFileSchema,
} from './file.schema';

export * from './file.schema';

/**
 * Inferred TypeScript types from Zod
 */

export type BaseFileDTO = z.infer<typeof BaseFileSchema>;
export type CreateFileDTO = z.infer<
  typeof CreateFileSchema
>;
export type UpdateFileDTO = z.infer<
  typeof UpdateFileSchema
>;
export type QueryFilterFileDTO = z.infer<
  typeof QueryFilterFileSchema
>;
