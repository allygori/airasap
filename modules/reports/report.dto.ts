import { z } from 'zod';
import {
  CreateReportSchema,
  CustomerReportResponseSchema,
  OperationReportResponseSchema,
  ProductAnalyticsResponseSchema,
  SalesV2ResponseSchema,
  SalesReportResponseSchema,
  VoucherReportResponseSchema,
} from './report.schema';

export * from './report.schema';

export type CreateReportDTO = z.infer<
  typeof CreateReportSchema
>;
export type SalesReportResponseDTO = z.infer<
  typeof SalesReportResponseSchema
>;
export type ProductAnalyticsResponseDTO = z.infer<
  typeof ProductAnalyticsResponseSchema
>;
export type SalesV2ResponseDTO = z.infer<
  typeof SalesV2ResponseSchema
>;
export type CustomerReportResponseDTO = z.infer<
  typeof CustomerReportResponseSchema
>;
export type VoucherReportResponseDTO = z.infer<
  typeof VoucherReportResponseSchema
>;
export type OperationReportResponseDTO = z.infer<
  typeof OperationReportResponseSchema
>;
