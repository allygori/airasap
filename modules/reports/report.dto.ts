import { z } from 'zod';
import {
  CreateReportSchema,
  SalesReportResponseSchema,
} from './report.schema';

export * from './report.schema';

export type CreateReportDTO = z.infer<
  typeof CreateReportSchema
>;
export type SalesReportResponseDTO = z.infer<
  typeof SalesReportResponseSchema
>;
