import { Types } from 'mongoose';
import type {
  FinanceAccountPersistenceRecord,
  FinanceEWalletAccountRecord,
} from '../accounts/finance-account.repository';
import { FinanceEWalletAccountOnboardingService } from './finance-e-wallet-account-onboarding.service';

const organizationId = '507f1f77bcf86cd799439010';
const parentId = new Types.ObjectId();
const accountId = new Types.ObjectId();

const parentAccount: FinanceAccountPersistenceRecord = {
  _id: parentId,
  organization: new Types.ObjectId(organizationId),
  code: '1140',
  name: 'Saldo E-wallet',
  type: 'asset',
  subtype: 'e_wallet',
  normal_balance: 'debit',
  is_system: true,
  is_postable: false,
  is_active: true,
  display_order: 114,
};

const makeService = (options?: {
  status?: 'not_started' | 'in_progress' | 'active';
  owner?: boolean;
  existingAccounts?: FinanceAccountPersistenceRecord[];
}) => {
  const createEWalletAccount = jest.fn(
    async (record: FinanceEWalletAccountRecord) => {
      const created: FinanceAccountPersistenceRecord = {
        _id: accountId,
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

      return created;
    }
  );
  const setShopeePayoutAccountIfMissing = jest.fn(
    async () => undefined
  );

  const service =
    new FinanceEWalletAccountOnboardingService(
      {
        organizationId,
        userId: '507f1f77bcf86cd799439011',
      },
      {
        accountRepository: {
          findSelectableByCode: async () => parentAccount,
          listPostableBySubtypes: async () =>
            options?.existingAccounts ?? [],
          createEWalletAccount,
        },
        onboardingRepository: {
          setShopeePayoutAccountIfMissing,
        },
        lifecycle: {
          assertOwner: async () => {
            if (options?.owner === false) {
              throw { code: 'FINANCE_OWNER_REQUIRED' };
            }
            return true;
          },
          getState: async () => ({
            status: options?.status ?? 'in_progress',
            onboarding_version: 1,
            calendar_timezone: 'Asia/Jakarta',
          }),
        },
      }
    );

  return {
    service,
    createEWalletAccount,
    setShopeePayoutAccountIfMissing,
  };
};

describe('FinanceEWalletAccountOnboardingService', () => {
  it('creates a child account with generated name and required metadata', async () => {
    const {
      service,
      createEWalletAccount,
      setShopeePayoutAccountIfMissing,
    } = makeService();

    const result = await service.create({
      provider: 'DANA',
      account_last4: '0042',
    });

    expect(result.account).toMatchObject({
      id: accountId.toString(),
      code: '114001',
      name: 'DANA •••• 0042',
      type: 'asset',
      subtype: 'e_wallet',
      normal_balance: 'debit',
    });
    expect(createEWalletAccount).toHaveBeenCalledWith(
      {
        code: '114001',
        name: 'DANA •••• 0042',
        parent_account: parentId,
        display_order: parentAccount.display_order + 1,
        account_metadata: {
          provider: 'DANA',
          account_last4: '0042',
        },
      },
      undefined
    );
    expect(
      setShopeePayoutAccountIfMissing
    ).toHaveBeenCalledWith(accountId.toString(), undefined);
  });

  it('uses the next unused child account code', async () => {
    const existingAccount: FinanceAccountPersistenceRecord =
      {
        ...parentAccount,
        _id: new Types.ObjectId(),
        code: '114001',
        name: 'GoPay •••• 1234',
        parent_account: parentId,
        is_system: false,
        is_postable: true,
      };
    const { service, createEWalletAccount } = makeService({
      existingAccounts: [existingAccount],
    });

    await service.create({
      provider: 'DANA',
      account_last4: '0042',
    });

    expect(createEWalletAccount).toHaveBeenCalledWith(
      expect.objectContaining({ code: '114002' }),
      undefined
    );
  });

  it('does not create an account unless onboarding is in progress', async () => {
    const { service, createEWalletAccount } = makeService({
      status: 'not_started',
    });

    await expect(
      service.create({
        provider: 'DANA',
        account_last4: '0042',
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_ONBOARDING_NOT_IN_PROGRESS',
    });
    expect(createEWalletAccount).not.toHaveBeenCalled();
  });

  it('requires Organization owner access', async () => {
    const { service, createEWalletAccount } = makeService({
      owner: false,
    });

    await expect(
      service.create({
        provider: 'DANA',
        account_last4: '0042',
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_OWNER_REQUIRED',
    });
    expect(createEWalletAccount).not.toHaveBeenCalled();
  });

  it('rejects invalid digits before creating an account', async () => {
    const { service, createEWalletAccount } = makeService();

    await expect(
      service.create({
        provider: 'DANA',
        account_last4: '42',
      })
    ).rejects.toThrow();
    expect(createEWalletAccount).not.toHaveBeenCalled();
  });
});
