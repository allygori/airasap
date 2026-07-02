import z from 'zod';

export const CreateReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});
