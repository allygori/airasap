export * from './order.schema';

import { z } from 'zod';
import {
  OrderItemSchema,
  OrderAddressSchema,
  OrderFeeSchema,
  OrderBaseSchema,
  CreateOrderSchema,
  UpdateOrderSchema,
  OrderResponseSchema,
  OrderFilterSchema,
  BulkUpdateStatusSchema,
  MassUploadResponseSchema,
  OrderSearchQuerySchema,
  OrderIdParamsSchema,
} from './order.schema';

export type OrderItemDTO = z.infer<typeof OrderItemSchema>;
export type OrderAddressDTO = z.infer<
  typeof OrderAddressSchema
>;
export type OrderFeeDTO = z.infer<typeof OrderFeeSchema>;
export type OrderBaseDTO = z.infer<typeof OrderBaseSchema>;
export type CreateOrderDTO = z.infer<
  typeof CreateOrderSchema
>;
export type UpdateOrderDTO = z.infer<
  typeof UpdateOrderSchema
>;
export type OrderResponseDTO = z.infer<
  typeof OrderResponseSchema
>;
export type OrderFilterDTO = z.infer<
  typeof OrderFilterSchema
>;
export type OrderSearchQueryDTO = z.infer<
  typeof OrderSearchQuerySchema
>;
export type OrderIdParamsDTO = z.infer<
  typeof OrderIdParamsSchema
>;
export type BulkUpdateStatusDTO = z.infer<
  typeof BulkUpdateStatusSchema
>;
export type MassUploadResponseDTO = z.infer<
  typeof MassUploadResponseSchema
>;
