import { Types } from 'mongoose';
import { z } from 'zod';
import {
  FinanceStateSchema,
  FinanceStatusSchema,
} from './onboarding/finance-onboarding.schema';
import { FinanceDomainError } from './finance.error';

export type FinanceTenantContext = {
  organizationId: string;
  userId?: string;
  storeId?: string;
};

export type FinanceState = z.infer<
  typeof FinanceStateSchema
>;

export type FinanceStatus = z.infer<
  typeof FinanceStatusSchema
>;

export const assertFinanceTenant = (
  context: FinanceTenantContext
) => {
  if (!context.organizationId) {
    throw new FinanceDomainError(
      'Organization ID tidak ditemukan.',
      'FINANCE_TENANT_REQUIRED'
    );
  }

  if (!Types.ObjectId.isValid(context.organizationId)) {
    throw new FinanceDomainError(
      'Organization ID tidak valid.',
      'FINANCE_TENANT_REQUIRED'
    );
  }
};

export const normalizeFinanceState = (
  finance?: Partial<FinanceState> | null
): FinanceState => ({
  status: finance?.status ?? 'not_started',
  onboarding_version: finance?.onboarding_version ?? 1,
  calendar_timezone:
    finance?.calendar_timezone ?? 'Asia/Jakarta',
  shopee_payout_account_id:
    finance?.shopee_payout_account_id ?? null,
  ...(finance?.started_at
    ? { started_at: finance.started_at }
    : {}),
  ...(finance?.blocked_reason
    ? { blocked_reason: finance.blocked_reason }
    : {}),
  ...(finance?.cut_off_date
    ? { cut_off_date: finance.cut_off_date }
    : {}),
  ...(finance?.completed_at
    ? { completed_at: finance.completed_at }
    : {}),
  ...(finance?.completed_by
    ? { completed_by: String(finance.completed_by) }
    : {}),
});
