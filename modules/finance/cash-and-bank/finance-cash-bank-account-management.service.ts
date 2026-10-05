import type { ClientSession } from 'mongoose';
import { FinanceAccountRepository } from '../accounts/finance-account.repository';
import { FinanceDomainError } from '../finance.error';
import { FinanceLifecycleService } from '../finance-lifecycle.service';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type {
  FinanceCashBankAccountActiveInputDTO,
  FinanceCashBankAccountManagementInputDTO,
  FinanceCashBankManagedAccountDTO,
  FinanceCashBankManagedAccountsResponseDTO,
} from './finance-cash-bank-account-management.dto';
import {
  FinanceCashBankAccountActiveInputSchema,
  FinanceCashBankAccountManagementInputSchema,
  FinanceCashBankManagedAccountSchema,
  FinanceCashBankManagedAccountsResponseSchema,
} from './finance-cash-bank-account-management.schema';

type FinanceCashBankAccountManagementRepositoryPort = Pick<
  FinanceAccountRepository,
  | 'findById'
  | 'findByCode'
  | 'listCashBankAccounts'
  | 'createBankAccount'
  | 'createEWalletAccount'
  | 'updateCashBankAccountDetails'
  | 'setCashBankAccountActive'
>;

type FinanceCashBankAccountManagementDependencies = {
  accountRepository?: FinanceCashBankAccountManagementRepositoryPort;
  lifecycle?: Pick<
    FinanceLifecycleService,
    'assertActive' | 'assertOwner'
  >;
};

type ManagedAccountSubtype = 'bank' | 'e_wallet';

const isDuplicateKeyError = (
  error: unknown
): error is { code: number } =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 11000;

const getParentCode = (subtype: ManagedAccountSubtype) =>
  subtype === 'bank' ? '1120' : '1140';

const mapAccount = (
  account: Awaited<
    ReturnType<FinanceAccountRepository['findById']>
  >
): FinanceCashBankManagedAccountDTO => {
  if (
    !account ||
    (account.subtype !== 'bank' &&
      account.subtype !== 'e_wallet')
  ) {
    throw new FinanceDomainError(
      'Akun bank atau e-wallet tidak ditemukan.',
      'FINANCE_ACCOUNT_NOT_FOUND'
    );
  }

  return FinanceCashBankManagedAccountSchema.parse({
    id: String(account._id),
    code: account.code,
    name: account.name,
    subtype: account.subtype,
    is_active: account.is_active,
    account_metadata: {
      institution:
        account.account_metadata?.institution ?? null,
      provider: account.account_metadata?.provider ?? null,
      account_last4:
        account.account_metadata?.account_last4 ?? null,
    },
  });
};

export class FinanceCashBankAccountManagementService {
  private readonly accountRepository: FinanceCashBankAccountManagementRepositoryPort;
  private readonly lifecycle: Pick<
    FinanceLifecycleService,
    'assertActive' | 'assertOwner'
  >;

  constructor(
    context: FinanceTenantContext,
    dependencies?: FinanceCashBankAccountManagementDependencies
  ) {
    assertFinanceTenant(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
    this.lifecycle =
      dependencies?.lifecycle ??
      new FinanceLifecycleService(context);
  }

  async listAccounts(
    session?: ClientSession
  ): Promise<FinanceCashBankManagedAccountsResponseDTO> {
    await this.lifecycle.assertActive(session);
    const accounts =
      await this.accountRepository.listCashBankAccounts(
        session
      );

    return FinanceCashBankManagedAccountsResponseSchema.parse(
      {
        accounts: accounts.map((account) =>
          mapAccount(account)
        ),
      }
    );
  }

  async createAccount(
    input:
      | FinanceCashBankAccountManagementInputDTO
      | unknown,
    session?: ClientSession
  ): Promise<FinanceCashBankManagedAccountDTO> {
    await this.assertOwnerAndActive(session);
    const data =
      FinanceCashBankAccountManagementInputSchema.parse(
        input
      );
    const parentCode = getParentCode(data.subtype);
    const parent = await this.accountRepository.findByCode(
      parentCode,
      session
    );

    if (
      !parent ||
      parent.type !== 'asset' ||
      parent.subtype !== data.subtype ||
      parent.is_postable
    ) {
      throw new FinanceDomainError(
        'Akun induk bank atau e-wallet Finance belum tersedia.',
        data.subtype === 'bank'
          ? 'FINANCE_BANK_ACCOUNT_PARENT_NOT_FOUND'
          : 'FINANCE_E_WALLET_ACCOUNT_PARENT_NOT_FOUND'
      );
    }

    const accounts =
      await this.accountRepository.listCashBankAccounts(
        session
      );
    const existingCodes = new Set(
      accounts
        .filter(
          (account) => account.subtype === data.subtype
        )
        .map((account) => account.code)
    );

    for (let sequence = 1; sequence <= 99; sequence += 1) {
      const code = `${parent.code}${String(sequence).padStart(2, '0')}`;
      if (existingCodes.has(code)) continue;

      try {
        const account =
          data.subtype === 'bank'
            ? await this.accountRepository.createBankAccount(
                {
                  code,
                  name: `${data.institution} •••• ${data.account_last4}`,
                  parent_account: parent._id,
                  display_order: parent.display_order + 1,
                  account_metadata: {
                    institution: data.institution,
                    account_last4: data.account_last4,
                  },
                },
                session
              )
            : await this.accountRepository.createEWalletAccount(
                {
                  code,
                  name: `${data.provider} •••• ${data.account_last4}`,
                  parent_account: parent._id,
                  display_order: parent.display_order + 1,
                  account_metadata: {
                    provider: data.provider,
                    account_last4: data.account_last4,
                  },
                },
                session
              );

        if (!account) {
          throw new FinanceDomainError(
            'Akun bank atau e-wallet gagal dibuat.',
            data.subtype === 'bank'
              ? 'FINANCE_BANK_ACCOUNT_CREATE_FAILED'
              : 'FINANCE_E_WALLET_ACCOUNT_CREATE_FAILED'
          );
        }

        return mapAccount(account);
      } catch (error: unknown) {
        if (!isDuplicateKeyError(error)) throw error;
        existingCodes.add(code);
      }
    }

    throw new FinanceDomainError(
      'Jumlah akun bank atau e-wallet Finance sudah mencapai batas.',
      data.subtype === 'bank'
        ? 'FINANCE_BANK_ACCOUNT_CODE_EXHAUSTED'
        : 'FINANCE_E_WALLET_ACCOUNT_CODE_EXHAUSTED'
    );
  }

  async updateAccount(
    accountId: string,
    input:
      | FinanceCashBankAccountManagementInputDTO
      | unknown,
    session?: ClientSession
  ): Promise<FinanceCashBankManagedAccountDTO> {
    await this.assertOwnerAndActive(session);
    const data =
      FinanceCashBankAccountManagementInputSchema.parse(
        input
      );
    const current = await this.findManageableAccount(
      accountId,
      session
    );

    if (current.subtype !== data.subtype) {
      throw new FinanceDomainError(
        'Jenis akun tidak dapat diubah.',
        'FINANCE_ACCOUNT_UPDATE_FAILED'
      );
    }

    const updated =
      await this.accountRepository.updateCashBankAccountDetails(
        accountId,
        {
          name:
            data.subtype === 'bank'
              ? `${data.institution} •••• ${data.account_last4}`
              : `${data.provider} •••• ${data.account_last4}`,
          account_metadata:
            data.subtype === 'bank'
              ? {
                  institution: data.institution,
                  account_last4: data.account_last4,
                }
              : {
                  provider: data.provider,
                  account_last4: data.account_last4,
                },
        },
        session
      );

    if (!updated) {
      throw new FinanceDomainError(
        'Akun bank atau e-wallet gagal diubah.',
        'FINANCE_ACCOUNT_UPDATE_FAILED'
      );
    }

    return mapAccount(updated);
  }

  async setAccountActive(
    accountId: string,
    input: FinanceCashBankAccountActiveInputDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceCashBankManagedAccountDTO> {
    await this.assertOwnerAndActive(session);
    const { is_active: isActive } =
      FinanceCashBankAccountActiveInputSchema.parse(input);
    const current = await this.findManageableAccount(
      accountId,
      session
    );

    if (current.is_active === isActive)
      return mapAccount(current);

    if (!isActive) {
      const state =
        await this.lifecycle.assertActive(session);
      if (state.shopee_payout_account_id === accountId) {
        throw new FinanceDomainError(
          'Pilih akun payout Shopee lain di Pengaturan Finance sebelum menonaktifkan akun ini.',
          'FINANCE_CASH_BANK_ACCOUNT_PAYOUT_DEFAULT'
        );
      }

      const activeAccounts = (
        await this.accountRepository.listCashBankAccounts(
          session
        )
      ).filter((account) => account.is_active);

      if (activeAccounts.length <= 1) {
        throw new FinanceDomainError(
          'Finance harus memiliki minimal satu akun bank atau e-wallet aktif.',
          'FINANCE_RECEIVING_ACCOUNT_REQUIRED'
        );
      }
    }

    const updated =
      await this.accountRepository.setCashBankAccountActive(
        accountId,
        isActive,
        session
      );

    if (!updated) {
      throw new FinanceDomainError(
        'Akun bank atau e-wallet gagal diperbarui.',
        'FINANCE_ACCOUNT_UPDATE_FAILED'
      );
    }

    return mapAccount(updated);
  }

  private async assertOwnerAndActive(
    session?: ClientSession
  ) {
    await this.lifecycle.assertOwner();
    return this.lifecycle.assertActive(session);
  }

  private async findManageableAccount(
    accountId: string,
    session?: ClientSession
  ) {
    const account = await this.accountRepository.findById(
      accountId,
      session
    );

    if (
      !account ||
      account.type !== 'asset' ||
      !account.is_postable ||
      account.is_system ||
      (account.subtype !== 'bank' &&
        account.subtype !== 'e_wallet') ||
      !account.parent_account
    ) {
      throw new FinanceDomainError(
        'Akun bank atau e-wallet tidak ditemukan.',
        'FINANCE_ACCOUNT_NOT_FOUND'
      );
    }

    const parent = await this.accountRepository.findById(
      String(account.parent_account),
      session
    );
    if (
      !parent ||
      parent.code !== getParentCode(account.subtype) ||
      parent.subtype !== account.subtype ||
      parent.is_postable
    ) {
      throw new FinanceDomainError(
        'Akun bank atau e-wallet tidak ditemukan.',
        'FINANCE_ACCOUNT_NOT_FOUND'
      );
    }

    return account;
  }
}
