import type { ClientSession } from 'mongoose';
import type { AccountingTenantContext } from './accounting.types';
import { AccountingLifecycleService } from './accounting-lifecycle.service';

export const assertAccountingModuleActive = (
  context: AccountingTenantContext,
  session?: ClientSession
) =>
  new AccountingLifecycleService(context).assertActive(
    session
  );
