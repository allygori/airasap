import type { ClientSession } from 'mongoose';
import { FinanceLifecycleService } from './finance-lifecycle.service';
import type {
  FinanceState,
  FinanceTenantContext,
} from './finance.types';
import { FinanceEntitlementService } from './finance-entitlement.service';

export const assertFinancePremium = (
  context: FinanceTenantContext
): Promise<{
  available: boolean;
  status: import('./finance.types').FinanceStatus | null;
}> =>
  new FinanceEntitlementService(context).assertPremium();

export const assertFinanceModuleActive = async (
  context: FinanceTenantContext,
  session?: ClientSession
): Promise<FinanceState> => {
  await new FinanceEntitlementService(
    context
  ).assertPremium();
  return new FinanceLifecycleService(context).assertActive(
    session
  );
};
