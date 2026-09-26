import type { ClientSession } from 'mongoose';
import { OrganizationRepository } from '@/modules/organizations/organization.repository';
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
import { FinanceSalesTransactionRepository } from '../sales/finance-sales-transaction.repository';
import {
  FinanceBalanceSheetReportSchema,
  FinanceProfitLossReportSchema,
  FinanceStatementQuerySchema,
  FinanceTrialBalanceReportSchema,
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

type FinanceStatementOrganization = {
  finance?: Partial<FinanceState> | null;
} | null;

type FinanceStatementOrganizationPort = {
  findFinanceState(
    session?: ClientSession
  ): Promise<FinanceStatementOrganization>;
};

type FinanceStatementRepositoryPort = Pick<
  FinanceFinancialStatementsRepository,
  'listAccounts' | 'aggregatePostedLineTotals'
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

export class FinanceFinancialStatementsReadService {
  private readonly organizationRepository: FinanceStatementOrganizationPort;
  private readonly statementRepository: FinanceStatementRepositoryPort;
  private readonly salesRepository: FinanceStatementSalesRepositoryPort;
  private readonly now: () => Date;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      organizationRepository?: FinanceStatementOrganizationPort;
      statementRepository?: FinanceStatementRepositoryPort;
      salesRepository?: FinanceStatementSalesRepositoryPort;
      now?: () => Date;
    }
  ) {
    assertFinanceTenant(context);
    this.organizationRepository =
      dependencies?.organizationRepository ??
      new OrganizationRepository(context);
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

  private async resolvePeriod(
    input: FinanceStatementQuery | unknown,
    session?: ClientSession
  ) {
    const query = FinanceStatementQuerySchema.parse(input);
    const organization =
      await this.organizationRepository.findFinanceState(
        session
      );
    if (!organization) {
      throw new FinanceDomainError(
        'Organization tidak ditemukan.',
        'FINANCE_ORGANIZATION_NOT_FOUND'
      );
    }

    const state = normalizeFinanceState(
      organization.finance
    );
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
