import type { ClientSession } from 'mongoose';
import { OrganizationModel } from '@/modules/organizations/organization.model';
import { AccountingDomainError } from '../accounting.error';
import type { AccountingTenantContext } from '../accounting.types';
import { AccountingAccountRepository } from './account.repository';

export type AccountingAccountRole =
  | 'sales_revenue'
  | 'marketplace_balance'
  | 'marketplace_receivable'
  | 'merchandise_inventory'
  | 'merchandise_cogs'
  | 'marketplace_fee'
  | 'opening_balance_equity'
  | 'expense_payable';

type ResolverInput = {
  role: AccountingAccountRole;
  platform?: string;
  feeCategory?: string;
  fallbackCode?: string;
  session?: ClientSession;
};

export class AccountingAccountResolver {
  private readonly repository: AccountingAccountRepository;
  private readonly context: AccountingTenantContext;

  constructor(context: AccountingTenantContext) {
    this.context = context;
    this.repository = new AccountingAccountRepository(
      context
    );
  }

  async resolve(input: ResolverInput) {
    const query = OrganizationModel.findById(
      this.context.organizationId
    ).select('accounting.account_mappings');
    if (input.session) query.session(input.session);
    const organization = await query.lean();
    const mappings = organization?.accounting
      ?.account_mappings as
      | Record<string, unknown>
      | undefined;

    const configured = this.getConfiguredAccountId(
      mappings,
      input.role,
      input.platform,
      input.feeCategory
    );
    const account = configured
      ? (
          await this.repository.findByIds(
            [configured],
            input.session
          )
        )[0]
      : input.fallbackCode
        ? await this.repository.findByCode(
            input.fallbackCode,
            input.session
          )
        : null;

    if (!account) {
      throw new AccountingDomainError(
        `Account untuk role ${input.role}${input.platform ? ` (${input.platform})` : ''} belum dikonfigurasi.`,
        'ACCOUNT_MAPPING_MISSING'
      );
    }
    if (!account.is_active || !account.is_postable) {
      throw new AccountingDomainError(
        `Account ${account.code} tidak aktif atau tidak dapat digunakan untuk posting.`,
        'ACCOUNT_MAPPING_INVALID'
      );
    }
    return account;
  }

  private getConfiguredAccountId(
    mappings: Record<string, unknown> | undefined,
    role: AccountingAccountRole,
    platform?: string,
    feeCategory?: string
  ) {
    if (!mappings) return undefined;
    if (role === 'marketplace_receivable' && platform) {
      const platformMappings =
        mappings.marketplace_receivables as
          | Record<string, string>
          | undefined;
      return platformMappings?.[platform];
    }
    if (role === 'marketplace_balance' && platform) {
      const platformMappings =
        mappings.marketplace_balances as
          | Record<string, string>
          | undefined;
      return platformMappings?.[platform];
    }
    if (role === 'marketplace_fee' && platform) {
      const platformMappings =
        mappings.marketplace_fee_accounts as
          | Record<string, string>
          | undefined;
      return (
        (feeCategory
          ? platformMappings?.[`${platform}:${feeCategory}`]
          : undefined) ??
        (feeCategory
          ? platformMappings?.[feeCategory]
          : undefined) ??
        platformMappings?.[platform]
      );
    }
    const value = mappings[role];
    return typeof value === 'string' ? value : undefined;
  }
}
