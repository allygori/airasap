import type { ClientSession } from 'mongoose';
import { FinanceLifecycleService } from './finance-lifecycle.service';
import type {
  FinanceState,
  FinanceTenantContext,
} from './finance.types';

export const assertFinanceModuleActive = (
  context: FinanceTenantContext,
  session?: ClientSession
): Promise<FinanceState> =>
  new FinanceLifecycleService(context).assertActive(
    session
  );
