import type { ClientSession } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import { FinanceAccountRepository } from '../accounts/finance-account.repository';
import { FinanceLifecycleService } from '../finance-lifecycle.service';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type {
  FinanceBankAccountCreateInputDTO,
  FinanceBankAccountCreateResponseDTO,
} from './finance-bank-account.dto';
import {
  FinanceBankAccountCreateInputSchema,
  FinanceBankAccountCreateResponseSchema,
} from './finance-bank-account.schema';

type FinanceBankAccountRepositoryPort = Pick<
  FinanceAccountRepository,
  | 'findSelectableByCode'
  | 'listPostableBySubtypes'
  | 'createBankAccount'
>;

type FinanceBankAccountLifecyclePort = Pick<
  FinanceLifecycleService,
  'getState' | 'assertOwner'
>;

type FinanceBankAccountOnboardingDependencies = {
  accountRepository?: FinanceBankAccountRepositoryPort;
  lifecycle?: FinanceBankAccountLifecyclePort;
};

const isDuplicateKeyError = (
  error: unknown
): error is { code: number } =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 11000;

export class FinanceBankAccountOnboardingService {
  private readonly accountRepository: FinanceBankAccountRepositoryPort;
  private readonly lifecycle: FinanceBankAccountLifecyclePort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: FinanceBankAccountOnboardingDependencies
  ) {
    assertFinanceTenant(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
    this.lifecycle =
      dependencies?.lifecycle ??
      new FinanceLifecycleService(context);
  }

  async create(
    input: FinanceBankAccountCreateInputDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceBankAccountCreateResponseDTO> {
    await this.lifecycle.assertOwner();
    const state = await this.lifecycle.getState(session);

    if (state.status === 'active') {
      throw new FinanceDomainError(
        'Finance onboarding sudah selesai.',
        'FINANCE_ONBOARDING_ALREADY_COMPLETED'
      );
    }

    if (state.status !== 'in_progress') {
      throw new FinanceDomainError(
        'Finance onboarding belum dimulai.',
        'FINANCE_ONBOARDING_NOT_IN_PROGRESS'
      );
    }

    const data =
      FinanceBankAccountCreateInputSchema.parse(input);
    const parent =
      await this.accountRepository.findSelectableByCode(
        '1120',
        session
      );

    if (
      !parent ||
      parent.type !== 'asset' ||
      parent.subtype !== 'bank'
    ) {
      throw new FinanceDomainError(
        'Akun induk Bank Finance belum tersedia.',
        'FINANCE_BANK_ACCOUNT_PARENT_NOT_FOUND'
      );
    }

    const bankAccounts =
      await this.accountRepository.listPostableBySubtypes(
        ['bank'],
        { limit: 500 },
        session
      );
    const existingCodes = new Set(
      bankAccounts.map((account) => account.code)
    );
    const accountMetadata = {
      ...(data.institution
        ? { institution: data.institution }
        : {}),
      ...(data.account_last4
        ? { account_last4: data.account_last4 }
        : {}),
      ...(data.account_holder
        ? { account_holder: data.account_holder }
        : {}),
    };

    for (let sequence = 1; sequence <= 99; sequence += 1) {
      const code = `${parent.code}${String(sequence).padStart(2, '0')}`;
      if (existingCodes.has(code)) continue;

      try {
        const account =
          await this.accountRepository.createBankAccount(
            {
              code,
              name: data.name,
              parent_account: parent._id,
              display_order: parent.display_order + 1,
              ...(Object.keys(accountMetadata).length > 0
                ? { account_metadata: accountMetadata }
                : {}),
            },
            session
          );

        if (!account) {
          throw new FinanceDomainError(
            'Rekening bank Finance gagal dibuat.',
            'FINANCE_BANK_ACCOUNT_CREATE_FAILED'
          );
        }

        return FinanceBankAccountCreateResponseSchema.parse(
          {
            account: {
              id: String(account._id),
              code: account.code,
              name: account.name,
              type: 'asset',
              subtype: 'bank',
              normal_balance: 'debit',
            },
          }
        );
      } catch (error: unknown) {
        if (!isDuplicateKeyError(error)) throw error;
        existingCodes.add(code);
      }
    }

    throw new FinanceDomainError(
      'Jumlah rekening bank Finance sudah mencapai batas.',
      'FINANCE_BANK_ACCOUNT_CODE_EXHAUSTED'
    );
  }
}
