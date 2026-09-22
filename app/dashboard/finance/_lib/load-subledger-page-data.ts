import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FINANCE_CASH_BANK_SUBTYPE_VALUES,
  FinanceDomainError,
  FinanceSubledgerListQuerySchema,
  FinanceSubledgerService,
  type FinanceSubledgerListResponseDTO,
  type FinanceSubledgerTypeDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { FinanceAccountRepository } from '@/modules/finance/accounts/finance-account.repository';

export type FinanceSubledgerPaymentAccountOption = {
  id: string;
  code: string;
  name: string;
};

export type FinanceSubledgerPageData =
  | {
      status: 'ready';
      balanceType: FinanceSubledgerTypeDTO;
      balances: FinanceSubledgerListResponseDTO;
      paymentAccounts: FinanceSubledgerPaymentAccountOption[];
    }
  | { status: 'unavailable' | 'not_ready' };

export async function getSubledgerPageData(
  balanceType: FinanceSubledgerTypeDTO
): Promise<FinanceSubledgerPageData> {
  const tenantContext = await getTenantContext();
  if (!tenantContext.organizationId) {
    return { status: 'unavailable' };
  }

  return loadSubledgerPageData(tenantContext, balanceType);
}

async function loadSubledgerPageData(
  context: FinanceTenantContext,
  balanceType: FinanceSubledgerTypeDTO
): Promise<FinanceSubledgerPageData> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);
    const accountRepository = new FinanceAccountRepository(
      context
    );
    const [balances, paymentAccounts] = await Promise.all([
      new FinanceSubledgerService(context).listBalances(
        FinanceSubledgerListQuerySchema.parse({
          balance_type: balanceType,
        })
      ),
      accountRepository.listPostableBySubtypes(
        [...FINANCE_CASH_BANK_SUBTYPE_VALUES],
        { limit: 100 }
      ),
    ]);

    return {
      status: 'ready',
      balanceType,
      balances,
      paymentAccounts: paymentAccounts.map((account) => ({
        id: String(account._id),
        code: account.code,
        name: account.name,
      })),
    };
  } catch (error) {
    if (
      error instanceof FinanceDomainError &&
      error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
    ) {
      return { status: 'unavailable' };
    }
    if (
      error instanceof FinanceDomainError &&
      error.code === 'FINANCE_NOT_ACTIVE'
    ) {
      return { status: 'not_ready' };
    }
    throw error;
  }
}
