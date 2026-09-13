import { endOfDay, startOfDay } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import type { TimeZone } from '@/constant/timezone';

/**
 * Build inclusive UTC boundaries for a calendar date range in a store's
 * timezone. The returned values are plain Date instances whose epoch values
 * are stable regardless of the Node.js process timezone.
 */
export const getReportDateRange = (
  startDate: string,
  endDate: string,
  timezone: TimeZone
) => {
  const start = startOfDay(new TZDate(startDate, timezone));
  const end = endOfDay(new TZDate(endDate, timezone));

  return {
    startDate: new Date(start),
    endDate: new Date(end),
  };
};
