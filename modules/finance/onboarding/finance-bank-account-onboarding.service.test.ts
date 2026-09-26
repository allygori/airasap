import { Types } from 'mongoose';
import type {
  FinanceAccountPersistenceRecord,
  FinanceBankAccountRecord,
} from '../accounts/finance-account.repository';
import { FinanceBankAccountOnboardingService } from './finance-bank-account-onboarding.service';

const organizationId = '507f1f77bcf86cd799439010';
const parentId = new Types.ObjectId();

const parentAccount: FinanceAccountPersistenceRecord = {
  _id: parentId,
  organization: new Types.ObjectId(organizationId),
  code: '1120',
  name: 'Bank Operasional',
  type: 'asset',
  subtype: 'bank',
  normal_balance: 'debit',
  is_system: false,
  is_postable: true,
  is_active: true,
  display_order: 112,
};

const makeService = (options?: {
  status?: 'not_started' | 'in_progress' | 'active';
  owner?: boolean;
  bankAccounts?: FinanceAccountPersistenceRecord[];
  createBankAccount?: (
    record: FinanceBankAccountRecord
  ) => Promise<FinanceAccountPersistenceRecord | null>;
}) => {
  const createdRecords: FinanceAccountPersistenceRecord[] =
    [];
  const createBankAccount = jest.fn(
    options?.createBankAccount ??
      (async (record: FinanceBankAccountRecord) => {
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
        createdRecords.push(created);
        return created;
      })
  );

  const service = new FinanceBankAccountOnboardingService(
    { organizationId, userId: '507f1f77bcf86cd799439011' },
    {
      accountRepository: {
        findSelectableByCode: async () => parentAccount,
        listPostableBySubtypes: async () => [
          ...(options?.bankAccounts ?? [parentAccount]),
          ...createdRecords,
        ],
        createBankAccount,
      },
      lifecycle: {
        assertOwner: async () => {
          if (options?.owner === false) {
            throw {
              code: 'FINANCE_OWNER_REQUIRED',
            };
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

  return { service, createBankAccount };
};

describe('FinanceBankAccountOnboardingService', () => {
  it('creates an organization-scoped CoA bank account with optional metadata', async () => {
    const { service, createBankAccount } = makeService();

    const result = await service.create({
      name: 'BCA Operasional',
      institution: 'BCA',
      account_last4: '1234',
      account_holder: 'Toko Contoh',
    });

    expect(result.account).toMatchObject({
      code: '112001',
      name: 'BCA Operasional',
      type: 'asset',
      subtype: 'bank',
      normal_balance: 'debit',
    });
    expect(createBankAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        code: '112001',
        name: 'BCA Operasional',
        parent_account: parentId,
        account_metadata: {
          institution: 'BCA',
          account_last4: '1234',
          account_holder: 'Toko Contoh',
        },
      }),
      undefined
    );
  });

  it('selects the next unused code when prior bank accounts exist', async () => {
    const existing: FinanceAccountPersistenceRecord = {
      ...parentAccount,
      _id: new Types.ObjectId(),
      code: '112001',
      name: 'Mandiri Utama',
      parent_account: parentId,
    };
    const { service, createBankAccount } = makeService({
      bankAccounts: [parentAccount, existing],
    });

    await service.create({
      name: 'BCA Cabang',
      institution: '',
      account_last4: '',
      account_holder: '',
    });

    expect(createBankAccount).toHaveBeenCalledWith(
      expect.objectContaining({ code: '112002' }),
      undefined
    );
  });

  it('does not create a bank account unless onboarding is in progress', async () => {
    const { service, createBankAccount } = makeService({
      status: 'not_started',
    });

    await expect(
      service.create({
        name: 'BCA Operasional',
        institution: '',
        account_last4: '',
        account_holder: '',
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_ONBOARDING_NOT_IN_PROGRESS',
    });
    expect(createBankAccount).not.toHaveBeenCalled();
  });

  it('requires organization owner access', async () => {
    const { service, createBankAccount } = makeService({
      owner: false,
    });

    await expect(
      service.create({
        name: 'BCA Operasional',
        institution: '',
        account_last4: '',
        account_holder: '',
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_OWNER_REQUIRED',
    });
    expect(createBankAccount).not.toHaveBeenCalled();
  });
});
