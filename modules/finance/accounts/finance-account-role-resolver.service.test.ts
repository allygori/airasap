import { Types } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import type { FinanceAccountPersistenceRecord } from './finance-account.repository';
import { FinanceAccountRoleResolverService } from './finance-account-role-resolver.service';

const organizationId = '507f1f77bcf86cd799439010';

const account = (
  code: string,
  subtype?: string
): FinanceAccountPersistenceRecord => ({
  _id: new Types.ObjectId(),
  organization: new Types.ObjectId(organizationId),
  code,
  name: code,
  type: 'asset',
  ...(subtype ? { subtype } : {}),
  parent_account: null,
  normal_balance: 'debit',
  is_system: true,
  is_postable: true,
  is_active: true,
  display_order: 1,
});

describe('FinanceAccountRoleResolverService', () => {
  it('prefers the Finance account subtype over the fallback code', async () => {
    const receivable = account(
      '1210',
      'marketplace_receivable'
    );
    const repository = {
      findSelectableBySubtype: async () => receivable,
      findSelectableByCode: async () => null,
    };

    const result =
      await new FinanceAccountRoleResolverService(
        { organizationId },
        { repository }
      ).resolve('marketplace_receivable');

    expect(result).toBe(receivable);
  });

  it('uses the fallback code when the subtype is unavailable', async () => {
    const revenue = account('4100');
    let requestedCode = '';
    const repository = {
      findSelectableBySubtype: async () => null,
      findSelectableByCode: async (code: string) => {
        requestedCode = code;
        return revenue;
      },
    };

    const result =
      await new FinanceAccountRoleResolverService(
        { organizationId },
        { repository }
      ).resolve('sales_revenue');

    expect(result).toBe(revenue);
    expect(requestedCode).toBe('4100');
  });

  it('returns a safe domain error when the role is not mapped', async () => {
    const repository = {
      findSelectableBySubtype: async () => null,
      findSelectableByCode: async () => null,
    };

    await expect(
      new FinanceAccountRoleResolverService(
        { organizationId },
        { repository }
      ).resolve('sales_revenue')
    ).rejects.toMatchObject<Partial<FinanceDomainError>>({
      code: 'FINANCE_SALES_ACCOUNT_MAPPING_MISSING',
    });
  });
});
