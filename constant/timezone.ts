export const TIMEZONES = {
  WIB: {
    label: 'WIB (UTC/GMT+7)',
    value: 'Asia/Jakarta',
  },
  WITA: {
    label: 'WITA (UTC/GMT+8)',
    value: 'Asia/Makassar',
  },
  WIT: {
    label: 'WIT (UTC/GMT+9)',
    value: 'Asia/Jayapura',
  },
} as const;

export const TIMEZONE_VALUES = [
  TIMEZONES.WIB.value,
  TIMEZONES.WITA.value,
  TIMEZONES.WIT.value,
] as const;

export type TimeZone = (typeof TIMEZONE_VALUES)[number];
