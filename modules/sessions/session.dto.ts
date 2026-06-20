import { z } from 'zod';
import {
  SessionBaseSchema,
  SessionResponseSchema,
  SessionSchema,
} from './session.schema';

export * from './session.schema';

export type SessionBaseDTO = z.infer<
  typeof SessionBaseSchema
>;
export type SessionDTO = z.infer<typeof SessionSchema>;
export type SessionResponseDTO = z.infer<
  typeof SessionResponseSchema
>;
