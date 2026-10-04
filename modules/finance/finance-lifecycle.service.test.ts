import { FinanceLifecycleService } from './finance-lifecycle.service';
import { FinanceSettingsService } from './finance-settings.service';

const organizationId = '507f1f77bcf86cd799439010';

describe('FinanceLifecycleService readiness', () => {
  it('exposes start readiness for an owner before onboarding', async () => {
    const service = new FinanceLifecycleService(
      { organizationId, userId: 'user-1' },
      {
        financeRepository: {
          findFinanceState: jest.fn(async () => null),
          startFinance: jest.fn(async () => null),
        },
        ownerAccessChecker: jest.fn(async () => true),
      }
    );

    await expect(service.getReadiness()).resolves.toEqual({
      finance: {
        status: 'not_started',
        onboarding_version: 1,
        calendar_timezone: 'Asia/Jakarta',
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
        financeRepository: {
          findFinanceState: jest.fn(async () => ({
            status: 'in_progress' as const,
            onboarding_version: 1,
            calendar_timezone: 'Asia/Jakarta' as const,
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
        financeRepository: {
          findFinanceState: jest.fn(async () => ({
            status: 'in_progress' as const,
            onboarding_version: 1,
            calendar_timezone: 'Asia/Jakarta' as const,
          })),
          startFinance,
        },
        ownerAccessChecker: jest.fn(async () => true),
        premiumAccessChecker: jest.fn(async () => true),
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
        financeRepository: {
          findFinanceState: jest.fn(async () => null),
          startFinance: jest.fn(async () => {
            calls.push('start');
            return {
              status: 'in_progress' as const,
              onboarding_version: 1,
              calendar_timezone: 'Asia/Jakarta' as const,
            };
          }),
        },
        ownerAccessChecker: jest.fn(async () => true),
        premiumAccessChecker: jest.fn(async () => true),
        defaultAccountInitializer: jest.fn(async () => {
          calls.push('seed');
        }),
      }
    );

    await service.start();

    expect(calls).toEqual(['seed', 'start']);
  });

  it('saves the Finance calendar timezone before any journal exists', async () => {
    const updateFinanceCalendarTimezone = jest.fn(
      async (
        calendar_timezone:
          | 'Asia/Jakarta'
          | 'Asia/Makassar'
          | 'Asia/Jayapura'
      ) => ({
        status: 'in_progress' as const,
        onboarding_version: 1,
        calendar_timezone,
      })
    );
    const service = new FinanceSettingsService(
      { organizationId, userId: 'user-1' },
      {
        financeRepository: {
          findFinanceState: jest.fn(async () => ({
            status: 'in_progress' as const,
            onboarding_version: 1,
            calendar_timezone: 'Asia/Jakarta' as const,
          })),
          updateFinanceCalendarTimezone,
        },
        ownerAccessChecker: jest.fn(async () => true),
        postedJournalChecker: jest.fn(async () => false),
      }
    );

    const state =
      await service.setCalendarTimezone('Asia/Makassar');

    expect(state.calendar_timezone).toBe('Asia/Makassar');
    expect(
      updateFinanceCalendarTimezone
    ).toHaveBeenCalledWith('Asia/Makassar', undefined);
  });

  it('locks the Finance calendar timezone after the first journal exists', async () => {
    const updateFinanceCalendarTimezone = jest.fn();
    const service = new FinanceSettingsService(
      { organizationId, userId: 'user-1' },
      {
        financeRepository: {
          findFinanceState: jest.fn(async () => ({
            status: 'in_progress' as const,
            onboarding_version: 1,
            calendar_timezone: 'Asia/Jakarta' as const,
          })),
          updateFinanceCalendarTimezone,
        },
        ownerAccessChecker: jest.fn(async () => true),
        postedJournalChecker: jest.fn(async () => true),
      }
    );

    await expect(
      service.setCalendarTimezone('Asia/Makassar')
    ).rejects.toMatchObject({
      code: 'FINANCE_CALENDAR_TIMEZONE_LOCKED',
    });
    expect(
      updateFinanceCalendarTimezone
    ).not.toHaveBeenCalled();
  });
});
