import type { ClientSession } from 'mongoose';
import { Types } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type {
  FinanceClosePeriodDTO,
  FinancePeriodResponseDTO,
} from './finance-period.dto';
import { mapFinancePeriod } from './finance-period.mapper';
import {
  FinancePeriodRepository,
  type FinancePeriodPersistenceRecord,
} from './finance-period.repository';
import {
  FinanceClosePeriodSchema,
  FinancePeriodKeySchema,
} from './finance-period.schema';

type FinancePeriodRepositoryPort = Pick<
  FinancePeriodRepository,
  'findByPeriodKey' | 'createPeriod' | 'closePeriod'
>;

const getPeriodBounds = (periodKey: string) => {
  const [year, month] = periodKey.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(
    Date.UTC(year, month, 0, 23, 59, 59, 999)
  );
  return { startDate, endDate };
};

export class FinancePeriodService {
  private readonly repository: FinancePeriodRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    repository?: FinancePeriodRepositoryPort
  ) {
    assertFinanceTenant(context);
    this.repository =
      repository ?? new FinancePeriodRepository(context);
  }

  async ensureOpen(
    periodKey: string,
    date: Date,
    session?: ClientSession
  ): Promise<FinancePeriodPersistenceRecord | null> {
    const parsedKey =
      FinancePeriodKeySchema.safeParse(periodKey);
    if (!parsedKey.success) {
      throw new FinanceDomainError(
        'Period Finance tidak valid.',
        'FINANCE_PERIOD_INVALID'
      );
    }

    const period = await this.repository.findByPeriodKey(
      parsedKey.data,
      session
    );

    // A missing period is implicitly open until an explicit close operation
    // creates the period record. This keeps first-time Finance posting simple.
    if (!period) return null;

    if (period.status === 'closed') {
      throw new FinanceDomainError(
        `Period Finance ${periodKey} sudah ditutup.`,
        'FINANCE_PERIOD_NOT_OPEN'
      );
    }

    if (
      date < period.start_date ||
      date > period.end_date
    ) {
      throw new FinanceDomainError(
        `Tanggal transaksi berada di luar period Finance ${periodKey}.`,
        'FINANCE_PERIOD_DATE_OUTSIDE_RANGE'
      );
    }

    return period;
  }

  async close(
    input: FinanceClosePeriodDTO | unknown,
    closedBy?: string,
    session?: ClientSession
  ): Promise<FinancePeriodResponseDTO> {
    const data = FinanceClosePeriodSchema.parse(input);
    const existing = await this.repository.findByPeriodKey(
      data.period_key,
      session
    );

    if (existing?.status === 'closed') {
      throw new FinanceDomainError(
        `Period Finance ${data.period_key} sudah ditutup.`,
        'FINANCE_PERIOD_ALREADY_CLOSED'
      );
    }

    if (existing) {
      const closed = await this.repository.closePeriod(
        data.period_key,
        this.getClosedBy(closedBy),
        session
      );

      if (!closed) {
        throw new FinanceDomainError(
          'Period Finance gagal ditutup karena status berubah.',
          'FINANCE_PERIOD_CLOSE_CONFLICT'
        );
      }

      return mapFinancePeriod(closed);
    }

    const { startDate, endDate } = getPeriodBounds(
      data.period_key
    );
    try {
      const created = await this.repository.createPeriod(
        {
          period_key: data.period_key,
          start_date: startDate,
          end_date: endDate,
          status: 'closed',
          closed_at: new Date(),
          ...(this.getClosedBy(closedBy)
            ? { closed_by: this.getClosedBy(closedBy) }
            : {}),
        },
        session
      );
      return mapFinancePeriod(created);
    } catch (error: unknown) {
      if (!this.isDuplicateKeyError(error)) throw error;
      throw new FinanceDomainError(
        'Period Finance gagal ditutup karena dibuat oleh proses lain.',
        'FINANCE_PERIOD_CLOSE_CONFLICT'
      );
    }
  }

  private getClosedBy(closedBy?: string) {
    if (!closedBy) return undefined;
    if (!Types.ObjectId.isValid(closedBy)) {
      throw new FinanceDomainError(
        'User penutup period Finance tidak valid.',
        'FINANCE_PERIOD_ACTOR_INVALID'
      );
    }
    return closedBy;
  }

  private isDuplicateKeyError(error: unknown) {
    if (!error || typeof error !== 'object') return false;
    if (!('code' in error)) return false;
    return (error as { code?: unknown }).code === 11000;
  }
}
