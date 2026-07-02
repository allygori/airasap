import { z } from 'zod';
import { CreateReportSchema } from './report.schema';

export * from './report.schema';

export type CreateReportDTO = z.infer<
  typeof CreateReportSchema
>;
