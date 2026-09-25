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
          findById: async () => null,
          updateAccountDetails: async () => null,
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
    const creditPayable = records.get('2400');

    expect(firstResult.organization_id).toBe(
      organizationId
    );
    expect(firstResult.account_count).toBeGreaterThan(0);
    expect(cash).toBeDefined();
    expect(cashGroup).toBeDefined();
    expect(String(cash?.parent_account)).toBe(
      String(cashGroup?._id)
    );
    expect(creditPayable).toMatchObject({
      name: 'Utang PayLater/Kartu Kredit',
      type: 'liability',
      subtype: 'credit_payable',
      is_postable: true,
    });

    const accountCount = records.size;
    const secondResult =
      await service.ensureDefaultAccounts();

    expect(secondResult.account_count).toBe(accountCount);
    expect(records.size).toBe(accountCount);
    expect(upsertDefaultAccount).toHaveBeenCalledTimes(
      accountCount * 2
    );
  });

  it('updates details for an organization-owned non-system account', async () => {
    const accountId = new Types.ObjectId();
    const account: FinanceAccountPersistenceRecord = {
      _id: accountId,
      organization: new Types.ObjectId(organizationId),
      code: '6990',
      name: 'Other expense',
      type: 'expense',
      normal_balance: 'debit',
      is_system: false,
      is_postable: true,
      is_active: true,
      display_order: 6990,
    };
    const updatedAccount = {
      ...account,
      name: 'Marketplace expense',
      description: 'Fees charged by marketplaces',
    };
    const updateAccountDetails = jest.fn(
      async () => updatedAccount
    );
    const service = new FinanceAccountService(
      { organizationId },
      {
        repository: {
          list: async () => [],
          findById: async () => account,
          updateAccountDetails,
          findSelectableById: async () => null,
          findByCode: async () => null,
          upsertDefaultAccount: async () => null,
        },
      }
    );

    await expect(
      service.updateDetails(String(accountId), {
        name: 'Marketplace expense',
        description: 'Fees charged by marketplaces',
      })
    ).resolves.toEqual({
      id: String(accountId),
      name: 'Marketplace expense',
      description: 'Fees charged by marketplaces',
    });
    expect(updateAccountDetails).toHaveBeenCalledWith(
      String(accountId),
      {
        name: 'Marketplace expense',
        description: 'Fees charged by marketplaces',
      },
      undefined
    );
  });

  it('keeps system accounts read-only', async () => {
    const account: FinanceAccountPersistenceRecord = {
      _id: new Types.ObjectId(),
      organization: new Types.ObjectId(organizationId),
      code: '1000',
      name: 'Assets',
      type: 'asset',
      normal_balance: 'debit',
      is_system: true,
      is_postable: false,
      is_active: true,
      display_order: 1000,
    };
    const updateAccountDetails = jest.fn(async () => null);
    const service = new FinanceAccountService(
      { organizationId },
      {
        repository: {
          list: async () => [],
          findById: async () => account,
          updateAccountDetails,
          findSelectableById: async () => null,
          findByCode: async () => null,
          upsertDefaultAccount: async () => null,
        },
      }
    );

    await expect(
      service.updateDetails(String(account._id), {
        name: 'Assets updated',
        description: null,
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_SYSTEM_ACCOUNT_READ_ONLY',
    });
    expect(updateAccountDetails).not.toHaveBeenCalled();
  });
});
