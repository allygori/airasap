import { OrganizationRepository } from '@/modules/organizations/organization.repository';
import { FinanceDomainError } from './finance.error';
import { FinanceOnboardingRepository } from './onboarding/finance-onboarding.repository';
import {
  assertFinanceTenant,
  normalizeFinanceState,
  type FinanceStatus,
  type FinanceTenantContext,
} from './finance.types';

export { FINANCE_PREMIUM_ORGANIZATION_PLANS } from '@/constant/finance/entitlement';

type FinanceEntitlementOrganization = {
  plan?: string | null;
};

type FinanceEntitlementOrganizationRepository = {
  findPlanState: () => Promise<FinanceEntitlementOrganization | null>;
};

type FinanceEntitlementStateRepository = Pick<
  FinanceOnboardingRepository,
  'findFinanceState'
>;

export type FinanceAvailability = {
  available: boolean;
  status: FinanceStatus | null;
};

export class FinanceEntitlementService {
  private readonly organizationRepository: FinanceEntitlementOrganizationRepository;
  private readonly financeRepository: FinanceEntitlementStateRepository;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      organizationRepository?: FinanceEntitlementOrganizationRepository;
      financeRepository?: FinanceEntitlementStateRepository;
    }
  ) {
    assertFinanceTenant(context);
    this.organizationRepository =
      dependencies?.organizationRepository ??
      new OrganizationRepository({
        organizationId: context.organizationId,
      });
    this.financeRepository =
      dependencies?.financeRepository ??
      new FinanceOnboardingRepository(context);
  }

  async getAvailability(): Promise<FinanceAvailability> {
    const [organization, finance] = await Promise.all([
      this.organizationRepository.findPlanState(),
      this.financeRepository.findFinanceState(),
    ]);

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
        ? normalizeFinanceState(finance).status
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
