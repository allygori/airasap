import { Types } from 'mongoose';
import type { FinanceSalesTransactionRepository } from '../sales/finance-sales-transaction.repository';
import type {
  FinanceFinancialStatementsRepository,
  FinanceStatementAccountRecord,
} from './finance-financial-statements.repository';
import { FinanceFinancialStatementsReadService } from './finance-financial-statements-read.service';

const organizationId = '507f1f77bcf86cd799439010';

const accounts: FinanceStatementAccountRecord[] = [
  {
    _id: new Types.ObjectId('507f1f77bcf86cd799439001'),
    code: '1100',
    name: 'Kas dan Bank',
    type: 'asset',
    normal_balance: 'debit',
    is_postable: true,
    display_order: 1,
  },
  {
    _id: new Types.ObjectId('507f1f77bcf86cd799439002'),
    code: '2100',
    name: 'Utang',
    type: 'liability',
    normal_balance: 'credit',
    is_postable: true,
    display_order: 2,
  },
  {
    _id: new Types.ObjectId('507f1f77bcf86cd799439003'),
    code: '3100',
    name: 'Modal',
    type: 'equity',
    normal_balance: 'credit',
    is_postable: true,
    display_order: 3,
  },
  {
    _id: new Types.ObjectId('507f1f77bcf86cd799439004'),
    code: '4100',
    name: 'Penjualan',
    type: 'revenue',
    normal_balance: 'credit',
    is_postable: true,
    display_order: 4,
  },
  {
    _id: new Types.ObjectId('507f1f77bcf86cd799439005'),
    code: '4190',
    name: 'Diskon penjualan',
    type: 'revenue',
    normal_balance: 'debit',
    is_postable: true,
    display_order: 5,
  },
  {
    _id: new Types.ObjectId('507f1f77bcf86cd799439006'),
    code: '5100',
    name: 'Harga Pokok Penjualan',
    type: 'cost_of_sales',
    normal_balance: 'debit',
    is_postable: true,
    display_order: 6,
  },
];

const totals = [
  { account: 0, debit_total: 100_000, credit_total: 0 },
  { account: 1, debit_total: 0, credit_total: 30_000 },
  { account: 2, debit_total: 0, credit_total: 20_000 },
  { account: 3, debit_total: 0, credit_total: 70_000 },
  { account: 4, debit_total: 10_000, credit_total: 0 },
  { account: 5, debit_total: 10_000, credit_total: 0 },
].map((row) => ({
  _id: accounts[row.account]._id,
  debit_total: row.debit_total,
  credit_total: row.credit_total,
}));

const makeService = () => {
  const organizationRepository = {
    findFinanceState: async () => ({
      finance: {
        status: 'active' as const,
        onboarding_version: 1,
        calendar_timezone: 'Asia/Jakarta' as const,
        cut_off_date: new Date('2026-04-01T00:00:00.000Z'),
      },
    }),
  };
  const statementRepository: Pick<
    FinanceFinancialStatementsRepository,
    'listAccounts' | 'aggregatePostedLineTotals'
  > = {
    listAccounts: async () => accounts,
    aggregatePostedLineTotals: async () => totals,
  };
  const salesRepository: Pick<
    FinanceSalesTransactionRepository,
    'aggregateDeferredCogs'
  > = {
    aggregateDeferredCogs: async () => [
      {
        _id: 'Stok belum memiliki biaya HPP.',
        transaction_count: 2,
        related_sales_amount: 57_400,
      },
    ],
  };

  return new FinanceFinancialStatementsReadService(
    { organizationId },
    {
      organizationRepository,
      statementRepository,
      salesRepository,
      now: () => new Date('2026-09-26T12:00:00.000Z'),
    }
  );
};

describe('FinanceFinancialStatementsReadService', () => {
  it('builds a balanced cumulative trial balance using the selected finance month', async () => {
    const report = await makeService().trialBalance({
      period: '2026-09',
    });

    expect(report.totals).toEqual({
      debit_balance: 120_000,
      credit_balance: 120_000,
      difference: 0,
    });
    expect(report.period).toMatchObject({
      period_key: '2026-09',
      calendar_timezone: 'Asia/Jakarta',
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      starts_at: '2026-08-31T17:00:00.000Z',
      ends_at: '2026-09-30T16:59:59.999Z',
      history_start_date: '2026-04-01',
    });
  });

  it('treats debit-normal contra-revenue accounts as deductions in profit and loss', async () => {
    const report = await makeService().profitAndLoss({
      period: '2026-09',
    });

    expect(report.totals).toEqual({
      revenue: 60_000,
      other_income: 0,
      cost_of_sales: 10_000,
      expenses: 0,
      other_expenses: 0,
      net_income: 50_000,
    });
    expect(report.revenue_rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: '4190',
          amount: -10_000,
        }),
      ])
    );
    expect(report.deferred_cogs).toMatchObject({
      transaction_count: 2,
      related_sales_amount: 57_400,
    });
  });

  it('includes cumulative unclosed net income in equity on the balance sheet', async () => {
    const report = await makeService().balanceSheet({
      period: '2026-09',
    });

    expect(report.totals).toMatchObject({
      assets: 100_000,
      liabilities: 30_000,
      equity_accounts: 20_000,
      unclosed_net_income: 50_000,
      liabilities_and_equity: 100_000,
      difference: 0,
    });
  });

  it('rejects invalid periods rather than querying an unintended month', async () => {
    await expect(
      makeService().trialBalance({ period: '2026-13' })
    ).rejects.toThrow();
  });
});
