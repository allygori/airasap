import { z } from 'zod';
import {
  FinanceSupplierCreateInputSchema,
  FinanceSupplierListQuerySchema,
  FinanceSupplierListResponseSchema,
  FinanceSupplierMutationResponseSchema,
  FinanceSupplierResponseSchema,
  FinanceSupplierUpdateInputSchema,
} from './finance-supplier.schema';

export type FinanceSupplierCreateInputDTO = z.infer<
  typeof FinanceSupplierCreateInputSchema
>;
export type FinanceSupplierUpdateInputDTO = z.infer<
  typeof FinanceSupplierUpdateInputSchema
>;
export type FinanceSupplierListQueryDTO = z.infer<
  typeof FinanceSupplierListQuerySchema
>;
export type FinanceSupplierDTO = z.infer<
  typeof FinanceSupplierResponseSchema
>;
export type FinanceSupplierListResponseDTO = z.infer<
  typeof FinanceSupplierListResponseSchema
>;
export type FinanceSupplierMutationResponseDTO = z.infer<
  typeof FinanceSupplierMutationResponseSchema
>;
