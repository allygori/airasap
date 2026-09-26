import { Types } from 'mongoose';
import { FinancePeriodService } from './finance-period.service';
import type { FinancePeriodPersistenceRecord } from './finance-period.repository';
import type { TimeZone } from '@/constant/timezone';

const organizationId = '507f1f77bcf86cd799439010';
const actorId = '507f1f77bcf86cd799439011';

const makePeriod = (
  status: 'open' | 'closed'
): FinancePeriodPersistenceRecord => ({
  _id: new Types.ObjectId('507f1f77bcf86cd799439099'),
  organization: new Types.ObjectId(organizationId),
  period_key: '2026-09',
  start_date: new Date('2026-08-31T17:00:00.000Z'),
  end_date: new Date('2026-09-30T16:59:59.999Z'),
  status,
  ...(status === 'closed'
    ? {
        closed_at: new Date('2026-09-30T16:59:59.999Z'),
        closed_by: new Types.ObjectId(actorId),
      }
    : {}),
});

const makeOrganizationRepository = (
  calendarTimezone: TimeZone = 'Asia/Jakarta'
) => ({
  findFinanceState: jest.fn(async () => ({
    finance: { calendar_timezone: calendarTimezone },
  })),
});

describe('FinancePeriodService', () => {
  it('rejects posting into a closed period', async () => {
    const service = new FinancePeriodService(
      { organizationId },
      {
        findByPeriodKey: jest.fn(async () =>
          makePeriod('closed')
        ),
        createPeriod: jest.fn(),
        closePeriod: jest.fn(),
      },
      makeOrganizationRepository()
    );

    await expect(
      service.ensureOpen(
        '2026-09',
        new Date('2026-09-15T00:00:00.000Z')
      )
    ).rejects.toMatchObject({
      code: 'FINANCE_PERIOD_NOT_OPEN',
    });
  });

  it('treats a period without a record as implicitly open', async () => {
    const service = new FinancePeriodService(
      { organizationId },
      {
        findByPeriodKey: jest.fn(async () => null),
        createPeriod: jest.fn(),
        closePeriod: jest.fn(),
      },
      makeOrganizationRepository()
    );

    await expect(
      service.ensureOpen(
        '2026-09',
        new Date('2026-09-15T00:00:00.000Z')
      )
    ).resolves.toBeNull();
  });

  it('can close a period that has not been materialized yet', async () => {
    const closed = makePeriod('closed');
    const createPeriod = jest.fn(async () => closed);
    const service = new FinancePeriodService(
      { organizationId },
      {
        findByPeriodKey: jest.fn(async () => null),
        createPeriod,
        closePeriod: jest.fn(),
      },
      makeOrganizationRepository()
    );

    const result = await service.close(
      { period_key: '2026-09' },
      actorId
    );

    expect(result.status).toBe('closed');
    expect(createPeriod).toHaveBeenCalledWith(
      expect.objectContaining({
        period_key: '2026-09',
        start_date: new Date('2026-08-31T17:00:00.000Z'),
        end_date: new Date('2026-09-30T16:59:59.999Z'),
        status: 'closed',
        closed_by: actorId,
      }),
      undefined
    );
  });

  it('derives the month key in the organization timezone', async () => {
    const service = new FinancePeriodService(
      { organizationId },
      {
        findByPeriodKey: jest.fn(async () => null),
        createPeriod: jest.fn(),
        closePeriod: jest.fn(),
      },
      makeOrganizationRepository('Asia/Jakarta')
    );

    await expect(
      service.getPeriodKey(
        new Date('2026-09-30T17:00:00.000Z')
      )
    ).resolves.toBe('2026-10');
  });
});
