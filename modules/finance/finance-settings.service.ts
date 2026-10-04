import type { ClientSession } from 'mongoose';
import { FinanceJournalRepository } from './journal/finance-journal.repository';
import { FinanceCalendarTimezoneValueSchema } from './calendar/finance-calendar.schema';
import { FinanceAccountRepository } from './accounts/finance-account.repository';
import { FinanceDomainError } from './finance.error';
import { FinanceOnboardingRepository } from './onboarding/finance-onboarding.repository';
import {
  FinanceSettingsResponseSchema,
  UpdateFinanceShopeePayoutSettingsSchema,
} from './onboarding/finance-onboarding.schema';
import { hasFinanceOwnerAccess } from './finance-owner-access';
import {
  assertFinanceTenant,
  normalizeFinanceState,
  type FinanceState,
  type FinanceTenantContext,
} from './finance.types';

type FinanceSettingsRepository = {
  findFinanceState: (
    session?: ClientSession
  ) => Promise<FinanceState | null>;
  updateFinanceCalendarTimezone?: (
    calendarTimezone: FinanceState['calendar_timezone'],
    session?: ClientSession
  ) => Promise<FinanceState | null>;
  updateShopeePayoutAccount?: (
    accountId: string,
    session?: ClientSession
  ) => Promise<FinanceState | null>;
};

type FinanceSettingsAccountRepository = Pick<
  FinanceAccountRepository,
  'listPostableBySubtypes' | 'findSelectableById'
>;

type FinanceSettingsDependencies = {
  financeRepository?: FinanceSettingsRepository;
  accountRepository?: FinanceSettingsAccountRepository;
  postedJournalChecker?: (
    session?: ClientSession
  ) => Promise<boolean>;
  ownerAccessChecker?: () => Promise<boolean>;
};

export class FinanceSettingsService {
  private readonly context: FinanceTenantContext;
  private readonly financeRepository: FinanceSettingsRepository;
  private readonly accountRepository: FinanceSettingsAccountRepository;
  private readonly postedJournalChecker: (
    session?: ClientSession
  ) => Promise<boolean>;
  private readonly ownerAccessChecker: () => Promise<boolean>;

  constructor(
    context: FinanceTenantContext,
    dependencies?: FinanceSettingsDependencies
  ) {
    assertFinanceTenant(context);
    this.context = context;
    this.financeRepository =
      dependencies?.financeRepository ??
      new FinanceOnboardingRepository(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
    const journalRepository = new FinanceJournalRepository(
      context
    );
    this.postedJournalChecker =
      dependencies?.postedJournalChecker ??
      ((session) =>
        journalRepository.hasAnyEntries(session));
    this.ownerAccessChecker =
      dependencies?.ownerAccessChecker ??
      (() => hasFinanceOwnerAccess(context));
  }

  async getSettings() {
    const [storedState, payoutAccounts] = await Promise.all(
      [
        this.financeRepository.findFinanceState(),
        this.accountRepository.listPostableBySubtypes(
          ['bank', 'e_wallet'],
          { limit: 500 }
        ),
      ]
    );
    const state = normalizeFinanceState(storedState);
    const options = payoutAccounts.map((account) => ({
      id: String(account._id),
      code: account.code,
      name: account.name,
      subtype: account.subtype as 'bank' | 'e_wallet',
    }));
    const selectedAccountId = options.some(
      (account) =>
        account.id === state.shopee_payout_account_id
    )
      ? state.shopee_payout_account_id
      : (options[0]?.id ?? null);

    return FinanceSettingsResponseSchema.parse({
      status: state.status,
      calendar_timezone: state.calendar_timezone,
      shopee_payout_account_id: selectedAccountId,
      payout_accounts: options,
    });
  }

  async setShopeePayoutAccount(
    value: unknown,
    session?: ClientSession
  ): Promise<FinanceState> {
    const { shopee_payout_account_id: accountId } =
      UpdateFinanceShopeePayoutSettingsSchema.parse(value);
    await this.assertOwner();

    const state = normalizeFinanceState(
      await this.financeRepository.findFinanceState(session)
    );
    if (
      state.status !== 'in_progress' &&
      state.status !== 'active'
    ) {
      throw new FinanceDomainError(
        'Akun tujuan payout hanya dapat diubah selama atau setelah setup Finance.',
        'FINANCE_PAYOUT_ACCOUNT_SETTINGS_LOCKED'
      );
    }

    const account =
      await this.accountRepository.findSelectableById(
        accountId,
        session
      );
    if (
      !account ||
      account.type !== 'asset' ||
      (account.subtype !== 'bank' &&
        account.subtype !== 'e_wallet')
    ) {
      throw new FinanceDomainError(
        'Pilih rekening bank atau akun e-wallet aktif.',
        'FINANCE_PAYOUT_ACCOUNT_INVALID'
      );
    }

    const update =
      this.financeRepository.updateShopeePayoutAccount;
    if (!update) {
      throw new FinanceDomainError(
        'Penyimpanan akun tujuan payout belum tersedia.',
        'FINANCE_PAYOUT_ACCOUNT_UPDATE_FAILED'
      );
    }

    const updated = await update.call(
      this.financeRepository,
      accountId,
      session
    );
    if (updated) return normalizeFinanceState(updated);

    const latest = normalizeFinanceState(
      await this.financeRepository.findFinanceState(session)
    );
    if (latest.shopee_payout_account_id === accountId) {
      return latest;
    }

    throw new FinanceDomainError(
      'Akun tujuan payout gagal disimpan karena status Finance berubah.',
      'FINANCE_PAYOUT_ACCOUNT_UPDATE_FAILED'
    );
  }

  async setCalendarTimezone(
    value: unknown,
    session?: ClientSession
  ): Promise<FinanceState> {
    const calendarTimezone =
      FinanceCalendarTimezoneValueSchema.parse(value);
    await this.assertOwner();

    const state = normalizeFinanceState(
      await this.financeRepository.findFinanceState(session)
    );

    if (state.status !== 'in_progress') {
      throw new FinanceDomainError(
        'Timezone kalender hanya dapat diubah selama onboarding Finance.',
        state.status === 'active'
          ? 'FINANCE_CALENDAR_TIMEZONE_LOCKED'
          : 'FINANCE_ONBOARDING_NOT_IN_PROGRESS'
      );
    }

    if (state.calendar_timezone === calendarTimezone) {
      return state;
    }

    if (await this.postedJournalChecker(session)) {
      throw new FinanceDomainError(
        'Timezone kalender tidak dapat diubah setelah jurnal Finance pertama dibuat.',
        'FINANCE_CALENDAR_TIMEZONE_LOCKED'
      );
    }

    const updateTimezone =
      this.financeRepository.updateFinanceCalendarTimezone;
    if (!updateTimezone) {
      throw new FinanceDomainError(
        'Penyimpanan timezone kalender Finance belum tersedia.',
        'FINANCE_CALENDAR_TIMEZONE_UPDATE_FAILED'
      );
    }

    const updated = await updateTimezone.call(
      this.financeRepository,
      calendarTimezone,
      session
    );
    if (updated) return normalizeFinanceState(updated);

    const latest = normalizeFinanceState(
      await this.financeRepository.findFinanceState(session)
    );
    if (latest.calendar_timezone === calendarTimezone) {
      return latest;
    }

    throw new FinanceDomainError(
      'Timezone kalender Finance gagal disimpan karena status onboarding berubah.',
      'FINANCE_CALENDAR_TIMEZONE_UPDATE_FAILED'
    );
  }

  private async assertOwner() {
    if (
      !this.context.userId ||
      !(await this.ownerAccessChecker())
    ) {
      throw new FinanceDomainError(
        'Hanya owner organization yang dapat mengubah pengaturan Finance.',
        'FINANCE_OWNER_REQUIRED'
      );
    }
  }
}
