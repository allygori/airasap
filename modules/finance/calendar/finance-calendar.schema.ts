import { z } from 'zod';
import { TIMEZONE_VALUES } from '@/constant/timezone';
import { FINANCE_DEFAULT_CALENDAR_TIMEZONE } from './finance-calendar.constants';

export const FinanceCalendarTimezoneValueSchema =
  z.enum(TIMEZONE_VALUES);

export const FinanceCalendarTimezoneSchema =
  FinanceCalendarTimezoneValueSchema.default(
    FINANCE_DEFAULT_CALENDAR_TIMEZONE
  );

export type FinanceCalendarTimezone = z.infer<
  typeof FinanceCalendarTimezoneSchema
>;
