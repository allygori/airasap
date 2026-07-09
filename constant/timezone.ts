export const TIMEZONES = {
  WIB: {
    label: 'WIB (UTC/GMT+7)',
    value: 'Asia/Jakarta',
  },
  WIT: {
    label: 'WIT (UTC/GMT+8)',
    value: 'Asia/Makassar',
  },
  WITA: {
    label: 'WITA (UTC/GMT+9)',
    value: 'Asia/Jayapura',
  },
} as const;

export const TIMEZONE_VALUES = Object.values(TIMEZONES).map(
  (tz) => tz.value
);

export type TimeZone =
  (typeof TIMEZONES)[keyof typeof TIMEZONES]['value'];
