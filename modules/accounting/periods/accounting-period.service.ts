import { CreateAccountingPeriodSchema } from './accounting-period.schema';
import { AccountingDomainError } from '../accounting.error';
import {
  assertAccountingTenant,
  getPeriodKeyFromDate,
  parseAccountingDate,
  toAccountingObjectId,
  type AccountingTenantContext,
} from '../accounting.types';
import { AccountingPeriodRepository } from './accounting-period.repository';
import { createAuditLog } from '../audit/audit-log.model';

export class AccountingPeriodService {
  private readonly repository: AccountingPeriodRepository;
  private readonly context: AccountingTenantContext;

  constructor(context: AccountingTenantContext) {
    assertAccountingTenant(context);
    this.context = context;
    this.repository = new AccountingPeriodRepository(
      context
    );
  }

  async create(input: unknown) {
    const data = CreateAccountingPeriodSchema.parse(input);
    const startDate = parseAccountingDate(
      data.start_date,
      'start_date'
    );
    const endDate = parseAccountingDate(
      data.end_date,
      'end_date'
    );

    if (startDate > endDate) {
      throw new AccountingDomainError(
        'start_date tidak boleh lebih besar dari end_date.',
        'INVALID_PERIOD_RANGE'
      );
    }

    if (
      getPeriodKeyFromDate(startDate) !== data.period_key
    ) {
      throw new AccountingDomainError(
        'period_key harus sesuai dengan bulan start_date.',
        'INVALID_PERIOD_KEY'
      );
    }

    if (getPeriodKeyFromDate(endDate) !== data.period_key) {
      throw new AccountingDomainError(
        'Accounting period tidak boleh melintasi bulan lain.',
        'PERIOD_CROSSES_MONTH'
      );
    }

    const existing = await this.repository.findByPeriodKey(
      data.period_key
    );
    if (existing) {
      throw new AccountingDomainError(
        `Accounting period ${data.period_key} sudah ada.`,
        'PERIOD_ALREADY_EXISTS'
      );
    }

    return this.repository.createPeriod({
      period_key: data.period_key,
      start_date: startDate,
      end_date: endDate,
      status: data.status,
      ...(data.closed_at
        ? {
            closed_at: parseAccountingDate(
              data.closed_at,
              'closed_at'
            ),
          }
        : {}),
      ...(data.closed_by
        ? { closed_by: data.closed_by }
        : {}),
    });
  }

  async ensureOpen(periodKey: string, date: Date) {
    const period =
      await this.repository.findOpenContainingDate(
        periodKey,
        date
      );
    if (!period) {
      throw new AccountingDomainError(
        `Accounting period ${periodKey} tidak ada atau sudah ditutup.`,
        'PERIOD_NOT_OPEN'
      );
    }

    return period;
  }

  async close(periodKey: string, closedBy?: string) {
    const actorId = closedBy
      ? toAccountingObjectId(closedBy, 'closedBy')
      : undefined;
    const period = await this.repository.closePeriod(
      periodKey,
      closedBy
    );
    if (!period) {
      throw new AccountingDomainError(
        `Accounting period ${periodKey} tidak ditemukan atau sudah ditutup.`,
        'PERIOD_ALREADY_CLOSED'
      );
    }

    await createAuditLog(this.context, {
      action: 'accounting_period.closed',
      entity_type: 'accounting_period',
      entity_id: toAccountingObjectId(
        String(period._id),
        'accounting_period'
      ),
      ...(actorId ? { actor_id: actorId } : {}),
      metadata: { period_key: period.period_key },
    });

    return period;
  }
}
