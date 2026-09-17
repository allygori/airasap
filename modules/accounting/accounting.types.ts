import { Types } from 'mongoose';

export type AccountingTenantContext = {
  organizationId: string;
  userId?: string;
};

export const ACCOUNTING_SOURCE_TYPE_VALUES = [
  'manual',
  'order',
  'expense',
  'purchase',
  'inventory_movement',
  'opening_balance',
  'marketplace_settlement',
  'capital_contribution',
  'owner_distribution',
  'journal_reversal',
] as const;

export type AccountingSourceType =
  (typeof ACCOUNTING_SOURCE_TYPE_VALUES)[number];

export type AccountingReference = {
  source_type?: string;
  source_id?: string;
  source_event?: string;
  idempotency_key?: string;
};

export type AuditEntityType =
  | 'account'
  | 'accounting_period'
  | 'journal_entry'
  | 'opening_balance'
  | 'expense'
  | 'inventory_movement'
  | 'settlement';

export type AccountingSessionOptions = {
  session?: import('mongoose').ClientSession;
};

export const toAccountingObjectId = (
  value: string,
  fieldName: string
) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new Error(
      `${fieldName} harus berupa ObjectId yang valid.`
    );
  }

  return new Types.ObjectId(value);
};

export const assertAccountingTenant = (
  context: AccountingTenantContext
) => {
  toAccountingObjectId(
    context.organizationId,
    'organizationId'
  );
};

export const getZonedDateParts = (
  date: Date,
  timezone = 'UTC'
) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    calendar: 'iso8601',
    numberingSystem: 'latn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
};

export const getPeriodKeyFromDate = (
  date: Date,
  timezone = 'UTC'
) => {
  const { year, month } = getZonedDateParts(date, timezone);
  return `${year}-${String(month).padStart(2, '0')}`;
};

const getTimezoneOffsetMilliseconds = (
  date: Date,
  timezone: string
) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const offset = parts.find(
    (part) => part.type === 'timeZoneName'
  )?.value;
  if (!offset || offset === 'GMT') return 0;

  const match = offset.match(
    /^GMT([+-])(\d{2}):?(\d{2})?$/
  );
  if (!match) {
    throw new Error(
      'Timezone offset ' + offset + ' tidak dapat diproses.'
    );
  }
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);
  const milliseconds = (hours * 60 + minutes) * 60 * 1000;
  return match[1] === '+' ? milliseconds : -milliseconds;
};

export const zonedDateTimeToUtc = (
  input: {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
  },
  timezone = 'UTC'
) => {
  const utcGuess = new Date(
    Date.UTC(
      input.year,
      input.month - 1,
      input.day,
      input.hour ?? 0,
      input.minute ?? 0,
      input.second ?? 0,
      input.millisecond ?? 0
    )
  );
  const first = new Date(
    utcGuess.getTime() -
      getTimezoneOffsetMilliseconds(utcGuess, timezone)
  );
  return new Date(
    utcGuess.getTime() -
      getTimezoneOffsetMilliseconds(first, timezone)
  );
};

export const getAccountingPeriodDateRange = (
  periodKey: string,
  timezone = 'UTC'
) => {
  const match = periodKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error(
      'Period ' + periodKey + ' tidak valid.'
    );
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const start = zonedDateTimeToUtc(
    { year, month, day: 1 },
    timezone
  );
  const nextMonth =
    month === 12
      ? { year: year + 1, month: 1 }
      : { year, month: month + 1 };
  const nextStart = zonedDateTimeToUtc(
    {
      year: nextMonth.year,
      month: nextMonth.month,
      day: 1,
    },
    timezone
  );
  return {
    start_date: start,
    end_date: new Date(nextStart.getTime() - 1),
  };
};

export const parseAccountingDate = (
  value: string | Date,
  fieldName: string
) => {
  const date =
    value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `${fieldName} harus berupa tanggal yang valid.`
    );
  }

  return date;
};

export const parseAccountingCalendarDate = (
  value: string | Date,
  timezone: string,
  fieldName: string
) => {
  if (value instanceof Date)
    return parseAccountingDate(value, fieldName);
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return parseAccountingDate(value, fieldName);
  return zonedDateTimeToUtc(
    {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    },
    timezone
  );
};

export const validateSourceReference = (
  reference: AccountingReference
) => {
  const hasSourceType = Boolean(reference.source_type);
  const hasSourceId = Boolean(reference.source_id);

  if (hasSourceType !== hasSourceId) {
    throw new Error(
      'source_type dan source_id harus diisi bersama.'
    );
  }

  if (reference.source_event && !hasSourceType) {
    throw new Error(
      'source_event membutuhkan source_type dan source_id.'
    );
  }
};
