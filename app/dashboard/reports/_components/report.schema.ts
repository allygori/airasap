import z from 'zod';

export const ReportFormSchema = z.object({
  date: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

export type ReportFormInput = z.infer<
  typeof ReportFormSchema
>;
