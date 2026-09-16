import { Types } from 'mongoose';
import { AccountingAccountModel } from '@/modules/accounting/accounts/account.model';
import { JournalEntryModel } from '@/modules/accounting/journal-entries/journal-entry.model';
import {
  type AccountingTenantContext,
  toAccountingObjectId,
} from '@/modules/accounting/accounting.types';
import {
  getAccountingScopeOptions,
  getJournalDimensionFilter,
  resolveAccountingScope,
  type AccountingScopeOptions,
} from '@/modules/accounting/accounting-scope';
import type { AccountingExplorerQuery } from './accounting-explorer.schema';

type ExplorerPeriod = {
  from: Date;
  to: Date;
  key: string;
};

const getPeriod = (
  period?: string
): ExplorerPeriod | null => {
  if (!period) return null;
  const [year, month] = period.split('-').map(Number);
  return {
    from: new Date(Date.UTC(year, month - 1, 1)),
    to: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
    key: period,
  };
};

const roundMoney = (value: number) => Math.round(value);

type AccountExplorerRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype: string | null;
  parent_account_id: string | null;
  normal_balance: 'debit' | 'credit';
  is_system: boolean;
  is_postable: boolean;
  is_active: boolean;
  description: string | null;
};

type JournalLineExplorerRow = {
  id: string;
  account_id: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description: string | null;
  dimensions: Record<string, string> | null;
};

type RawJournalLine = {
  account: Types.ObjectId;
  debit: number;
  credit: number;
  description?: string;
  dimensions?: Record<string, string>;
};

const lineMatchesScope = (
  line: RawJournalLine,
  scope: { store?: Types.ObjectId; platform?: string }
) => {
  return (
    (!scope.store ||
      line.dimensions?.store === String(scope.store)) &&
    (!scope.platform ||
      line.dimensions?.platform === scope.platform)
  );
};

type JournalExplorerRow = {
  id: string;
  entry_number: string;
  transaction_date: string;
  posting_date: string;
  period: string;
  description: string;
  source_type: string | null;
  source_id: string | null;
  source_event: string | null;
  status: string;
  total_debit: number;
  total_credit: number;
  lines: JournalLineExplorerRow[];
};

type LedgerExplorerRow = {
  id: string;
  journal_entry_id: string;
  entry_number: string;
  transaction_date: string;
  posting_date: string;
  description: string;
  source_type: string | null;
  account_id: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  running_balance: number;
};

export type AccountingExplorer = {
  period: {
    key: string | null;
    from: string | null;
    to: string | null;
  };
  accounts: AccountExplorerRow[];
  journal_entries: JournalExplorerRow[];
  ledger: LedgerExplorerRow[];
  filters: AccountingScopeOptions;
};

export class AccountingExplorerService {
  constructor(
    private readonly context: AccountingTenantContext
  ) {}

  async getExplorer(
    query: AccountingExplorerQuery
  ): Promise<AccountingExplorer> {
    const organization = toAccountingObjectId(
      this.context.organizationId,
      'organizationId'
    );
    const period = getPeriod(query.period);
    const scope = await resolveAccountingScope(
      organization,
      query
    );
    const dimensionFilter =
      getJournalDimensionFilter(scope);
    const baseJournalFilter = {
      organization,
      ...(query.status ? { status: query.status } : {}),
      ...(period
        ? {
            transaction_date: {
              $gte: period.from,
              $lte: period.to,
            },
          }
        : {}),
      ...dimensionFilter,
    };

    const [accounts, journals, ledger, filters] =
      await Promise.all([
        AccountingAccountModel.find({ organization })
          .sort({ display_order: 1, code: 1 })
          .lean(),
        JournalEntryModel.find(baseJournalFilter)
          .sort({ transaction_date: -1, entry_number: -1 })
          .limit(query.limit)
          .lean(),
        this.getLedgerRows(
          organization,
          baseJournalFilter,
          dimensionFilter,
          query.account_id,
          query.limit
        ),
        getAccountingScopeOptions(organization),
      ]);

    const accountRows: AccountExplorerRow[] = accounts.map(
      (account) => ({
        id: String(account._id),
        code: account.code,
        name: account.name,
        type: account.type,
        subtype: account.subtype ?? null,
        parent_account_id: account.parent_account
          ? String(account.parent_account)
          : null,
        normal_balance: account.normal_balance,
        is_system: account.is_system,
        is_postable: account.is_postable,
        is_active: account.is_active,
        description: account.description ?? null,
      })
    );
    const accountById = new Map(
      accountRows.map((account) => [account.id, account])
    );

    const journalRows: JournalExplorerRow[] = journals.map(
      (journal) => ({
        id: String(journal._id),
        entry_number: journal.entry_number,
        transaction_date:
          journal.transaction_date.toISOString(),
        posting_date: journal.posting_date.toISOString(),
        period: journal.period,
        description: journal.description,
        source_type: journal.source_type ?? null,
        source_id: journal.source_id ?? null,
        source_event: journal.source_event ?? null,
        status: journal.status,
        total_debit: roundMoney(
          journal.lines
            .filter((line: RawJournalLine) =>
              lineMatchesScope(line, scope)
            )
            .reduce(
              (sum: number, line: RawJournalLine) =>
                sum + line.debit,
              0
            )
        ),
        total_credit: roundMoney(
          journal.lines
            .filter((line: RawJournalLine) =>
              lineMatchesScope(line, scope)
            )
            .reduce(
              (sum: number, line: RawJournalLine) =>
                sum + line.credit,
              0
            )
        ),
        lines: journal.lines
          .filter((line: RawJournalLine) =>
            lineMatchesScope(line, scope)
          )
          .map((line: RawJournalLine) => {
            const account = accountById.get(
              String(line.account)
            );
            return {
              id: `${String(journal._id)}-${String(line.account)}`,
              account_id: String(line.account),
              account_code: account?.code ?? 'UNKNOWN',
              account_name:
                account?.name ?? 'Account tidak ditemukan',
              debit: roundMoney(line.debit),
              credit: roundMoney(line.credit),
              description: line.description ?? null,
              dimensions: line.dimensions ?? null,
            };
          }),
      })
    );

    return {
      period: {
        key: period?.key ?? null,
        from: period?.from.toISOString() ?? null,
        to: period?.to.toISOString() ?? null,
      },
      accounts: accountRows,
      journal_entries: journalRows,
      ledger,
      filters,
    };
  }

  private async getLedgerRows(
    organization: Types.ObjectId,
    baseJournalFilter: Record<string, unknown>,
    dimensionFilter: Record<string, string>,
    accountId: string | undefined,
    limit: number
  ): Promise<LedgerExplorerRow[]> {
    const account = accountId
      ? toAccountingObjectId(accountId, 'account_id')
      : undefined;
    const rows = await JournalEntryModel.aggregate<{
      _id: Types.ObjectId;
      entry_number: string;
      transaction_date: Date;
      posting_date: Date;
      description: string;
      source_type?: string;
      lines: {
        account: Types.ObjectId;
        debit: number;
        credit: number;
      };
    }>([
      {
        $match: {
          ...baseJournalFilter,
          organization,
          status: 'posted',
        },
      },
      { $unwind: '$lines' },
      { $match: dimensionFilter },
      ...(account
        ? [{ $match: { 'lines.account': account } }]
        : []),
      {
        $project: {
          entry_number: 1,
          transaction_date: 1,
          posting_date: 1,
          description: 1,
          source_type: 1,
          lines: 1,
        },
      },
      { $sort: { transaction_date: 1, entry_number: 1 } },
    ]);

    const accountIds = [
      ...new Set(
        rows.map((row) => String(row.lines.account))
      ),
    ];
    const accounts = await AccountingAccountModel.find({
      organization,
      _id: { $in: accountIds },
    }).lean();
    const accountById = new Map(
      accounts.map((item) => [String(item._id), item])
    );
    const runningBalances = new Map<string, number>();

    const ledgerRows = rows.map((row) => {
      const accountKey = String(row.lines.account);
      const accountRecord = accountById.get(accountKey);
      const previous = runningBalances.get(accountKey) ?? 0;
      const movement =
        accountRecord?.normal_balance === 'credit'
          ? row.lines.credit - row.lines.debit
          : row.lines.debit - row.lines.credit;
      const runningBalance = previous + movement;
      runningBalances.set(accountKey, runningBalance);

      return {
        id: `${String(row._id)}-${accountKey}`,
        journal_entry_id: String(row._id),
        entry_number: row.entry_number,
        transaction_date:
          row.transaction_date.toISOString(),
        posting_date: row.posting_date.toISOString(),
        description: row.description,
        source_type: row.source_type ?? null,
        account_id: accountKey,
        account_code: accountRecord?.code ?? 'UNKNOWN',
        account_name:
          accountRecord?.name ?? 'Account tidak ditemukan',
        debit: roundMoney(row.lines.debit),
        credit: roundMoney(row.lines.credit),
        running_balance: roundMoney(runningBalance),
      };
    });

    // Compute the running balance from the complete filtered period first,
    // then return the latest requested rows. This prevents the first visible
    // row from looking like an opening balance when older lines were hidden by
    // the response limit.
    return ledgerRows.slice(-limit);
  }
}
