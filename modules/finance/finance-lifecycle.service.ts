import type { ClientSession } from 'mongoose';
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

  constructor(context: FinanceTenantContext) {
    assertFinanceTenant(context);
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
}
