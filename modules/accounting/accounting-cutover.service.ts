import { AccountingDomainError } from './accounting.error';
import { AccountingPeriodRepository } from './periods/accounting-period.repository';
import { AccountingPeriodService } from './periods/accounting-period.service';
import { OpeningBalanceRepository } from './opening-balances/opening-balance.repository';
import { OpeningBalanceService } from './opening-balances/opening-balance.service';
import {
  getPeriodKeyFromDate,
  parseAccountingDate,
  type AccountingTenantContext,
} from './accounting.types';
import { AccountingCutoverSchema } from './accounting-cutover.schema';

const getPeriodDates = (periodKey: string) => {
  const [year, month] = periodKey.split('-').map(Number);
  return {
    start_date: new Date(Date.UTC(year, month - 1, 1)),
    end_date: new Date(
      Date.UTC(year, month, 0, 23, 59, 59, 999)
    ),
  };
};

export class AccountingCutoverService {
  private readonly periodRepository: AccountingPeriodRepository;
  private readonly periodService: AccountingPeriodService;
  private readonly openingBalanceRepository: OpeningBalanceRepository;
  private readonly openingBalanceService: OpeningBalanceService;
  private readonly context: AccountingTenantContext;

  constructor(context: AccountingTenantContext) {
    this.context = context;
    this.periodRepository = new AccountingPeriodRepository(
      context
    );
    this.periodService = new AccountingPeriodService(
      context
    );
    this.openingBalanceRepository =
      new OpeningBalanceRepository(context);
    this.openingBalanceService = new OpeningBalanceService(
      context
    );
  }

  async initialize(input: unknown) {
    const data = AccountingCutoverSchema.parse(input);
    const effectiveDate = parseAccountingDate(
      data.effective_date,
      'effective_date'
    );
    const periodKey = getPeriodKeyFromDate(effectiveDate);
    let period =
      await this.periodRepository.findByPeriodKey(
        periodKey
      );

    if (period?.status === 'closed') {
      throw new AccountingDomainError(
        `Accounting period ${periodKey} sudah ditutup dan tidak dapat digunakan sebagai cutover.`,
        'PERIOD_NOT_OPEN'
      );
    }

    if (!period) {
      const dates = getPeriodDates(periodKey);
      period = await this.periodService.create({
        period_key: periodKey,
        start_date: dates.start_date.toISOString(),
        end_date: dates.end_date.toISOString(),
        status: 'open',
      });
    }

    const openingBalanceNumber = `CUTOVER-${periodKey}`;
    const existing =
      await this.openingBalanceRepository.findByNumber(
        openingBalanceNumber
      );

    if (existing?.status === 'posted') {
      return {
        period,
        opening_balance: existing,
        reused: true,
      };
    }

    const openingBalance = existing
      ? await this.openingBalanceService.post(
          String(existing._id),
          this.context.userId
        )
      : await this.openingBalanceService.initialize(
          {
            opening_balance_number: openingBalanceNumber,
            effective_date: effectiveDate.toISOString(),
            period: periodKey,
            currency: 'IDR',
            description: data.description,
            status: 'draft',
            lines: data.lines,
          },
          this.context.userId
        );

    return {
      period,
      opening_balance: openingBalance,
      reused: false,
    };
  }
}
