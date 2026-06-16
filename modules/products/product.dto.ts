import { z } from 'zod';
import {
  VariantSchema,
  ProductBaseSchema,
  CreateProductSchema,
  UpdateProductSchema,
  ProductResponseSchema,
  ProductFilterSchema,
  ProductSearchQuerySchema,
  ProductIdParamsSchema,
  ProductPlatformParamsSchema,
  BulkUpdateStatusSchema,
  MassUploadResponseSchema,
} from './product.schema';

export {
  VariantSchema,
  ProductBaseSchema,
  CreateProductSchema,
  UpdateProductSchema,
  ProductResponseSchema,
  ProductFilterSchema,
  ProductSearchQuerySchema,
  ProductIdParamsSchema,
  ProductPlatformParamsSchema,
  BulkUpdateStatusSchema,
  MassUploadResponseSchema,
};

export type VariantDTO = z.infer<typeof VariantSchema>;
export type ProductBaseDTO = z.infer<
  typeof ProductBaseSchema
>;
export type CreateProductDTO = z.infer<
  typeof CreateProductSchema
>;
export type UpdateProductDTO = z.infer<
  typeof UpdateProductSchema
>;
export type ProductResponseDTO = z.infer<
  typeof ProductResponseSchema
>;
export type ProductFilterDTO = z.infer<
  typeof ProductFilterSchema
>;
export type ProductSearchQueryDTO = z.infer<
  typeof ProductSearchQuerySchema
>;
export type ProductIdParamsDTO = z.infer<
  typeof ProductIdParamsSchema
>;
export type ProductPlatformParamsDTO = z.infer<
  typeof ProductPlatformParamsSchema
>;
export type BulkUpdateStatusDTO = z.infer<
  typeof BulkUpdateStatusSchema
>;

export type MassUploadResponseDTO = z.infer<
  typeof MassUploadResponseSchema
>;
