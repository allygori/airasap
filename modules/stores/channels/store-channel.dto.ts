import { z } from 'zod';
import {
  CreateStoreChannelSchema,
  StoreChannelBaseSchema,
  StoreChannelResponseSchema,
  UpdateStoreChannelSchema,
} from './store-channel.schema';

export type StoreChannelBaseDTO = z.infer<
  typeof StoreChannelBaseSchema
>;
export type CreateStoreChannelDTO = z.infer<
  typeof CreateStoreChannelSchema
>;
export type UpdateStoreChannelDTO = z.infer<
  typeof UpdateStoreChannelSchema
>;
export type StoreChannelResponseDTO = z.infer<
  typeof StoreChannelResponseSchema
>;
