import { OrganizationRepository } from '@/modules/organizations/organization.repository';
import { FinanceDomainError } from './finance.error';
import {
  assertFinanceTenant,
  normalizeFinanceState,
  type FinanceStatus,
  type FinanceTenantContext,
} from './finance.types';

export const FINANCE_PREMIUM_ORGANIZATION_PLANS = [
  'pro',
  'plus',
  'enterprise',
] as const;

type FinanceEntitlementOrganization = {
  plan?: string | null;
  finance?: { status?: FinanceStatus } | null;
};

type FinanceEntitlementRepository = {
  findFinanceAccessState: () => Promise<FinanceEntitlementOrganization | null>;
};

export type FinanceAvailability = {
  available: boolean;
  status: FinanceStatus | null;
};

export class FinanceEntitlementService {
  private readonly repository: FinanceEntitlementRepository;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      repository?: FinanceEntitlementRepository;
    }
  ) {
    assertFinanceTenant(context);
    this.repository =
      dependencies?.repository ??
      new OrganizationRepository({
        organizationId: context.organizationId,
      });
  }

  async getAvailability(): Promise<FinanceAvailability> {
    const organization =
      await this.repository.findFinanceAccessState();

    if (!organization) {
      throw new FinanceDomainError(
        'Organization tidak ditemukan.',
        'FINANCE_ORGANIZATION_NOT_FOUND'
      );
    }

    // Temporary development access: keep the tier check here for later
    // rollout, but allow every organization to test Finance for now.
    // const available = FINANCE_PREMIUM_ORGANIZATION_PLANS.includes(
    //   organization.plan as (typeof FINANCE_PREMIUM_ORGANIZATION_PLANS)[number]
    // );
    const available = true;

    return {
      available,
      status: available
        ? normalizeFinanceState(organization.finance).status
        : null,
    };
  }

  async assertPremium(): Promise<FinanceAvailability> {
    const availability = await this.getAvailability();

    if (!availability.available) {
      throw new FinanceDomainError(
        'Finance tersedia untuk organisasi dengan paket premium.',
        'FINANCE_NOT_ACTIVE'
      );
    }

    return availability;
  }
}
