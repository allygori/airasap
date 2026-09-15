import { z } from 'zod';

const PeriodSchema = z
  .string()
  .regex(
    /^\d{4}-(0[1-9]|1[0-2])$/,
    'Period harus berformat YYYY-MM.'
  );

export const AccountingReportQuerySchema = z
  .object({
    period: PeriodSchema.optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
  })
  .refine(
    ({ from, to }) =>
      !from || !to || new Date(from) <= new Date(to),
    {
      path: ['to'],
      message: 'Tanggal akhir harus setelah tanggal mulai.',
    }
  )
  .refine(
    ({ period, from, to }) => !period || (!from && !to),
    {
      message:
        'Gunakan period atau from/to, bukan keduanya.',
    }
  );

export type AccountingReportQuery = ReturnType<
  typeof AccountingReportQuerySchema.parse
>;
