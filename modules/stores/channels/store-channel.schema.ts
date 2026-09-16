import { z } from 'zod';

const CHANNEL_SLUG_PATTERN =
  /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export const StoreChannelPlatformSchema = z
  .string()
  .trim()
  .min(1, 'Platform wajib diisi.')
  .regex(
    CHANNEL_SLUG_PATTERN,
    'Platform harus berupa slug, misalnya shopee atau website.'
  );

export const StoreChannelBaseSchema = z.object({
  store: z.string().trim().min(1, 'Store wajib dipilih.'),
  platform: StoreChannelPlatformSchema,
  name: z
    .string()
    .trim()
    .min(1, 'Nama koneksi wajib diisi.'),
  external_account_id: z.string().trim().optional(),
  is_active: z.boolean().default(true),
});

export const CreateStoreChannelSchema =
  StoreChannelBaseSchema;
export const UpdateStoreChannelSchema =
  StoreChannelBaseSchema.partial();
export const StoreChannelResponseSchema =
  StoreChannelBaseSchema.extend({
    _id: z.string(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  });
