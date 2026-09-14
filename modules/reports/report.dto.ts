import { z } from 'zod';
import {
  CreateReportSchema,
  CustomerReportResponseSchema,
  OperationReportResponseSchema,
  ProductAnalyticsResponseSchema,
  OrderReportResponseSchema,
  SalesReportResponseSchema,
  VoucherReportResponseSchema,
  OverviewReportResponseSchema,
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
export type OrderReportResponseDTO = z.infer<
  typeof OrderReportResponseSchema
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
export type OverviewReportResponseDTO = z.infer<
  typeof OverviewReportResponseSchema
>;
