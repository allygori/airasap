import { Types, type ClientSession } from 'mongoose';
import { MemberModel } from '@/modules/members/member.model';
import { OrganizationRepository } from '@/modules/organizations/organization.repository';
import { FinanceJournalRepository } from './journal/finance-journal.repository';
import { FinanceCalendarTimezoneValueSchema } from './calendar/finance-calendar.schema';
import type { TimeZone } from '@/constant/timezone';
import { FinanceAccountService } from './accounts/finance-account.service';
import { FinanceEntitlementService } from './finance-entitlement.service';
import { FinanceDomainError } from './finance.error';
import {
  assertFinanceTenant,
  normalizeFinanceState,
  type FinanceState,
  type FinanceTenantContext,
} from './finance.types';
import type { FinanceReadinessResponseDTO } from './onboarding/finance-onboarding.dto';
import { FinanceReadinessResponseSchema } from './onboarding/finance-onboarding.schema';

type FinanceLifecycleOrganization = {
  finance?: Partial<FinanceState> | null;
};

type FinanceLifecycleRepository = {
  findFinanceState: (
    session?: ClientSession
  ) => Promise<FinanceLifecycleOrganization | null>;
  startFinance: (
    data: {
      onboarding_version: number;
      started_at: Date;
    },
    session?: ClientSession
  ) => Promise<FinanceLifecycleOrganization | null>;
  activateFinance?: (
    data: {
      onboarding_version: number;
      cut_off_date: Date;
      completed_at: Date;
      completed_by?: string;
    },
    session?: ClientSession
  ) => Promise<FinanceLifecycleOrganization | null>;
  updateFinanceCalendarTimezone?: (
    calendarTimezone: TimeZone,
    session?: ClientSession
  ) => Promise<FinanceLifecycleOrganization | null>;
};

type FinanceLifecycleJournalRepository = Pick<
  FinanceJournalRepository,
  'hasAnyEntries'
>;

type FinanceLifecycleDependencies = {
  organizationRepository?: FinanceLifecycleRepository;
  journalRepository?: FinanceLifecycleJournalRepository;
  postedJournalChecker?: (
    session?: ClientSession
  ) => Promise<boolean>;
  ownerAccessChecker?: () => Promise<boolean>;
  defaultAccountInitializer?: (
    session?: ClientSession
  ) => Promise<unknown>;
  premiumAccessChecker?: () => Promise<unknown>;
};

export class FinanceLifecycleService {
  private readonly organizationRepository: FinanceLifecycleRepository;
  private readonly postedJournalChecker: (
    session?: ClientSession
  ) => Promise<boolean>;
  private readonly context: FinanceTenantContext;
  private readonly ownerAccessChecker: () => Promise<boolean>;
  private readonly defaultAccountInitializer: (
    session?: ClientSession
  ) => Promise<unknown>;
  private readonly premiumAccessChecker: () => Promise<unknown>;

  constructor(
    context: FinanceTenantContext,
    dependencies?: FinanceLifecycleDependencies
  ) {
    assertFinanceTenant(context);
    this.context = context;
    this.organizationRepository =
      dependencies?.organizationRepository ??
      new OrganizationRepository({
        organizationId: context.organizationId,
      });
    const journalRepository =
      dependencies?.journalRepository ??
      new FinanceJournalRepository(context);
    this.postedJournalChecker =
      dependencies?.postedJournalChecker ??
      ((session) =>
        journalRepository.hasAnyEntries(session));
    this.ownerAccessChecker =
      dependencies?.ownerAccessChecker ??
      (() => this.hasOwnerAccess());
    this.defaultAccountInitializer =
      dependencies?.defaultAccountInitializer ??
      ((session) =>
        new FinanceAccountService(
          context
        ).ensureDefaultAccounts(session));
    this.premiumAccessChecker =
      dependencies?.premiumAccessChecker ??
      (() =>
        new FinanceEntitlementService(
          context
        ).assertPremium());
  }

  async getState(
    session?: ClientSession
  ): Promise<FinanceState> {
    const organization =
      await this.organizationRepository.findFinanceState(
        session
      );

    if (!organization) {
      throw new FinanceDomainError(
        'Organization tidak ditemukan.',
        'FINANCE_ORGANIZATION_NOT_FOUND'
      );
    }

    return normalizeFinanceState(organization.finance);
  }

  async assertActive(
    session?: ClientSession
  ): Promise<FinanceState> {
    const state = await this.getState(session);

    if (state.status !== 'active') {
      throw new FinanceDomainError(
        'Finance module belum aktif.',
        'FINANCE_NOT_ACTIVE'
      );
    }

    return state;
  }

  async setCalendarTimezone(
    value: unknown,
    session?: ClientSession
  ): Promise<FinanceState> {
    const calendarTimezone =
      FinanceCalendarTimezoneValueSchema.parse(value);
    await this.assertOwner();
    const state = await this.getState(session);

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
      this.organizationRepository
        .updateFinanceCalendarTimezone;
    if (!updateTimezone) {
      throw new FinanceDomainError(
        'Penyimpanan timezone kalender Finance belum tersedia.',
        'FINANCE_CALENDAR_TIMEZONE_UPDATE_FAILED'
      );
    }

    const updated = await updateTimezone.call(
      this.organizationRepository,
      calendarTimezone,
      session
    );
    if (updated) {
      return normalizeFinanceState(updated.finance);
    }

    const latest = await this.getState(session);
    if (latest.calendar_timezone === calendarTimezone) {
      return latest;
    }

    throw new FinanceDomainError(
      'Timezone kalender Finance gagal disimpan karena status onboarding berubah.',
      'FINANCE_CALENDAR_TIMEZONE_UPDATE_FAILED'
    );
  }

  async assertOwner() {
    if (!this.context.userId) {
      throw new FinanceDomainError(
        'User aktif tidak ditemukan.',
        'FINANCE_OWNER_REQUIRED'
      );
    }

    if (!(await this.ownerAccessChecker())) {
      throw new FinanceDomainError(
        'Hanya owner organization yang dapat memulai Finance onboarding.',
        'FINANCE_OWNER_REQUIRED'
      );
    }

    return true;
  }

  async getReadiness(): Promise<FinanceReadinessResponseDTO> {
    const finance = await this.getState();
    const ownerAccess = await this.ownerAccessChecker();
    const blockers = [] as Array<{
      code: 'OWNER_REQUIRED' | 'FINANCE_BLOCKED';
      message: string;
    }>;

    if (finance.status === 'blocked') {
      blockers.push({
        code: 'FINANCE_BLOCKED',
        message:
          finance.blocked_reason ??
          'Setup Finance sedang diblokir dan perlu ditinjau.',
      });
    }

    if (finance.status !== 'active' && !ownerAccess) {
      blockers.push({
        code: 'OWNER_REQUIRED',
        message:
          'Hanya owner organization yang dapat memulai atau melanjutkan setup Finance.',
      });
    }

    const readinessStatus =
      finance.status === 'active'
        ? 'active'
        : finance.status === 'blocked' ||
            blockers.length > 0
          ? 'blocked'
          : finance.status;

    return FinanceReadinessResponseSchema.parse({
      finance,
      readiness: {
        status: readinessStatus,
        owner_access: ownerAccess,
        can_start:
          finance.status === 'not_started' && ownerAccess,
        can_resume:
          finance.status === 'in_progress' && ownerAccess,
        blockers,
      },
    });
  }

  private async hasOwnerAccess() {
    if (!this.context.userId) return false;

    const member = await MemberModel.findOne({
      organizationId: this.context.organizationId,
      userId: this.context.userId,
      role: 'owner',
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } },
      ],
    })
      .select('_id role')
      .lean();

    return Boolean(member);
  }

  async start(session?: ClientSession) {
    await this.premiumAccessChecker();
    await this.assertOwner();
    const current = await this.getState(session);

    if (current.status === 'active') {
      throw new FinanceDomainError(
        'Finance onboarding sudah selesai dan tidak dapat diulang.',
        'FINANCE_ONBOARDING_ALREADY_COMPLETED'
      );
    }

    await this.defaultAccountInitializer(session);

    if (current.status === 'in_progress') {
      return current;
    }

    const updated =
      await this.organizationRepository.startFinance(
        {
          onboarding_version:
            current.onboarding_version || 1,
          started_at: new Date(),
        },
        session
      );

    if (updated) {
      return normalizeFinanceState(updated.finance);
    }

    const latest = await this.getState(session);
    if (latest.status === 'in_progress') {
      return latest;
    }

    if (latest.status === 'active') {
      throw new FinanceDomainError(
        'Finance onboarding sudah selesai dan tidak dapat diulang.',
        'FINANCE_ONBOARDING_ALREADY_COMPLETED'
      );
    }

    throw new FinanceDomainError(
      'Finance onboarding gagal dimulai karena lifecycle berubah.',
      'FINANCE_LIFECYCLE_CONFLICT'
    );
  }

  async activate(
    input: {
      onboarding_version: number;
      cut_off_date: Date;
      completed_at?: Date;
    },
    session?: ClientSession
  ): Promise<FinanceState> {
    await this.assertOwner();
    if (
      !this.context.userId ||
      !Types.ObjectId.isValid(this.context.userId)
    ) {
      throw new FinanceDomainError(
        'User aktif tidak valid untuk mengaktifkan Finance.',
        'FINANCE_OWNER_REQUIRED'
      );
    }

    const activateFinance =
      this.organizationRepository.activateFinance;
    if (!activateFinance) {
      throw new FinanceDomainError(
        'Aktivasi Finance belum tersedia.',
        'FINANCE_LIFECYCLE_CONFLICT'
      );
    }
    const updated = await activateFinance.call(
      this.organizationRepository,
      {
        ...input,
        completed_at: input.completed_at ?? new Date(),
        completed_by: this.context.userId,
      },
      session
    );
    if (updated)
      return normalizeFinanceState(updated.finance);

    const latest = await this.getState(session);
    if (
      latest.status === 'active' &&
      latest.onboarding_version === input.onboarding_version
    ) {
      return latest;
    }

    throw new FinanceDomainError(
      'Finance gagal diaktifkan karena lifecycle berubah.',
      'FINANCE_LIFECYCLE_CONFLICT'
    );
  }
}
