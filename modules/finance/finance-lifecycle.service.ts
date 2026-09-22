import type { ClientSession } from 'mongoose';
import { MemberModel } from '@/modules/members/member.model';
import { OrganizationRepository } from '@/modules/organizations/organization.repository';
import { FinanceDomainError } from './finance.error';
import {
  assertFinanceTenant,
  normalizeFinanceState,
  type FinanceState,
  type FinanceTenantContext,
} from './finance.types';

export class FinanceLifecycleService {
  private readonly organizationRepository: OrganizationRepository;
  private readonly context: FinanceTenantContext;

  constructor(context: FinanceTenantContext) {
    assertFinanceTenant(context);
    this.context = context;
    this.organizationRepository =
      new OrganizationRepository({
        organizationId: context.organizationId,
      });
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

  async assertOwner() {
    if (!this.context.userId) {
      throw new FinanceDomainError(
        'User aktif tidak ditemukan.',
        'FINANCE_OWNER_REQUIRED'
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
      throw new FinanceDomainError(
        'Hanya owner organization yang dapat memulai Finance onboarding.',
        'FINANCE_OWNER_REQUIRED'
      );
    }

    return member;
  }

  async start(session?: ClientSession) {
    await this.assertOwner();
    const current = await this.getState(session);

    if (current.status === 'active') {
      throw new FinanceDomainError(
        'Finance onboarding sudah selesai dan tidak dapat diulang.',
        'FINANCE_ONBOARDING_ALREADY_COMPLETED'
      );
    }

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
}
