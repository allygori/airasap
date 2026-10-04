import type { ClientSession } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import { FinanceAccountRepository } from '../accounts/finance-account.repository';
import { FinanceLifecycleService } from '../finance-lifecycle.service';
import type { FinanceOnboardingRepository } from './finance-onboarding.repository';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type {
  FinanceEWalletAccountCreateInputDTO,
  FinanceEWalletAccountCreateResponseDTO,
} from './finance-e-wallet-account.dto';
import {
  FinanceEWalletAccountCreateInputSchema,
  FinanceEWalletAccountCreateResponseSchema,
} from './finance-e-wallet-account.schema';

type FinanceEWalletAccountRepositoryPort = Pick<
  FinanceAccountRepository,
  'listPostableBySubtypes' | 'createEWalletAccount'
> &
  Partial<
    Pick<
      FinanceAccountRepository,
      'findByCode' | 'findSelectableByCode'
    >
  >;

type FinanceEWalletOnboardingDependencies = {
  accountRepository?: FinanceEWalletAccountRepositoryPort;
  onboardingRepository?: Pick<
    FinanceOnboardingRepository,
    'setShopeePayoutAccountIfMissing'
  >;
  lifecycle?: Pick<
    FinanceLifecycleService,
    'getState' | 'assertOwner'
  >;
};

const isDuplicateKeyError = (
  error: unknown
): error is { code: number } =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 11000;

export class FinanceEWalletAccountOnboardingService {
  private readonly accountRepository: FinanceEWalletAccountRepositoryPort;
  private readonly onboardingRepository?: Pick<
    FinanceOnboardingRepository,
    'setShopeePayoutAccountIfMissing'
  >;
  private readonly lifecycle: Pick<
    FinanceLifecycleService,
    'getState' | 'assertOwner'
  >;

  constructor(
    context: FinanceTenantContext,
    dependencies?: FinanceEWalletOnboardingDependencies
  ) {
    assertFinanceTenant(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
    this.onboardingRepository =
      dependencies?.onboardingRepository;
    this.lifecycle =
      dependencies?.lifecycle ??
      new FinanceLifecycleService(context);
  }

  async create(
    input: FinanceEWalletAccountCreateInputDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceEWalletAccountCreateResponseDTO> {
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
      FinanceEWalletAccountCreateInputSchema.parse(input);
    const findParent =
      this.accountRepository.findByCode ??
      this.accountRepository.findSelectableByCode;
    const parent = findParent
      ? await findParent.call(
          this.accountRepository,
          '1140',
          session
        )
      : null;

    if (
      !parent ||
      parent.type !== 'asset' ||
      parent.subtype !== 'e_wallet'
    ) {
      throw new FinanceDomainError(
        'Akun induk Saldo E-wallet Finance belum tersedia.',
        'FINANCE_E_WALLET_ACCOUNT_PARENT_NOT_FOUND'
      );
    }

    const eWalletAccounts =
      await this.accountRepository.listPostableBySubtypes(
        ['e_wallet'],
        { limit: 500 },
        session
      );
    const existingCodes = new Set(
      eWalletAccounts.map((account) => account.code)
    );

    for (let sequence = 1; sequence <= 99; sequence += 1) {
      const code = `${parent.code}${String(sequence).padStart(2, '0')}`;
      if (existingCodes.has(code)) continue;

      try {
        const account =
          await this.accountRepository.createEWalletAccount(
            {
              code,
              name: data.name,
              parent_account: parent._id,
              display_order: parent.display_order + 1,
              account_metadata: { provider: data.provider },
            },
            session
          );

        if (!account) {
          throw new FinanceDomainError(
            'Akun e-wallet Finance gagal dibuat.',
            'FINANCE_E_WALLET_ACCOUNT_CREATE_FAILED'
          );
        }

        await this.onboardingRepository?.setShopeePayoutAccountIfMissing(
          String(account._id),
          session
        );

        return FinanceEWalletAccountCreateResponseSchema.parse(
          {
            account: {
              id: String(account._id),
              code: account.code,
              name: account.name,
              type: 'asset',
              subtype: 'e_wallet',
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
      'Jumlah akun e-wallet Finance sudah mencapai batas.',
      'FINANCE_E_WALLET_ACCOUNT_CODE_EXHAUSTED'
    );
  }
}
