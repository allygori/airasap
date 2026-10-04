import type { ClientSession } from 'mongoose';
import type { FinanceAccountType } from '../accounts/finance-account.constants';
import {
  getFinanceCalendarDate,
  getFinancePeriodBounds,
  getFinancePeriodKey,
} from '../calendar/finance-calendar';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  normalizeFinanceState,
  type FinanceState,
  type FinanceTenantContext,
} from '../finance.types';
import { FinanceOnboardingRepository } from '../onboarding/finance-onboarding.repository';
import { FinanceSalesTransactionRepository } from '../sales/finance-sales-transaction.repository';
import {
  FinanceBalanceSheetReportSchema,
  FinanceCashFlowReportSchema,
  FinanceProfitLossReportSchema,
  FinanceStatementQuerySchema,
  FinanceTrialBalanceReportSchema,
  type FinanceCashFlowReport,
  type FinanceDeferredCogsSummary,
  type FinanceStatementAccountAmount,
  type FinanceStatementPeriod,
  type FinanceStatementQuery,
} from './finance-statement.schema';
import {
  FinanceFinancialStatementsRepository,
  type FinanceStatementAccountRecord,
  type FinanceStatementAccountTotalsRecord,
} from './finance-financial-statements.repository';

type FinanceStatementStateRepositoryPort = {
  findFinanceState(
    session?: ClientSession
  ): Promise<FinanceState | null>;
};

type FinanceStatementRepositoryPort = Pick<
  FinanceFinancialStatementsRepository,
  | 'listAccounts'
  | 'aggregatePostedLineTotals'
  | 'streamCashFlowJournals'
>;

type FinanceStatementSalesRepositoryPort = Pick<
  FinanceSalesTransactionRepository,
  'aggregateDeferredCogs'
>;

type DeferredCogsReason = {
  _id: string;
  transaction_count: number;
  related_sales_amount: number;
};

type AccountLineTotals = Map<
  string,
  FinanceStatementAccountTotalsRecord
>;

type CashFlowSection =
  FinanceCashFlowReport['lines'][number]['section'];

const CASH_SUBTYPES = new Set(['cash', 'bank']);
const FIXED_ASSET_SUBTYPES = new Set([
  'fixed_assets',
  'packing_equipment',
  'computer_equipment',
  'accumulated_depreciation',
]);
const OPERATING_ASSET_SUBTYPES = new Set([
  'inventory',
  'merchandise_inventory',
  'packaging_inventory',
  'marketplace_receivable',
  'receivables',
  'supplier_advance',
]);

const getAccountBalance = (
  account: FinanceStatementAccountRecord,
  totals: FinanceStatementAccountTotalsRecord | undefined
) => {
  if (!totals) return 0;
  return account.normal_balance === 'debit'
    ? totals.debit_total - totals.credit_total
    : totals.credit_total - totals.debit_total;
};

const classifyCashFlowMovement = (
  sourceType: string,
  sourceEvent: string,
  amount: number,
  counterpartAccounts: FinanceStatementAccountRecord[]
): { section: CashFlowSection; label: string } => {
  const counterpartSubtypes = new Set(
    counterpartAccounts.map((account) => account.subtype)
  );

  if (counterpartSubtypes.has('marketplace_balance')) {
    return amount > 0
      ? {
          section: 'operating',
          label: 'Payout saldo marketplace',
        }
      : {
          section: 'outside_scope',
          label: 'Transfer ke saldo marketplace',
        };
  }
  if (counterpartSubtypes.has('e_wallet')) {
    return {
      section: 'outside_scope',
      label: 'Perpindahan Kas/Bank dengan e-wallet',
    };
  }

  if (
    sourceType === 'marketplace_release' &&
    counterpartSubtypes.has('marketplace_receivable')
  ) {
    return {
      section: 'operating',
      label: 'Payout marketplace',
    };
  }

  if (sourceType === 'offline_sale') {
    return amount > 0
      ? {
          section: 'operating',
          label: 'Penerimaan penjualan offline',
        }
      : {
          section: 'operating',
          label: 'Retur/refund penjualan offline',
        };
  }
  if (sourceType === 'purchase') {
    return amount < 0
      ? {
          section: 'operating',
          label: 'Pembayaran pembelian',
        }
      : {
          section: 'operating',
          label: 'Pengembalian pembayaran pembelian',
        };
  }
  if (sourceType === 'expense') {
    return amount < 0
      ? {
          section: 'operating',
          label: 'Pembayaran beban',
        }
      : {
          section: 'operating',
          label: 'Pengembalian beban',
        };
  }
  if (sourceType === 'finance_settlement') {
    if (sourceEvent === 'receivable_settlement_posted') {
      return {
        section: 'operating',
        label: 'Penerimaan pelunasan piutang',
      };
    }
    if (sourceEvent === 'payable_settlement_posted') {
      return {
        section: 'operating',
        label: 'Pembayaran utang',
      };
    }
  }

  if (
    counterpartAccounts.some((account) =>
      FIXED_ASSET_SUBTYPES.has(account.subtype ?? '')
    )
  ) {
    return amount > 0
      ? {
          section: 'investing',
          label: 'Penerimaan terkait aset tetap',
        }
      : {
          section: 'investing',
          label: 'Pembelian aset tetap',
        };
  }
  if (
    counterpartAccounts.some(
      (account) =>
        account.type === 'equity' ||
        /loan|borrowing|financing/i.test(
          account.subtype ?? ''
        )
    )
  ) {
    return amount > 0
      ? {
          section: 'financing',
          label: 'Penerimaan modal/pembiayaan',
        }
      : {
          section: 'financing',
          label: 'Pengeluaran modal/pembiayaan',
        };
  }
  if (
    counterpartAccounts.some((account) =>
      [
        'liability',
        'revenue',
        'cost_of_sales',
        'expense',
        'other_income',
        'other_expense',
      ].includes(account.type)
    ) ||
    [...counterpartSubtypes].some((subtype) =>
      OPERATING_ASSET_SUBTYPES.has(subtype ?? '')
    )
  ) {
    return amount > 0
      ? {
          section: 'operating',
          label: 'Penerimaan operasional',
        }
      : {
          section: 'operating',
          label: 'Pengeluaran operasional',
        };
  }

  return {
    section: 'unclassified',
    label: 'Mutasi Kas/Bank perlu ditinjau',
  };
};

export class FinanceFinancialStatementsReadService {
  private readonly financeRepository: FinanceStatementStateRepositoryPort;
  private readonly statementRepository: FinanceStatementRepositoryPort;
  private readonly salesRepository: FinanceStatementSalesRepositoryPort;
  private readonly now: () => Date;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      financeRepository?: FinanceStatementStateRepositoryPort;
      statementRepository?: FinanceStatementRepositoryPort;
      salesRepository?: FinanceStatementSalesRepositoryPort;
      now?: () => Date;
    }
  ) {
    assertFinanceTenant(context);
    this.financeRepository =
      dependencies?.financeRepository ??
      new FinanceOnboardingRepository(context);
    this.statementRepository =
      dependencies?.statementRepository ??
      new FinanceFinancialStatementsRepository(context);
    this.salesRepository =
      dependencies?.salesRepository ??
      new FinanceSalesTransactionRepository(context);
    this.now = dependencies?.now ?? (() => new Date());
  }

  async trialBalance(
    input: FinanceStatementQuery | unknown = {},
    session?: ClientSession
  ) {
    const { state, period, range } =
      await this.resolvePeriod(input, session);
    const [accounts, totals] = await Promise.all([
      this.statementRepository.listAccounts(),
      this.statementRepository.aggregatePostedLineTotals({
        end_date: range.endDate,
      }),
    ]);
    const totalsByAccount = this.toTotalsMap(totals);
    const rows = accounts
      .map((account) => {
        const totals = this.getTotals(
          account,
          totalsByAccount
        );
        const balance =
          totals.debit_total - totals.credit_total;
        return {
          account_id: String(account._id),
          code: account.code,
          name: account.name,
          type: account.type,
          debit_balance: Math.max(balance, 0),
          credit_balance: Math.max(-balance, 0),
        };
      })
      .filter(
        (row) =>
          row.debit_balance > 0 || row.credit_balance > 0
      );
    const debitBalance = rows.reduce(
      (sum, row) => sum + row.debit_balance,
      0
    );
    const creditBalance = rows.reduce(
      (sum, row) => sum + row.credit_balance,
      0
    );

    return FinanceTrialBalanceReportSchema.parse({
      report_type: 'trial_balance',
      period: this.toPeriodDTO(state, period),
      rows,
      totals: {
        debit_balance: debitBalance,
        credit_balance: creditBalance,
        difference: debitBalance - creditBalance,
      },
    });
  }

  async profitAndLoss(
    input: FinanceStatementQuery | unknown = {},
    session?: ClientSession
  ) {
    const { state, period, range } =
      await this.resolvePeriod(input, session);
    const [accounts, totals, deferredCogs] =
      await Promise.all([
        this.statementRepository.listAccounts(),
        this.statementRepository.aggregatePostedLineTotals({
          start_date: range.startDate,
          end_date: range.endDate,
        }),
        this.salesRepository.aggregateDeferredCogs(
          range.startDate,
          range.endDate
        ),
      ]);
    const totalsByAccount = this.toTotalsMap(totals);
    const accountRows = this.toAccountRows(
      accounts,
      totalsByAccount,
      true,
      'profit_and_loss'
    );
    const revenueRows = this.rowsForType(
      accountRows,
      accounts,
      'revenue'
    );
    const otherIncomeRows = this.rowsForType(
      accountRows,
      accounts,
      'other_income'
    );
    const costOfSalesRows = this.rowsForType(
      accountRows,
      accounts,
      'cost_of_sales'
    );
    const expenseRows = this.rowsForType(
      accountRows,
      accounts,
      'expense'
    );
    const otherExpenseRows = this.rowsForType(
      accountRows,
      accounts,
      'other_expense'
    );
    const revenue = this.sumAmount(revenueRows);
    const otherIncome = this.sumAmount(otherIncomeRows);
    const costOfSales = this.sumAmount(costOfSalesRows);
    const expenses = this.sumAmount(expenseRows);
    const otherExpenses = this.sumAmount(otherExpenseRows);
    const deferredSummary =
      this.toDeferredCogsSummary(deferredCogs);

    return FinanceProfitLossReportSchema.parse({
      report_type: 'profit_and_loss',
      period: this.toPeriodDTO(state, period),
      revenue_rows: revenueRows,
      other_income_rows: otherIncomeRows,
      cost_of_sales_rows: costOfSalesRows,
      expense_rows: expenseRows,
      other_expense_rows: otherExpenseRows,
      totals: {
        revenue,
        other_income: otherIncome,
        cost_of_sales: costOfSales,
        expenses,
        other_expenses: otherExpenses,
        net_income:
          revenue +
          otherIncome -
          costOfSales -
          expenses -
          otherExpenses,
      },
      deferred_cogs: deferredSummary,
    });
  }

  async balanceSheet(
    input: FinanceStatementQuery | unknown = {},
    session?: ClientSession
  ) {
    const { state, period, range } =
      await this.resolvePeriod(input, session);
    const historyStart = new Date(0);
    const [accounts, totals, deferredCogs] =
      await Promise.all([
        this.statementRepository.listAccounts(),
        this.statementRepository.aggregatePostedLineTotals({
          end_date: range.endDate,
        }),
        this.salesRepository.aggregateDeferredCogs(
          historyStart,
          range.endDate
        ),
      ]);
    const totalsByAccount = this.toTotalsMap(totals);
    const accountRows = this.toAccountRows(
      accounts,
      totalsByAccount,
      false
    );
    const assetRows = this.rowsForType(
      accountRows,
      accounts,
      'asset'
    );
    const liabilityRows = this.rowsForType(
      accountRows,
      accounts,
      'liability'
    );
    const equityRows = this.rowsForType(
      accountRows,
      accounts,
      'equity'
    );
    const cumulativeProfitLoss = accounts
      .filter((account) =>
        [
          'revenue',
          'other_income',
          'cost_of_sales',
          'expense',
          'other_expense',
        ].includes(account.type)
      )
      .reduce((sum, account) => {
        const amount = this.getProfitAndLossAmount(
          account,
          this.getTotals(account, totalsByAccount)
        );
        return ['revenue', 'other_income'].includes(
          account.type
        )
          ? sum + amount
          : sum - amount;
      }, 0);
    const assets = this.sumAmount(assetRows);
    const liabilities = this.sumAmount(liabilityRows);
    const equityAccounts = this.sumAmount(equityRows);
    const liabilitiesAndEquity =
      liabilities + equityAccounts + cumulativeProfitLoss;

    return FinanceBalanceSheetReportSchema.parse({
      report_type: 'balance_sheet',
      period: this.toPeriodDTO(state, period),
      asset_rows: assetRows,
      liability_rows: liabilityRows,
      equity_rows: equityRows,
      totals: {
        assets,
        liabilities,
        equity_accounts: equityAccounts,
        unclosed_net_income: cumulativeProfitLoss,
        equity_and_net_income:
          equityAccounts + cumulativeProfitLoss,
        liabilities_and_equity: liabilitiesAndEquity,
        difference: assets - liabilitiesAndEquity,
      },
      deferred_cogs:
        this.toDeferredCogsSummary(deferredCogs),
    });
  }

  async cashFlow(
    input: FinanceStatementQuery | unknown = {},
    session?: ClientSession
  ) {
    const { state, period, range } =
      await this.resolvePeriod(input, session);
    const accounts =
      await this.statementRepository.listAccounts();
    const cashAccounts = accounts.filter((account) =>
      CASH_SUBTYPES.has(account.subtype ?? '')
    );
    const marketplaceAccounts = accounts.filter(
      (account) => account.subtype === 'marketplace_balance'
    );
    const cashAccountIds = cashAccounts.map((account) =>
      String(account._id)
    );
    const marketplaceAccountIds = marketplaceAccounts.map(
      (account) => String(account._id)
    );
    const priorPeriodEnd = new Date(
      range.startDate.getTime() - 1
    );

    const [
      openingTotals,
      closingTotals,
      marketplaceTotals,
    ] = await Promise.all([
      this.statementRepository.aggregatePostedLineTotals({
        end_date: priorPeriodEnd,
        account_ids: cashAccountIds,
        session,
      }),
      this.statementRepository.aggregatePostedLineTotals({
        end_date: range.endDate,
        account_ids: cashAccountIds,
        session,
      }),
      this.statementRepository.aggregatePostedLineTotals({
        end_date: range.endDate,
        account_ids: marketplaceAccountIds,
        session,
      }),
    ]);

    const openingByAccount =
      this.toTotalsMap(openingTotals);
    const closingByAccount =
      this.toTotalsMap(closingTotals);
    const marketplaceByAccount = this.toTotalsMap(
      marketplaceTotals
    );
    const openingCashBalance = cashAccounts.reduce(
      (sum, account) =>
        sum +
        getAccountBalance(
          account,
          openingByAccount.get(String(account._id))
        ),
      0
    );
    const closingCashBalance = cashAccounts.reduce(
      (sum, account) =>
        sum +
        getAccountBalance(
          account,
          closingByAccount.get(String(account._id))
        ),
      0
    );
    const marketplaceBalances = marketplaceAccounts.map(
      (account) => ({
        account_id: String(account._id),
        code: account.code,
        name: account.name,
        balance: getAccountBalance(
          account,
          marketplaceByAccount.get(String(account._id))
        ),
      })
    );
    const marketplaceBalanceTotal =
      marketplaceBalances.reduce(
        (sum, row) => sum + row.balance,
        0
      );
    const accountById = new Map(
      accounts.map((account) => [
        String(account._id),
        account,
      ])
    );
    const cashAccountIdSet = new Set(cashAccountIds);
    const lineTotals = new Map<
      string,
      {
        section: CashFlowSection;
        label: string;
        source_type: string;
        amount: number;
        journal_count: number;
      }
    >();

    for await (const journal of this.statementRepository.streamCashFlowJournals(
      range.startDate,
      range.endDate,
      cashAccountIds,
      session
    )) {
      const cashDelta = journal.lines.reduce(
        (sum, line) => {
          const accountId = String(line.account_id);
          const account = accountById.get(accountId);
          if (
            !account ||
            !cashAccountIdSet.has(accountId)
          ) {
            return sum;
          }
          return (
            sum +
            (account.normal_balance === 'debit'
              ? line.debit - line.credit
              : line.credit - line.debit)
          );
        },
        0
      );

      if (cashDelta === 0) continue;

      const counterpartAccounts = journal.lines
        .filter(
          (line) =>
            !cashAccountIdSet.has(String(line.account_id))
        )
        .map((line) =>
          accountById.get(String(line.account_id))
        )
        .filter(
          (
            account
          ): account is FinanceStatementAccountRecord =>
            account !== undefined
        );
      const classification =
        journal.source_type === 'opening_balance'
          ? {
              section: 'opening_balance' as const,
              label: 'Saldo awal Kas/Bank',
            }
          : classifyCashFlowMovement(
              journal.source_type,
              journal.source_event,
              cashDelta,
              counterpartAccounts
            );
      const key = [
        classification.section,
        journal.source_type,
        classification.label,
      ].join(':');
      const existing = lineTotals.get(key);
      if (existing) {
        existing.amount += cashDelta;
        existing.journal_count += 1;
      } else {
        lineTotals.set(key, {
          ...classification,
          source_type: journal.source_type,
          amount: cashDelta,
          journal_count: 1,
        });
      }
    }

    const sectionOrder: Record<CashFlowSection, number> = {
      opening_balance: 0,
      operating: 1,
      investing: 2,
      financing: 3,
      outside_scope: 4,
      unclassified: 5,
    };
    const lines = [...lineTotals.values()].sort(
      (left, right) =>
        sectionOrder[left.section] -
          sectionOrder[right.section] ||
        left.label.localeCompare(right.label, 'id')
    );
    const sumSection = (section: CashFlowSection) =>
      lines
        .filter((line) => line.section === section)
        .reduce((sum, line) => sum + line.amount, 0);
    const openingBalanceAdjustment = sumSection(
      'opening_balance'
    );
    const operatingNet = sumSection('operating');
    const investingNet = sumSection('investing');
    const financingNet = sumSection('financing');
    const outsideScopeNet = sumSection('outside_scope');
    const unclassifiedNet = sumSection('unclassified');
    const netCashChange =
      operatingNet + investingNet + financingNet;
    const otherCashMovementNet =
      outsideScopeNet + unclassifiedNet;

    return FinanceCashFlowReportSchema.parse({
      report_type: 'cash_flow',
      period: this.toPeriodDTO(state, period),
      lines,
      marketplace_balances: marketplaceBalances,
      totals: {
        opening_cash_balance: openingCashBalance,
        opening_balance_adjustment:
          openingBalanceAdjustment,
        operating_net: operatingNet,
        investing_net: investingNet,
        financing_net: financingNet,
        net_cash_change: netCashChange,
        outside_scope_net: outsideScopeNet,
        unclassified_net: unclassifiedNet,
        other_cash_movement_net: otherCashMovementNet,
        closing_cash_balance: closingCashBalance,
        reconciliation_difference:
          openingCashBalance +
          openingBalanceAdjustment +
          netCashChange +
          otherCashMovementNet -
          closingCashBalance,
        marketplace_balance_total: marketplaceBalanceTotal,
      },
      cash_account_count: cashAccounts.length,
    });
  }

  private async resolvePeriod(
    input: FinanceStatementQuery | unknown,
    session?: ClientSession
  ) {
    const query = FinanceStatementQuerySchema.parse(input);
    const finance =
      await this.financeRepository.findFinanceState(
        session
      );
    const state = normalizeFinanceState(finance);
    if (state.status !== 'active') {
      throw new FinanceDomainError(
        'Finance module belum aktif.',
        'FINANCE_NOT_ACTIVE'
      );
    }

    const periodKey =
      query.period ??
      getFinancePeriodKey(
        this.now(),
        state.calendar_timezone
      );
    const range = getFinancePeriodBounds(
      periodKey,
      state.calendar_timezone
    );

    return { state, period: periodKey, range };
  }

  private toPeriodDTO(
    state: FinanceState,
    periodKey: string
  ): FinanceStatementPeriod {
    const range = getFinancePeriodBounds(
      periodKey,
      state.calendar_timezone
    );
    return {
      period_key: periodKey,
      calendar_timezone: state.calendar_timezone,
      start_date: getFinanceCalendarDate(
        range.startDate,
        state.calendar_timezone
      ),
      end_date: getFinanceCalendarDate(
        range.endDate,
        state.calendar_timezone
      ),
      starts_at: range.startDate.toISOString(),
      ends_at: range.endDate.toISOString(),
      history_start_date: state.cut_off_date
        ? this.toDateOnly(state.cut_off_date)
        : null,
    };
  }

  private toTotalsMap(
    totals: FinanceStatementAccountTotalsRecord[]
  ): AccountLineTotals {
    return new Map(
      totals.map((record) => [String(record._id), record])
    );
  }

  private getTotals(
    account: FinanceStatementAccountRecord,
    totalsByAccount: AccountLineTotals
  ) {
    const totals = totalsByAccount.get(String(account._id));
    return {
      debit_total: totals?.debit_total ?? 0,
      credit_total: totals?.credit_total ?? 0,
    };
  }

  private getNormalBalanceAmount(
    account: FinanceStatementAccountRecord,
    totals: { debit_total: number; credit_total: number }
  ) {
    return account.normal_balance === 'debit'
      ? totals.debit_total - totals.credit_total
      : totals.credit_total - totals.debit_total;
  }

  private getProfitAndLossAmount(
    account: FinanceStatementAccountRecord,
    totals: { debit_total: number; credit_total: number }
  ) {
    return ['revenue', 'other_income'].includes(
      account.type
    )
      ? totals.credit_total - totals.debit_total
      : totals.debit_total - totals.credit_total;
  }

  private toAccountRows(
    accounts: FinanceStatementAccountRecord[],
    totalsByAccount: AccountLineTotals,
    includeMovement: boolean,
    amountBasis:
      | 'normal_balance'
      | 'profit_and_loss' = 'normal_balance'
  ): FinanceStatementAccountAmount[] {
    return accounts
      .map((account) => {
        const totals = this.getTotals(
          account,
          totalsByAccount
        );
        return {
          account_id: String(account._id),
          code: account.code,
          name: account.name,
          type: account.type,
          normal_balance: account.normal_balance,
          ...totals,
          amount:
            amountBasis === 'profit_and_loss'
              ? this.getProfitAndLossAmount(account, totals)
              : this.getNormalBalanceAmount(
                  account,
                  totals
                ),
        };
      })
      .filter((row) =>
        includeMovement
          ? row.debit_total !== 0 || row.credit_total !== 0
          : row.amount !== 0
      );
  }

  private rowsForType(
    rows: FinanceStatementAccountAmount[],
    accounts: FinanceStatementAccountRecord[],
    type: FinanceAccountType
  ) {
    const matchingIds = new Set(
      accounts
        .filter((account) => account.type === type)
        .map((account) => String(account._id))
    );
    return rows.filter((row) =>
      matchingIds.has(row.account_id)
    );
  }

  private sumAmount(
    rows: ReadonlyArray<FinanceStatementAccountAmount>
  ) {
    return rows.reduce((sum, row) => sum + row.amount, 0);
  }

  private toDeferredCogsSummary(
    rows: DeferredCogsReason[]
  ): FinanceDeferredCogsSummary {
    return {
      transaction_count: rows.reduce(
        (sum, row) => sum + row.transaction_count,
        0
      ),
      related_sales_amount: rows.reduce(
        (sum, row) => sum + row.related_sales_amount,
        0
      ),
      reasons: rows.map((row) => ({
        reason: row._id,
        transaction_count: row.transaction_count,
        related_sales_amount: row.related_sales_amount,
      })),
    };
  }

  private toDateOnly(value: Date) {
    return value.toISOString().slice(0, 10);
  }
}
