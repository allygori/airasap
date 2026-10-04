import { Types } from 'mongoose';
import type { FinanceSalesTransactionRepository } from '../sales/finance-sales-transaction.repository';
import type {
  FinanceFinancialStatementsRepository,
  FinanceCashFlowJournalRecord,
  FinanceStatementAccountRecord,
  FinanceStatementDateRange,
} from './finance-financial-statements.repository';
import { FinanceFinancialStatementsReadService } from './finance-financial-statements-read.service';

const organizationId = '507f1f77bcf86cd799439010';

const accounts: FinanceStatementAccountRecord[] = [
  {
    _id: new Types.ObjectId('507f1f77bcf86cd799439001'),
    code: '1100',
    name: 'Kas dan Bank',
    type: 'asset',
    subtype: 'bank',
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

const cashAccount = {
  _id: new Types.ObjectId('507f1f77bcf86cd799439007'),
  code: '1110',
  name: 'Kas Kecil',
  type: 'asset' as const,
  subtype: 'cash',
  normal_balance: 'debit' as const,
  is_postable: true,
  display_order: 7,
};
const marketplaceAccount = {
  _id: new Types.ObjectId('507f1f77bcf86cd799439008'),
  code: '1130',
  name: 'Saldo Marketplace',
  type: 'asset' as const,
  subtype: 'marketplace_balance',
  normal_balance: 'debit' as const,
  is_postable: true,
  display_order: 8,
};
const eWalletAccount = {
  _id: new Types.ObjectId('507f1f77bcf86cd799439009'),
  code: '1140',
  name: 'E-wallet',
  type: 'asset' as const,
  subtype: 'e_wallet',
  normal_balance: 'debit' as const,
  is_postable: true,
  display_order: 9,
};
const inventoryAccount = {
  _id: new Types.ObjectId('507f1f77bcf86cd79943900a'),
  code: '1210',
  name: 'Persediaan',
  type: 'asset' as const,
  subtype: 'merchandise_inventory',
  normal_balance: 'debit' as const,
  is_postable: true,
  display_order: 10,
};
const expenseAccount = {
  _id: new Types.ObjectId('507f1f77bcf86cd79943900b'),
  code: '6100',
  name: 'Beban operasional',
  type: 'expense' as const,
  subtype: 'operating_expenses',
  normal_balance: 'debit' as const,
  is_postable: true,
  display_order: 11,
};
const unknownAssetAccount = {
  _id: new Types.ObjectId('507f1f77bcf86cd79943900c'),
  code: '1290',
  name: 'Aset lainnya',
  type: 'asset' as const,
  subtype: 'other_current_assets',
  normal_balance: 'debit' as const,
  is_postable: true,
  display_order: 12,
};

const cashFlowAccounts: FinanceStatementAccountRecord[] = [
  ...accounts,
  cashAccount,
  marketplaceAccount,
  eWalletAccount,
  inventoryAccount,
  expenseAccount,
  unknownAssetAccount,
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

const makeService = (
  statementRepositoryOverrides: Partial<
    Pick<
      FinanceFinancialStatementsRepository,
      | 'listAccounts'
      | 'aggregatePostedLineTotals'
      | 'streamCashFlowJournals'
    >
  > = {}
) => {
  const financeRepository = {
    findFinanceState: async () => ({
      status: 'active' as const,
      onboarding_version: 1,
      calendar_timezone: 'Asia/Jakarta' as const,
      cut_off_date: new Date('2026-04-01T00:00:00.000Z'),
    }),
  };
  const statementRepository: Pick<
    FinanceFinancialStatementsRepository,
    | 'listAccounts'
    | 'aggregatePostedLineTotals'
    | 'streamCashFlowJournals'
  > = {
    listAccounts: async () => accounts,
    aggregatePostedLineTotals: async () => totals,
    async *streamCashFlowJournals() {},
    ...statementRepositoryOverrides,
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
      financeRepository,
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

  it('builds direct cash flow, separates marketplace balance, and reconciles non-cash-scope movements', async () => {
    const periodStart = new Date(
      '2026-08-31T17:00:00.000Z'
    );
    const cashIds = [
      String(accounts[0]._id),
      String(cashAccount._id),
    ];
    const marketplaceId = String(marketplaceAccount._id);
    const records: FinanceCashFlowJournalRecord[] = [
      makeCashFlowJournal(
        'opening_balance',
        'opening_balance_posted',
        [
          [accounts[0]._id, 500, 0],
          [accounts[2]._id, 0, 500],
        ]
      ),
      makeCashFlowJournal(
        'offline_sale',
        'offline_sale_posted',
        [
          [accounts[0]._id, 200, 0],
          [accounts[3]._id, 0, 200],
        ]
      ),
      makeCashFlowJournal('purchase', 'purchase_posted', [
        [inventoryAccount._id, 100, 0],
        [accounts[0]._id, 0, 100],
      ]),
      makeCashFlowJournal('expense', 'expense_posted', [
        [expenseAccount._id, 25, 0],
        [accounts[0]._id, 0, 25],
      ]),
      makeCashFlowJournal(
        'cash_bank_transfer',
        'cash_bank_transfer_posted',
        [
          [cashAccount._id, 50, 0],
          [accounts[0]._id, 0, 50],
        ]
      ),
      makeCashFlowJournal(
        'cash_bank_transfer',
        'cash_bank_transfer_posted',
        [
          [accounts[0]._id, 300, 0],
          [marketplaceAccount._id, 0, 300],
        ]
      ),
      makeCashFlowJournal(
        'cash_bank_transfer',
        'cash_bank_transfer_posted',
        [
          [eWalletAccount._id, 40, 0],
          [accounts[0]._id, 0, 40],
        ]
      ),
      makeCashFlowJournal(
        'cash_bank_transfer',
        'cash_bank_transfer_posted',
        [
          [marketplaceAccount._id, 15, 0],
          [accounts[0]._id, 0, 15],
        ]
      ),
      makeCashFlowJournal(
        'manual_journal',
        'journal_posted',
        [
          [accounts[0]._id, 10, 0],
          [unknownAssetAccount._id, 0, 10],
        ]
      ),
    ];
    const service = makeService({
      listAccounts: async () => cashFlowAccounts,
      aggregatePostedLineTotals: async (
        range: FinanceStatementDateRange
      ) => {
        const accountIds = range.account_ids ?? [];
        if (accountIds.includes(marketplaceId)) {
          return [
            {
              _id: marketplaceAccount._id,
              debit_total: 700,
              credit_total: 0,
            },
          ];
        }
        if (accountIds.some((id) => cashIds.includes(id))) {
          const opening = range.end_date < periodStart;
          return [
            {
              _id: accounts[0]._id,
              debit_total: opening ? 1_000 : 1_830,
              credit_total: 0,
            },
          ];
        }
        return totals;
      },
      async *streamCashFlowJournals() {
        yield* records;
      },
    });

    const report = await service.cashFlow({
      period: '2026-09',
    });

    expect(report.totals).toMatchObject({
      opening_cash_balance: 1_000,
      opening_balance_adjustment: 500,
      operating_net: 375,
      investing_net: 0,
      financing_net: 0,
      net_cash_change: 375,
      outside_scope_net: -55,
      unclassified_net: 10,
      other_cash_movement_net: -45,
      closing_cash_balance: 1_830,
      reconciliation_difference: 0,
      marketplace_balance_total: 700,
    });
    expect(report.cash_account_count).toBe(2);
    expect(report.lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Payout saldo marketplace',
          amount: 300,
          section: 'operating',
        }),
        expect.objectContaining({
          label: 'Perpindahan Kas/Bank dengan e-wallet',
          amount: -40,
          section: 'outside_scope',
        }),
        expect.objectContaining({
          label: 'Transfer ke saldo marketplace',
          amount: -15,
          section: 'outside_scope',
        }),
        expect.objectContaining({
          section: 'opening_balance',
          amount: 500,
        }),
      ])
    );
    expect(report.lines).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          amount: 0,
          source_type: 'cash_bank_transfer',
        }),
      ])
    );
  });
});

function makeCashFlowJournal(
  source_type: string,
  source_event: string,
  lines: Array<[Types.ObjectId, number, number]>
): FinanceCashFlowJournalRecord {
  return {
    source_type,
    source_event,
    lines: lines.map(([account_id, debit, credit]) => ({
      account_id,
      debit,
      credit,
    })),
  };
}
