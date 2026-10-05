import { Types } from 'mongoose';
import type {
  FinanceAccountPersistenceRecord,
  FinanceBankAccountRecord,
  FinanceCashBankAccountDetailsRecord,
  FinanceEWalletAccountRecord,
} from '../accounts/finance-account.repository';
import { FinanceCashBankAccountManagementService } from './finance-cash-bank-account-management.service';

const organizationId = '507f1f77bcf86cd799439010';
const bankParentId = new Types.ObjectId();
const eWalletParentId = new Types.ObjectId();
const bankAccountId = new Types.ObjectId();
const eWalletAccountId = new Types.ObjectId();

const bankParent: FinanceAccountPersistenceRecord = {
  _id: bankParentId,
  organization: new Types.ObjectId(organizationId),
  code: '1120',
  name: 'Bank Operasional',
  type: 'asset',
  subtype: 'bank',
  normal_balance: 'debit',
  is_system: true,
  is_postable: false,
  is_active: true,
  display_order: 112,
};

const eWalletParent: FinanceAccountPersistenceRecord = {
  ...bankParent,
  _id: eWalletParentId,
  code: '1140',
  name: 'Saldo E-wallet',
  subtype: 'e_wallet',
  display_order: 114,
};

const bankAccount: FinanceAccountPersistenceRecord = {
  _id: bankAccountId,
  organization: new Types.ObjectId(organizationId),
  code: '112001',
  name: 'BCA •••• 1234',
  type: 'asset',
  subtype: 'bank',
  parent_account: bankParentId,
  normal_balance: 'debit',
  is_system: false,
  is_postable: true,
  is_active: true,
  display_order: 113,
  account_metadata: {
    institution: 'BCA',
    account_last4: '1234',
  },
};

const eWalletAccount: FinanceAccountPersistenceRecord = {
  ...bankAccount,
  _id: eWalletAccountId,
  code: '114001',
  name: 'DANA •••• 5678',
  subtype: 'e_wallet',
  parent_account: eWalletParentId,
  display_order: 115,
  account_metadata: {
    provider: 'DANA',
    account_last4: '5678',
  },
};

const makeService = (options?: {
  owner?: boolean;
  accounts?: FinanceAccountPersistenceRecord[];
  payoutAccountId?: string | null;
}) => {
  const accounts = [
    ...(options?.accounts ?? [bankAccount]),
  ];
  const parents = [bankParent, eWalletParent];

  const createBankAccount = jest.fn(
    async (record: FinanceBankAccountRecord) => {
      const created: FinanceAccountPersistenceRecord = {
        _id: new Types.ObjectId(),
        organization: new Types.ObjectId(organizationId),
        code: record.code,
        name: record.name,
        type: 'asset',
        subtype: 'bank',
        parent_account: record.parent_account,
        normal_balance: 'debit',
        is_system: false,
        is_postable: true,
        is_active: true,
        display_order: record.display_order,
        account_metadata: record.account_metadata,
      };
      accounts.push(created);
      return created;
    }
  );
  const createEWalletAccount = jest.fn(
    async (record: FinanceEWalletAccountRecord) => {
      const created: FinanceAccountPersistenceRecord = {
        _id: new Types.ObjectId(),
        organization: new Types.ObjectId(organizationId),
        code: record.code,
        name: record.name,
        type: 'asset',
        subtype: 'e_wallet',
        parent_account: record.parent_account,
        normal_balance: 'debit',
        is_system: false,
        is_postable: true,
        is_active: true,
        display_order: record.display_order,
        account_metadata: record.account_metadata,
      };
      accounts.push(created);
      return created;
    }
  );
  const updateCashBankAccountDetails = jest.fn(
    async (
      accountId: string,
      data: FinanceCashBankAccountDetailsRecord
    ) => {
      const index = accounts.findIndex(
        (account) => String(account._id) === accountId
      );
      if (index < 0) return null;

      const updated: FinanceAccountPersistenceRecord = {
        ...accounts[index],
        name: data.name,
        account_metadata: {
          ...accounts[index].account_metadata,
          ...data.account_metadata,
        },
      };
      accounts[index] = updated;
      return updated;
    }
  );
  const setCashBankAccountActive = jest.fn(
    async (accountId: string, isActive: boolean) => {
      const index = accounts.findIndex(
        (account) => String(account._id) === accountId
      );
      if (index < 0) return null;

      const updated = {
        ...accounts[index],
        is_active: isActive,
      };
      accounts[index] = updated;
      return updated;
    }
  );

  const service =
    new FinanceCashBankAccountManagementService(
      {
        organizationId,
        userId: '507f1f77bcf86cd799439011',
      },
      {
        accountRepository: {
          findById: async (accountId) =>
            [...accounts, ...parents].find(
              (account) => String(account._id) === accountId
            ) ?? null,
          findByCode: async (code) =>
            parents.find(
              (account) => account.code === code
            ) ?? null,
          listCashBankAccounts: async () => accounts,
          createBankAccount,
          createEWalletAccount,
          updateCashBankAccountDetails,
          setCashBankAccountActive,
        },
        lifecycle: {
          assertOwner: async () => {
            if (options?.owner === false) {
              throw { code: 'FINANCE_OWNER_REQUIRED' };
            }
            return true;
          },
          assertActive: async () => ({
            status: 'active' as const,
            onboarding_version: 1,
            calendar_timezone: 'Asia/Jakarta' as const,
            shopee_payout_account_id:
              options?.payoutAccountId ?? null,
          }),
        },
      }
    );

  return {
    service,
    accounts,
    createBankAccount,
    createEWalletAccount,
    updateCashBankAccountDetails,
    setCashBankAccountActive,
  };
};

describe('FinanceCashBankAccountManagementService', () => {
  it('creates a bank account after Finance is active', async () => {
    const { service, createBankAccount } = makeService();

    const account = await service.createAccount({
      subtype: 'bank',
      institution: 'Mandiri',
      account_last4: '0042',
    });

    expect(account).toMatchObject({
      code: '112002',
      name: 'Mandiri •••• 0042',
      subtype: 'bank',
      is_active: true,
      account_metadata: {
        institution: 'Mandiri',
        account_last4: '0042',
        provider: null,
      },
    });
    expect(createBankAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        code: '112002',
        parent_account: bankParentId,
        account_metadata: {
          institution: 'Mandiri',
          account_last4: '0042',
        },
      }),
      undefined
    );
  });

  it('creates an e-wallet account after Finance is active', async () => {
    const { service, createEWalletAccount } = makeService();

    const account = await service.createAccount({
      subtype: 'e_wallet',
      provider: 'GoPay',
      account_last4: '0007',
    });

    expect(account).toMatchObject({
      code: '114001',
      name: 'GoPay •••• 0007',
      subtype: 'e_wallet',
      is_active: true,
      account_metadata: {
        provider: 'GoPay',
        account_last4: '0007',
        institution: null,
      },
    });
    expect(createEWalletAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        code: '114001',
        parent_account: eWalletParentId,
        account_metadata: {
          provider: 'GoPay',
          account_last4: '0007',
        },
      }),
      undefined
    );
  });

  it('updates account label metadata without changing account type', async () => {
    const { service, updateCashBankAccountDetails } =
      makeService();

    const account = await service.updateAccount(
      String(bankAccountId),
      {
        subtype: 'bank',
        institution: 'BCA',
        account_last4: '4321',
      }
    );

    expect(account).toMatchObject({
      name: 'BCA •••• 4321',
      subtype: 'bank',
      account_metadata: {
        institution: 'BCA',
        account_last4: '4321',
      },
    });
    expect(
      updateCashBankAccountDetails
    ).toHaveBeenCalledWith(
      String(bankAccountId),
      {
        name: 'BCA •••• 4321',
        account_metadata: {
          institution: 'BCA',
          account_last4: '4321',
        },
      },
      undefined
    );
  });

  it('rejects changing an account from bank to e-wallet', async () => {
    const { service, updateCashBankAccountDetails } =
      makeService();

    await expect(
      service.updateAccount(String(bankAccountId), {
        subtype: 'e_wallet',
        provider: 'DANA',
        account_last4: '4321',
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_ACCOUNT_UPDATE_FAILED',
    });
    expect(
      updateCashBankAccountDetails
    ).not.toHaveBeenCalled();
  });

  it('blocks deactivating the current Shopee payout account', async () => {
    const { service, setCashBankAccountActive } =
      makeService({
        accounts: [bankAccount, eWalletAccount],
        payoutAccountId: String(bankAccountId),
      });

    await expect(
      service.setAccountActive(String(bankAccountId), {
        is_active: false,
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_CASH_BANK_ACCOUNT_PAYOUT_DEFAULT',
    });
    expect(setCashBankAccountActive).not.toHaveBeenCalled();
  });

  it('keeps at least one active bank or e-wallet account', async () => {
    const { service, setCashBankAccountActive } =
      makeService({
        payoutAccountId: null,
      });

    await expect(
      service.setAccountActive(String(bankAccountId), {
        is_active: false,
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_RECEIVING_ACCOUNT_REQUIRED',
    });
    expect(setCashBankAccountActive).not.toHaveBeenCalled();
  });

  it('deactivates an account when another receiving account remains', async () => {
    const { service, setCashBankAccountActive } =
      makeService({
        accounts: [bankAccount, eWalletAccount],
        payoutAccountId: String(eWalletAccountId),
      });

    const account = await service.setAccountActive(
      String(bankAccountId),
      { is_active: false }
    );

    expect(account.is_active).toBe(false);
    expect(setCashBankAccountActive).toHaveBeenCalledWith(
      String(bankAccountId),
      false,
      undefined
    );
  });

  it('requires Organization owner access for changes', async () => {
    const { service, createEWalletAccount } = makeService({
      owner: false,
    });

    await expect(
      service.createAccount({
        subtype: 'e_wallet',
        provider: 'DANA',
        account_last4: '0042',
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_OWNER_REQUIRED',
    });
    expect(createEWalletAccount).not.toHaveBeenCalled();
  });
});
