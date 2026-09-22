import type { ClientSession } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import {
  FinanceAccountRepository,
  type FinanceAccountPersistenceRecord,
} from './finance-account.repository';
import { FINANCE_SALES_ACCOUNT_ROLE_VALUES } from '../sales/finance-sales.constants';

export type FinanceAccountRole =
  (typeof FINANCE_SALES_ACCOUNT_ROLE_VALUES)[number];

type FinanceAccountRoleDefinition = {
  subtype: string;
  fallback_code: string;
};

const ROLE_DEFINITIONS: Record<
  FinanceAccountRole,
  FinanceAccountRoleDefinition
> = {
  marketplace_receivable: {
    subtype: 'marketplace_receivable',
    fallback_code: '1210',
  },
  sales_revenue: {
    subtype: 'product_sales',
    fallback_code: '4100',
  },
};

type FinanceAccountRoleRepositoryPort = Pick<
  FinanceAccountRepository,
  'findSelectableByCode' | 'findSelectableBySubtype'
>;

/**
 * Resolves Finance-owned logical posting roles to selectable COA accounts.
 * The account collection is currently shared for migration compatibility, but
 * the role contract deliberately does not depend on legacy accounting state.
 */
export class FinanceAccountRoleResolverService {
  private readonly repository: FinanceAccountRoleRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      repository?: FinanceAccountRoleRepositoryPort;
    }
  ) {
    assertFinanceTenant(context);
    this.repository =
      dependencies?.repository ??
      new FinanceAccountRepository(context);
  }

  async resolve(
    role: FinanceAccountRole,
    session?: ClientSession
  ): Promise<FinanceAccountPersistenceRecord> {
    const definition = ROLE_DEFINITIONS[role];
    const account =
      (await this.repository.findSelectableBySubtype(
        definition.subtype,
        session
      )) ??
      (await this.repository.findSelectableByCode(
        definition.fallback_code,
        session
      ));

    if (!account) {
      throw new FinanceDomainError(
        `Account Finance untuk role ${role} belum tersedia.`,
        'FINANCE_SALES_ACCOUNT_MAPPING_MISSING'
      );
    }

    return account;
  }
}
