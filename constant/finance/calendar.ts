import { TIMEZONES } from '@/constant/timezone';

export const FINANCE_DEFAULT_CALENDAR_TIMEZONE =
  TIMEZONES.WIB.value;

export const FINANCE_CALENDAR_TIMEZONE_OPTIONS = [
  {
    label: TIMEZONES.WIB.label,
    value: TIMEZONES.WIB.value,
  },
  {
    label: TIMEZONES.WITA.label,
    value: TIMEZONES.WITA.value,
  },
  {
    label: TIMEZONES.WIT.label,
    value: TIMEZONES.WIT.value,
  },
] as const;
