import z from 'zod';

export const ReportFormSchema = z.object({
  date: z.object({
    from: z.union([z.string(), z.date()]).optional(),
    to: z.union([z.string(), z.date()]).optional(),
    mode: z
      .enum([
        'today',
        'yesterday',
        '7-days',
        '30-days',
        'daily',
        'weekly',
        'monthly',
        'quarterly',
        'semiannually',
        'annually',
        'range',
      ])
      .optional(),
  }),
});

export type ReportFormInput = z.infer<
  typeof ReportFormSchema
>;
