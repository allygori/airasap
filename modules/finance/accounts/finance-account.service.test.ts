import { Types } from 'mongoose';
import type {
  FinanceAccountPersistenceRecord,
  FinanceAccountSeedRecord,
} from './finance-account.repository';
import { FinanceAccountModel } from './finance-account.model';
import { FinanceAccountService } from './finance-account.service';

const organizationId = '507f1f77bcf86cd799439010';

describe('FinanceAccountService default CoA', () => {
  it('stores accounts in the Finance-owned collection', () => {
    expect(
      FinanceAccountModel.collection.collectionName
    ).toBe('finance_accounts');
  });

  it('seeds an organization-scoped account tree idempotently', async () => {
    const records = new Map<
      string,
      FinanceAccountPersistenceRecord
    >();
    const upsertDefaultAccount = jest.fn(
      async (
        account: FinanceAccountSeedRecord,
        parentAccount: Types.ObjectId | null
      ) => {
        const existing = records.get(account.code);
        if (existing) return existing;

        const created: FinanceAccountPersistenceRecord = {
          ...account,
          _id: new Types.ObjectId(),
          organization: new Types.ObjectId(organizationId),
          parent_account: parentAccount,
        };
        records.set(account.code, created);
        return created;
      }
    );
    const service = new FinanceAccountService(
      { organizationId },
      {
        repository: {
          list: async () => [],
          findSelectableById: async () => null,
          findByCode: async (code) =>
            records.get(code) ?? null,
          upsertDefaultAccount,
        },
      }
    );

    const firstResult =
      await service.ensureDefaultAccounts();
    const cash = records.get('1110');
    const cashGroup = records.get('1100');

    expect(firstResult.organization_id).toBe(
      organizationId
    );
    expect(firstResult.account_count).toBeGreaterThan(0);
    expect(cash).toBeDefined();
    expect(cashGroup).toBeDefined();
    expect(String(cash?.parent_account)).toBe(
      String(cashGroup?._id)
    );

    const accountCount = records.size;
    const secondResult =
      await service.ensureDefaultAccounts();

    expect(secondResult.account_count).toBe(accountCount);
    expect(records.size).toBe(accountCount);
    expect(upsertDefaultAccount).toHaveBeenCalledTimes(
      accountCount * 2
    );
  });
});
