import { z } from 'zod';
import {
  CreateReportSchema,
  ProductAnalyticsResponseSchema,
  SalesV2ResponseSchema,
  SalesReportResponseSchema,
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
