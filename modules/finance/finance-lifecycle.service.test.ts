import { FinanceLifecycleService } from './finance-lifecycle.service';

const organizationId = '507f1f77bcf86cd799439010';

describe('FinanceLifecycleService readiness', () => {
  it('exposes start readiness for an owner before onboarding', async () => {
    const service = new FinanceLifecycleService(
      { organizationId, userId: 'user-1' },
      {
        organizationRepository: {
          findFinanceState: jest.fn(async () => ({
            finance: undefined,
          })),
          startFinance: jest.fn(async () => null),
        },
        ownerAccessChecker: jest.fn(async () => true),
      }
    );

    await expect(service.getReadiness()).resolves.toEqual({
      finance: {
        status: 'not_started',
        onboarding_version: 1,
      },
      readiness: {
        status: 'not_started',
        owner_access: true,
        can_start: true,
        can_resume: false,
        blockers: [],
      },
    });
  });

  it('reports a server blocker when a non-owner cannot resume setup', async () => {
    const service = new FinanceLifecycleService(
      { organizationId, userId: 'user-2' },
      {
        organizationRepository: {
          findFinanceState: jest.fn(async () => ({
            finance: {
              status: 'in_progress' as const,
              onboarding_version: 1,
            },
          })),
          startFinance: jest.fn(async () => null),
        },
        ownerAccessChecker: jest.fn(async () => false),
      }
    );

    const result = await service.getReadiness();

    expect(result.readiness).toEqual({
      status: 'blocked',
      owner_access: false,
      can_start: false,
      can_resume: false,
      blockers: [
        {
          code: 'OWNER_REQUIRED',
          message:
            'Hanya owner organization yang dapat memulai atau melanjutkan setup Finance.',
        },
      ],
    });
  });

  it('keeps an in-progress onboarding start request idempotent', async () => {
    const startFinance = jest.fn(async () => null);
    const defaultAccountInitializer = jest.fn(
      async () => undefined
    );
    const service = new FinanceLifecycleService(
      { organizationId, userId: 'user-1' },
      {
        organizationRepository: {
          findFinanceState: jest.fn(async () => ({
            finance: {
              status: 'in_progress' as const,
              onboarding_version: 1,
            },
          })),
          startFinance,
        },
        ownerAccessChecker: jest.fn(async () => true),
        defaultAccountInitializer,
      }
    );

    const result = await service.start();

    expect(result.status).toBe('in_progress');
    expect(startFinance).not.toHaveBeenCalled();
    expect(defaultAccountInitializer).toHaveBeenCalledTimes(
      1
    );
  });

  it('seeds Finance accounts before starting onboarding', async () => {
    const calls: string[] = [];
    const service = new FinanceLifecycleService(
      { organizationId, userId: 'user-1' },
      {
        organizationRepository: {
          findFinanceState: jest.fn(async () => ({
            finance: undefined,
          })),
          startFinance: jest.fn(async () => {
            calls.push('start');
            return {
              finance: {
                status: 'in_progress' as const,
                onboarding_version: 1,
              },
            };
          }),
        },
        ownerAccessChecker: jest.fn(async () => true),
        defaultAccountInitializer: jest.fn(async () => {
          calls.push('seed');
        }),
      }
    );

    await service.start();

    expect(calls).toEqual(['seed', 'start']);
  });
});
