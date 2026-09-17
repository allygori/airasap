import type { ClientSession } from 'mongoose';
import { MemberModel } from '@/modules/members/member.model';
import { StoreModel } from '@/modules/stores/store.model';
import { type TOrganization } from '@/modules/organizations/organization.model';
import { OrganizationRepository } from '@/modules/organizations/organization.repository';
import { AccountingDomainError } from './accounting.error';
import {
  assertAccountingTenant,
  type AccountingTenantContext,
} from './accounting.types';

const DEFAULT_ACCOUNTING_TIMEZONE = 'Asia/Jakarta';

type AccountingState = NonNullable<
  TOrganization['accounting']
>;

const normalizeState = (
  accounting?: Partial<AccountingState> | null
): AccountingState => ({
  status: accounting?.status ?? 'not_started',
  onboarding_version: accounting?.onboarding_version ?? 1,
  ...(accounting?.calendar_timezone
    ? { calendar_timezone: accounting.calendar_timezone }
    : {}),
  ...(accounting?.cutover_date
    ? { cutover_date: accounting.cutover_date }
    : {}),
  ...(accounting?.account_mappings
    ? { account_mappings: accounting.account_mappings }
    : {}),
  ...(accounting?.started_at
    ? { started_at: accounting.started_at }
    : {}),
  ...(accounting?.completed_at
    ? { completed_at: accounting.completed_at }
    : {}),
  ...(accounting?.completed_by
    ? { completed_by: accounting.completed_by }
    : {}),
});

export class AccountingLifecycleService {
  private readonly context: AccountingTenantContext;
  private readonly organizationRepository: OrganizationRepository;

  constructor(context: AccountingTenantContext) {
    assertAccountingTenant(context);
    this.context = context;
    this.organizationRepository =
      new OrganizationRepository({
        organizationId: context.organizationId,
      });
  }

  async getState(session?: ClientSession) {
    const organization =
      await this.organizationRepository.findAccountingState(
        session
      );
    if (!organization) {
      throw new AccountingDomainError(
        'Organization tidak ditemukan.',
        'ORGANIZATION_NOT_FOUND'
      );
    }
    return normalizeState(organization.accounting);
  }

  async assertOwner() {
    if (!this.context.userId) {
      throw new AccountingDomainError(
        'User aktif tidak ditemukan.',
        'ACCOUNTING_USER_REQUIRED'
      );
    }

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

    if (!member) {
      throw new AccountingDomainError(
        'Hanya owner organization yang dapat melakukan accounting onboarding.',
        'ACCOUNTING_OWNER_REQUIRED'
      );
    }
    return member;
  }

  async start(session?: ClientSession) {
    await this.assertOwner();
    const current = await this.getState(session);
    if (current.status === 'active') {
      throw new AccountingDomainError(
        'Accounting onboarding sudah selesai dan tidak dapat diulang.',
        'ONBOARDING_ALREADY_COMPLETED'
      );
    }
    if (current.status === 'in_progress') return current;

    const primaryStore = await StoreModel.findOne({
      organization: this.context.organizationId,
      is_active: true,
      $or: [
        { deleted_at: null },
        { deleted_at: { $exists: false } },
      ],
    })
      .sort({ created_at: 1, _id: 1 })
      .select('timezone')
      .lean();

    const updated =
      await this.organizationRepository.startAccounting(
        {
          calendar_timezone:
            primaryStore?.timezone ??
            DEFAULT_ACCOUNTING_TIMEZONE,
          onboarding_version:
            current.onboarding_version || 1,
          started_at: new Date(),
        },
        session
      );

    if (updated) return normalizeState(updated.accounting);

    const latest = await this.getState(session);
    if (latest.status === 'active') {
      throw new AccountingDomainError(
        'Accounting onboarding sudah selesai dan tidak dapat diulang.',
        'ONBOARDING_ALREADY_COMPLETED'
      );
    }
    return latest;
  }

  async assertOnboardingAvailable(session?: ClientSession) {
    const state = await this.getState(session);
    if (state.status === 'active') {
      throw new AccountingDomainError(
        'Accounting onboarding sudah selesai dan tidak dapat diakses lagi.',
        'ONBOARDING_ALREADY_COMPLETED'
      );
    }
    return state;
  }

  async assertActive(session?: ClientSession) {
    const state = await this.getState(session);
    if (state.status !== 'active') {
      throw new AccountingDomainError(
        'Accounting module belum aktif. Selesaikan onboarding terlebih dahulu.',
        'ACCOUNTING_NOT_ACTIVE'
      );
    }
    return state;
  }

  async activate(input: {
    onboarding_version: number;
    calendar_timezone: string;
    cutover_date: Date;
    account_mappings?: Record<string, unknown>;
    session?: ClientSession;
  }) {
    await this.assertOwner();
    const updated =
      await this.organizationRepository.activateAccounting(
        {
          onboarding_version: input.onboarding_version,
          calendar_timezone: input.calendar_timezone,
          cutover_date: input.cutover_date,
          account_mappings: input.account_mappings,
          completed_at: new Date(),
          completed_by: this.context.userId,
        },
        input.session
      );
    if (updated) return normalizeState(updated.accounting);

    const current = await this.getState(input.session);
    if (current.status === 'active') return current;
    throw new AccountingDomainError(
      'Accounting onboarding belum dimulai atau status berubah saat finalisasi.',
      'ACCOUNTING_LIFECYCLE_CONFLICT'
    );
  }
}
