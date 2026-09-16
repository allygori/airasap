import { z } from 'zod';

/**
 * Canonical dimensions for organization-level accounting.
 *
 * `store` is the workspace/brand operating unit. `platform` is the sales
 * channel, not a property of Store. Physical stock is represented by an
 * inventory location, not by a warehouse entity.
 */
export const AccountingDimensionsSchema = z.object({
  store: z.string().trim().min(1).optional(),
  platform: z.string().trim().min(1).optional(),
  product: z.string().trim().min(1).optional(),
  inventory_location: z.string().trim().min(1).optional(),
});

export type AccountingDimensions = z.infer<
  typeof AccountingDimensionsSchema
>;

export const createAccountingDimensions = (
  dimensions: AccountingDimensions
) => AccountingDimensionsSchema.parse(dimensions);
