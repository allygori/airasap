import type { ClientSession } from 'mongoose';
import { FinanceJournalRepository } from './journal/finance-journal.repository';
import { FinanceCalendarTimezoneValueSchema } from './calendar/finance-calendar.schema';
import { FinanceDomainError } from './finance.error';
import { FinanceOnboardingRepository } from './onboarding/finance-onboarding.repository';
import { FinanceSettingsResponseSchema } from './onboarding/finance-onboarding.schema';
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
};

type FinanceSettingsDependencies = {
  financeRepository?: FinanceSettingsRepository;
  postedJournalChecker?: (
    session?: ClientSession
  ) => Promise<boolean>;
  ownerAccessChecker?: () => Promise<boolean>;
};

export class FinanceSettingsService {
  private readonly context: FinanceTenantContext;
  private readonly financeRepository: FinanceSettingsRepository;
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
    const state = normalizeFinanceState(
      await this.financeRepository.findFinanceState()
    );

    return FinanceSettingsResponseSchema.parse({
      status: state.status,
      calendar_timezone: state.calendar_timezone,
    });
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
