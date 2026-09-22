import { Types } from 'mongoose';
import { z } from 'zod';
import {
  OrganizationFinanceSchema,
  OrganizationFinanceStatusSchema,
} from '@/modules/organizations/organization.schema';
import { FinanceDomainError } from './finance.error';

export type FinanceTenantContext = {
  organizationId: string;
  userId?: string;
  storeId?: string;
};

export type FinanceState = z.infer<
  typeof OrganizationFinanceSchema
>;

export type FinanceStatus = z.infer<
  typeof OrganizationFinanceStatusSchema
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
  ...(finance?.started_at
    ? { started_at: finance.started_at }
    : {}),
  ...(finance?.completed_at
    ? { completed_at: finance.completed_at }
    : {}),
  ...(finance?.completed_by
    ? { completed_by: finance.completed_by }
    : {}),
});
