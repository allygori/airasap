import { parse } from 'date-fns';
import { tz, TZDate } from '@date-fns/tz';
import type { TimeZone } from '@/constant/timezone';

export const parseToISOStringWithTimezone = (
  val: unknown,
  timezone: TimeZone,
  format: string = 'yyyy-MM-dd HH:mm'
): string | null => {
  if (val === null || val === undefined || val === '') {
    return null;
  }

  if (val instanceof Date) {
    return isNaN(val.getTime())
      ? null
      : new TZDate(val, timezone).toISOString();
  }

  if (typeof val === 'string') {
    try {
      // const parsedDate = parse(val, format, new Date(), {
      //   in: tz(timezone),
      // });
      const parsedDate = new TZDate(val, timezone);

      console.log(
        `parseToISOStringWithTimezone val === 'string', parsedDate`,
        parsedDate
      );
      return isNaN(parsedDate.getTime())
        ? null
        : parsedDate.toISOString();
    } catch {
      return null;
    }
  }

  if (typeof val === 'number') {
    const parsedDate = new TZDate(val, timezone);
    return isNaN(parsedDate.getTime())
      ? null
      : parsedDate.toISOString();
  }

  return null;
};
