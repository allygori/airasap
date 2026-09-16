import { Types } from 'mongoose';
import { AccountingAccountModel } from '@/modules/accounting/accounts/account.model';
import { JournalEntryModel } from '@/modules/accounting/journal-entries/journal-entry.model';
import { InventoryItemModel } from '@/modules/inventory/items/inventory-item.model';
import { InventoryMovementModel } from '@/modules/inventory/movements/inventory-movement.model';
import { SettlementModel } from '@/modules/accounting/settlements/settlement.model';
import {
  getAccountingScopeOptions,
  getJournalDimensionFilter,
  resolveAccountingScope,
  type AccountingScopeOptions,
} from '@/modules/accounting/accounting-scope';
import {
  AccountingTenantContext,
  toAccountingObjectId,
} from '@/modules/accounting/accounting.types';
import type { AccountingReportQuery } from './accounting-report.schema';

type ReportPeriod = {
  from: Date;
  to: Date;
  key: string;
};

type AccountBalance = {
  account_id: string;
  code: string;
  name: string;
  type: string;
  subtype: string | null;
  normal_balance: 'debit' | 'credit';
  debit: number;
  credit: number;
  balance: number;
};

type JournalActivity = {
  id: string;
  entry_number: string;
  transaction_date: string;
  description: string;
  source_type: string | null;
  status: string;
  amount: number;
};

type ReportJournalLine = {
  debit: number;
  dimensions?: Record<string, string>;
};

type InventorySnapshotRow = {
  inventory_item_id: string;
  sku: string;
  name: string;
  unit: string;
  quantity: number;
  value: number;
};

const roundMoney = (value: number) => Math.round(value);

const getMonthPeriod = (period: string): ReportPeriod => {
  const [year, month] = period.split('-').map(Number);
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(
    Date.UTC(year, month, 0, 23, 59, 59, 999)
  );
  return { from, to, key: period };
};

const getReportPeriod = (
  query: AccountingReportQuery
): ReportPeriod => {
  if (query.period) return getMonthPeriod(query.period);

  if (query.from && query.to) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    return {
      from,
      to,
      key: `${from.toISOString().slice(0, 10)} → ${to
        .toISOString()
        .slice(0, 10)}`,
    };
  }

  const now = new Date();
  return getMonthPeriod(
    `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  );
};

const sumByType = (
  accounts: AccountBalance[],
  types: string[]
) =>
  roundMoney(
    accounts
      .filter((account) => types.includes(account.type))
      .reduce((sum, account) => sum + account.balance, 0)
  );

const lineMatchesScope = (
  line: ReportJournalLine,
  scope: { store?: Types.ObjectId; platform?: string }
) => {
  const dimensions = line.dimensions;
  return (
    (!scope.store ||
      dimensions?.store === String(scope.store)) &&
    (!scope.platform ||
      dimensions?.platform === scope.platform)
  );
};

export type AccountingReport = {
  period: {
    key: string;
    from: string;
    to: string;
  };
  summary: {
    revenue: number;
    cost_of_sales: number;
    operating_expenses: number;
    total_expenses: number;
    net_income: number;
    cash_inflow: number;
    cash_outflow: number;
    cash_movement: number;
    inventory_value: number;
    receivable_balance: number;
  };
  profit_and_loss: {
    revenue: AccountBalance[];
    cost_of_sales: AccountBalance[];
    expenses: AccountBalance[];
  };
  trial_balance: AccountBalance[];
  cash_accounts: AccountBalance[];
  inventory: InventorySnapshotRow[];
  journal_activity: JournalActivity[];
  settlements: {
    posted_count: number;
    blocked_count: number;
    exception_count: number;
    gross_amount: number;
    fee_amount: number;
    net_amount: number;
    reconciliation_difference: number;
  };
  filters: AccountingScopeOptions;
};

export class AccountingReportService {
  constructor(
    private readonly context: AccountingTenantContext
  ) {}

  async getReport(
    query: AccountingReportQuery
  ): Promise<AccountingReport> {
    const organization = toAccountingObjectId(
      this.context.organizationId,
      'organizationId'
    );
    const period = getReportPeriod(query);
    const scope = await resolveAccountingScope(
      organization,
      query
    );
    const dimensionFilter =
      getJournalDimensionFilter(scope);

    const [
      accounts,
      journalTotals,
      inventoryRows,
      journals,
      settlements,
      filters,
    ] = await Promise.all([
      AccountingAccountModel.find({
        organization,
        is_active: true,
      })
        .sort({ display_order: 1, code: 1 })
        .lean(),
      JournalEntryModel.aggregate<{
        _id: Types.ObjectId;
        debit: number;
        credit: number;
      }>([
        {
          $match: {
            organization,
            status: 'posted',
            transaction_date: {
              $gte: period.from,
              $lte: period.to,
            },
            ...dimensionFilter,
          },
        },
        { $unwind: '$lines' },
        { $match: dimensionFilter },
        {
          $group: {
            _id: '$lines.account',
            debit: { $sum: '$lines.debit' },
            credit: { $sum: '$lines.credit' },
          },
        },
      ]),
      InventoryMovementModel.aggregate<{
        _id: { inventory_item: Types.ObjectId };
        quantity: number;
        value: number;
      }>([
        {
          $match: {
            organization,
            status: 'posted',
            occurred_at: { $lte: period.to },
            ...(scope.store ? { store: scope.store } : {}),
            ...(scope.platform
              ? { platform: scope.platform }
              : {}),
          },
        },
        {
          $project: {
            inventory_item: 1,
            movement_type: 1,
            quantity: 1,
            total_cost: { $ifNull: ['$total_cost', 0] },
          },
        },
        {
          $group: {
            _id: { inventory_item: '$inventory_item' },
            quantity: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$movement_type',
                      ['purchase', 'return', 'transfer_in'],
                    ],
                  },
                  '$quantity',
                  { $multiply: ['$quantity', -1] },
                ],
              },
            },
            value: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$movement_type',
                      ['purchase', 'return', 'transfer_in'],
                    ],
                  },
                  '$total_cost',
                  { $multiply: ['$total_cost', -1] },
                ],
              },
            },
          },
        },
        { $match: { quantity: { $ne: 0 } } },
      ]),
      JournalEntryModel.find({
        organization,
        status: 'posted',
        transaction_date: {
          $gte: period.from,
          $lte: period.to,
        },
        ...dimensionFilter,
      })
        .sort({ transaction_date: -1, created_at: -1 })
        .limit(12)
        .lean(),
      SettlementModel.find({
        organization,
        settled_at: { $gte: period.from, $lte: period.to },
        status: { $in: ['posted', 'blocked'] },
        ...(scope.store ? { store: scope.store } : {}),
        ...(scope.platform
          ? { platform: scope.platform }
          : {}),
      }).lean(),
      getAccountingScopeOptions(organization),
    ]);

    const totalByAccount = new Map(
      journalTotals.map((item) => [String(item._id), item])
    );
    const trialBalance: AccountBalance[] = accounts
      .filter((account) => account.is_postable)
      .map((account) => {
        const totals = totalByAccount.get(
          String(account._id)
        );
        const debit = totals?.debit ?? 0;
        const credit = totals?.credit ?? 0;
        const balance =
          account.normal_balance === 'debit'
            ? debit - credit
            : credit - debit;

        return {
          account_id: String(account._id),
          code: account.code,
          name: account.name,
          type: account.type,
          subtype: account.subtype ?? null,
          normal_balance: account.normal_balance,
          debit: roundMoney(debit),
          credit: roundMoney(credit),
          balance: roundMoney(balance),
        };
      })
      .filter(
        (account) =>
          account.debit !== 0 || account.credit !== 0
      );

    const revenue = trialBalance.filter((account) =>
      ['revenue', 'other_income'].includes(account.type)
    );
    const costOfSales = trialBalance.filter((account) =>
      ['cost_of_sales'].includes(account.type)
    );
    const expenses = trialBalance.filter((account) =>
      ['expense', 'other_expense'].includes(account.type)
    );
    const cashAccounts = trialBalance.filter((account) =>
      [
        'cash',
        'bank',
        'marketplace_balance',
        'e_wallet',
      ].includes(account.subtype ?? '')
    );
    const receivableBalance = trialBalance
      .filter((account) => account.code === '1210')
      .reduce((sum, account) => sum + account.balance, 0);
    const inventoryValue = inventoryRows.reduce(
      (sum, row) => sum + (row.value ?? 0),
      0
    );
    const cashInflow = cashAccounts.reduce(
      (sum, account) => sum + account.debit,
      0
    );
    const cashOutflow = cashAccounts.reduce(
      (sum, account) => sum + account.credit,
      0
    );
    const revenueTotal = sumByType(revenue, [
      'revenue',
      'other_income',
    ]);
    const costOfSalesTotal = sumByType(costOfSales, [
      'cost_of_sales',
    ]);
    const operatingExpensesTotal = sumByType(expenses, [
      'expense',
      'other_expense',
    ]);

    const inventoryItemIds = inventoryRows.map(
      (row) => row._id.inventory_item
    );
    const inventoryItems = await InventoryItemModel.find({
      organization,
      _id: { $in: inventoryItemIds },
    }).lean();
    const inventoryItemById = new Map(
      inventoryItems.map((item) => [String(item._id), item])
    );

    const inventory = inventoryRows
      .map((row) => {
        const item = inventoryItemById.get(
          String(row._id.inventory_item)
        );
        if (!item) return null;
        return {
          inventory_item_id: String(row._id.inventory_item),
          sku: item.sku,
          name: item.name,
          unit: item.unit,
          quantity: row.quantity,
          value: roundMoney(row.value ?? 0),
        };
      })
      .filter((row): row is InventorySnapshotRow =>
        Boolean(row)
      )
      .sort((left, right) => right.value - left.value);

    const settlementSummary = settlements.reduce(
      (summary, settlement) => ({
        posted_count:
          summary.posted_count +
          (settlement.status === 'posted' ? 1 : 0),
        blocked_count:
          summary.blocked_count +
          (settlement.status === 'blocked' ? 1 : 0),
        exception_count:
          summary.exception_count +
          (settlement.reconciliation_status === 'exception'
            ? 1
            : 0),
        gross_amount:
          summary.gross_amount + settlement.gross_amount,
        fee_amount:
          summary.fee_amount + settlement.fee_amount,
        net_amount:
          summary.net_amount + settlement.net_amount,
        reconciliation_difference:
          summary.reconciliation_difference +
          settlement.reconciliation_difference,
      }),
      {
        posted_count: 0,
        blocked_count: 0,
        exception_count: 0,
        gross_amount: 0,
        fee_amount: 0,
        net_amount: 0,
        reconciliation_difference: 0,
      }
    );

    return {
      period: {
        key: period.key,
        from: period.from.toISOString(),
        to: period.to.toISOString(),
      },
      summary: {
        revenue: revenueTotal,
        cost_of_sales: costOfSalesTotal,
        operating_expenses: operatingExpensesTotal,
        total_expenses:
          costOfSalesTotal + operatingExpensesTotal,
        net_income:
          revenueTotal -
          costOfSalesTotal -
          operatingExpensesTotal,
        cash_inflow: roundMoney(cashInflow),
        cash_outflow: roundMoney(cashOutflow),
        cash_movement: roundMoney(cashInflow - cashOutflow),
        inventory_value: roundMoney(inventoryValue),
        receivable_balance: roundMoney(receivableBalance),
      },
      profit_and_loss: {
        revenue,
        cost_of_sales: costOfSales,
        expenses,
      },
      trial_balance: trialBalance,
      cash_accounts: cashAccounts,
      inventory,
      journal_activity: journals.map((journal) => ({
        id: String(journal._id),
        entry_number: journal.entry_number,
        transaction_date:
          journal.transaction_date.toISOString(),
        description: journal.description,
        source_type: journal.source_type ?? null,
        status: journal.status,
        amount: roundMoney(
          journal.lines
            .filter((line: ReportJournalLine) =>
              lineMatchesScope(line, scope)
            )
            .reduce(
              (sum: number, line: { debit: number }) =>
                sum + line.debit,
              0
            )
        ),
      })),
      settlements: {
        posted_count: settlementSummary.posted_count,
        blocked_count: settlementSummary.blocked_count,
        exception_count: settlementSummary.exception_count,
        gross_amount: roundMoney(
          settlementSummary.gross_amount
        ),
        fee_amount: roundMoney(
          settlementSummary.fee_amount
        ),
        net_amount: roundMoney(
          settlementSummary.net_amount
        ),
        reconciliation_difference: roundMoney(
          settlementSummary.reconciliation_difference
        ),
      },
      filters,
    };
  }
}
