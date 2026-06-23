import { z } from 'zod';
import {
  BaseProductCostSchema,
  CreateProductCostSchema,
  UpdateProductCostSchema,
  QueryFilterProductCostSchema,
} from './product-cost.schema';

export * from './product-cost.schema';

export type BaseProductCostDTO = z.infer<
  typeof BaseProductCostSchema
>;
export type CreateProductCostDTO = z.infer<
  typeof CreateProductCostSchema
>;
export type UpdateProductCostDTO = z.infer<
  typeof UpdateProductCostSchema
>;
export type QueryFilterProductCostDTO = z.infer<
  typeof QueryFilterProductCostSchema
>;
