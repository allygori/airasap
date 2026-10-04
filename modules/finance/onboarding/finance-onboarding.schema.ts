import { z } from 'zod';
import { FINANCE_DEFAULT_CALENDAR_TIMEZONE } from '../calendar/finance-calendar.constants';
import { FinanceCalendarTimezoneValueSchema } from '../calendar/finance-calendar.schema';

export const FINANCE_STATUS_VALUES = [
  'not_started',
  'in_progress',
  'blocked',
  'active',
] as const;

export const FinanceStatusSchema = z.enum(
  FINANCE_STATUS_VALUES
);

export const FinanceLifecycleStateSchema = z.object({
  status: FinanceStatusSchema.default('not_started'),
  onboarding_version: z
    .number()
    .int()
    .positive()
    .default(1),
  started_at: z.date().optional(),
  blocked_reason: z.string().min(1).optional(),
  cut_off_date: z.date().optional(),
  completed_at: z.date().optional(),
  completed_by: z.string().optional(),
});

export const FinanceSettingsSchema = z.object({
  calendar_timezone:
    FinanceCalendarTimezoneValueSchema.default(
      FINANCE_DEFAULT_CALENDAR_TIMEZONE
    ),
});

/** Flat Finance state contract used by Finance workflows and APIs. */
export const FinanceStateSchema =
  FinanceLifecycleStateSchema.extend(
    FinanceSettingsSchema.shape
  );

export type FinanceStatus = z.infer<
  typeof FinanceStatusSchema
>;
export type FinanceState = z.infer<
  typeof FinanceStateSchema
>;

export const FinanceSettingsResponseSchema = z.object({
  status: FinanceStatusSchema,
  calendar_timezone: FinanceCalendarTimezoneValueSchema,
});

export const UpdateFinanceSettingsSchema = z
  .object({
    calendar_timezone: FinanceCalendarTimezoneValueSchema,
  })
  .strict();

export type FinanceSettingsUpdate = z.infer<
  typeof UpdateFinanceSettingsSchema
>;

export const FinanceReadinessStatusSchema =
  FinanceStateSchema.shape.status;

export const FinanceReadinessBlockerCodeSchema = z.enum([
  'OWNER_REQUIRED',
  'FINANCE_BLOCKED',
]);

export const FinanceReadinessBlockerSchema = z.object({
  code: FinanceReadinessBlockerCodeSchema,
  message: z.string().min(1),
});

export const FinanceReadinessSchema = z.object({
  status: FinanceReadinessStatusSchema,
  owner_access: z.boolean(),
  can_start: z.boolean(),
  can_resume: z.boolean(),
  blockers: z.array(FinanceReadinessBlockerSchema),
});

export const FinanceReadinessResponseSchema = z.object({
  finance: FinanceStateSchema,
  readiness: FinanceReadinessSchema,
});
