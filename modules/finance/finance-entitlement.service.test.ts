import { FinanceDomainError } from './finance.error';
import { FinanceEntitlementService } from './finance-entitlement.service';

const organizationId = '507f1f77bcf86cd799439010';

describe('FinanceEntitlementService', () => {
  it.each(['pro', 'plus', 'enterprise'])(
    'allows the %s organization plan to access Finance',
    async (plan) => {
      const service = new FinanceEntitlementService(
        { organizationId },
        {
          repository: {
            findFinanceAccessState: async () => ({
              plan,
              finance: { status: 'in_progress' },
            }),
          },
        }
      );

      await expect(
        service.getAvailability()
      ).resolves.toEqual({
        available: true,
        status: 'in_progress',
      });
    }
  );

  it.each([undefined, 'free', 'unrecognized'])(
    'keeps development access open for the %s plan',
    async (plan) => {
      const service = new FinanceEntitlementService(
        { organizationId },
        {
          repository: {
            findFinanceAccessState: async () => ({
              plan,
              finance: { status: 'active' },
            }),
          },
        }
      );

      await expect(
        service.getAvailability()
      ).resolves.toEqual({
        available: true,
        status: 'active',
      });
      await expect(
        service.assertPremium()
      ).resolves.toMatchObject({
        available: true,
        status: 'active',
      });
    }
  );

  it('reports a missing organization instead of granting access', async () => {
    const service = new FinanceEntitlementService(
      { organizationId },
      {
        repository: {
          findFinanceAccessState: async () => null,
        },
      }
    );

    await expect(
      service.getAvailability()
    ).rejects.toBeInstanceOf(FinanceDomainError);
  });
});
