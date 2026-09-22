import { Types } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import {
  FinanceAccountRepository,
  type FinanceAccountPersistenceRecord,
} from '../accounts/finance-account.repository';
import type {
  FinanceJournalDetailResponseDTO,
  FinanceJournalEntryDetailDTO,
  FinanceJournalEntrySummaryDTO,
  FinanceJournalLedgerQueryDTO,
  FinanceJournalListQueryDTO,
  FinanceJournalListResponseDTO,
  FinanceLedgerResponseDTO,
} from './finance-journal.dto';
import {
  FinanceJournalDetailResponseSchema,
  FinanceJournalEntryDetailSchema,
  FinanceJournalEntrySummarySchema,
  FinanceJournalLedgerQuerySchema,
  FinanceJournalListQuerySchema,
  FinanceJournalListResponseSchema,
  FinanceLedgerResponseSchema,
} from './finance-journal.schema';
import {
  FinanceJournalRepository,
  type FinanceJournalPersistenceRecord,
  type FinanceLedgerPersistenceRow,
} from './finance-journal.repository';

const MAX_LEDGER_ROWS = 5000;

type FinanceJournalReadRepositoryPort = Pick<
  FinanceJournalRepository,
  'list' | 'findEntryById' | 'findLedgerLines'
>;

type FinanceAccountReadRepositoryPort = Pick<
  FinanceAccountRepository,
  'findByIds'
>;

const toAccountMap = (
  accounts: FinanceAccountPersistenceRecord[]
) =>
  new Map(
    accounts.map((account) => [
      String(account._id),
      account,
    ])
  );

const mapSummary = (
  record: FinanceJournalPersistenceRecord
): FinanceJournalEntrySummaryDTO =>
  FinanceJournalEntrySummarySchema.parse({
    id: String(record._id),
    entry_number: record.entry_number,
    transaction_date: record.transaction_date.toISOString(),
    posting_date: record.posting_date.toISOString(),
    period: record.period,
    currency: record.currency,
    description: record.description,
    source_type: record.source_type,
    source_id: record.source_id,
    source_event: record.source_event,
    status: record.status,
    total_debit: record.lines.reduce(
      (sum, line) => sum + line.debit,
      0
    ),
    total_credit: record.lines.reduce(
      (sum, line) => sum + line.credit,
      0
    ),
    line_count: record.lines.length,
    reversal_of: record.reversal_of
      ? String(record.reversal_of)
      : null,
  });

const mapDetail = (
  record: FinanceJournalPersistenceRecord,
  accounts: Map<string, FinanceAccountPersistenceRecord>
): FinanceJournalEntryDetailDTO =>
  FinanceJournalEntryDetailSchema.parse({
    id: String(record._id),
    entry_number: record.entry_number,
    transaction_date: record.transaction_date.toISOString(),
    posting_date: record.posting_date.toISOString(),
    period: record.period,
    currency: record.currency,
    description: record.description,
    source_type: record.source_type,
    source_id: record.source_id,
    source_event: record.source_event,
    idempotency_key: record.idempotency_key,
    status: record.status,
    posted_at: record.posted_at.toISOString(),
    posted_by: record.posted_by
      ? String(record.posted_by)
      : null,
    reversal_of: record.reversal_of
      ? String(record.reversal_of)
      : null,
    lines: record.lines.map((line) => {
      const account = accounts.get(String(line.account_id));
      return {
        account_id: String(line.account_id),
        account_code: account?.code ?? null,
        account_name: account?.name ?? null,
        normal_balance: account?.normal_balance ?? null,
        debit: line.debit,
        credit: line.credit,
        description: line.description ?? null,
        dimensions: line.dimensions ?? null,
      };
    }),
  });

const mapLedgerRow = (
  row: FinanceLedgerPersistenceRow,
  account: FinanceAccountPersistenceRecord,
  runningBalance: number
) => ({
  id: `${String(row._id)}-${row.line_index}`,
  journal_entry_id: String(row._id),
  entry_number: row.entry_number,
  transaction_date: row.transaction_date.toISOString(),
  posting_date: row.posting_date.toISOString(),
  description: row.description,
  source_type: row.source_type,
  account_id: String(row.lines.account_id),
  account_code: account.code,
  account_name: account.name,
  normal_balance: account.normal_balance,
  debit: row.lines.debit,
  credit: row.lines.credit,
  running_balance: runningBalance,
});

export class FinanceJournalReadService {
  private readonly journalRepository: FinanceJournalReadRepositoryPort;
  private readonly accountRepository: FinanceAccountReadRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      journalRepository?: FinanceJournalReadRepositoryPort;
      accountRepository?: FinanceAccountReadRepositoryPort;
    }
  ) {
    assertFinanceTenant(context);
    this.journalRepository =
      dependencies?.journalRepository ??
      new FinanceJournalRepository(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
  }

  async list(
    input: FinanceJournalListQueryDTO | unknown
  ): Promise<FinanceJournalListResponseDTO> {
    const query =
      FinanceJournalListQuerySchema.parse(input);
    const result = await this.journalRepository.list(query);
    const totalPages = Math.ceil(
      result.total / query.limit
    );

    return FinanceJournalListResponseSchema.parse({
      entries: result.records.map(mapSummary),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        total_pages: totalPages,
      },
    });
  }

  async get(
    journalEntryId: string
  ): Promise<FinanceJournalDetailResponseDTO> {
    if (!Types.ObjectId.isValid(journalEntryId)) {
      throw new FinanceDomainError(
        'Journal Finance tidak ditemukan.',
        'FINANCE_JOURNAL_NOT_FOUND'
      );
    }

    const record =
      await this.journalRepository.findEntryById(
        journalEntryId
      );
    if (!record) {
      throw new FinanceDomainError(
        'Journal Finance tidak ditemukan.',
        'FINANCE_JOURNAL_NOT_FOUND'
      );
    }

    const accountIds = [
      ...new Set(
        record.lines.map((line) => String(line.account_id))
      ),
    ];
    const accounts =
      await this.accountRepository.findByIds(accountIds);
    const journal_entry = mapDetail(
      record,
      toAccountMap(accounts)
    );

    return FinanceJournalDetailResponseSchema.parse({
      journal_entry,
    });
  }

  async ledger(
    input: FinanceJournalLedgerQueryDTO | unknown
  ): Promise<FinanceLedgerResponseDTO> {
    const query =
      FinanceJournalLedgerQuerySchema.parse(input);
    if (!Types.ObjectId.isValid(query.account_id)) {
      throw new FinanceDomainError(
        'Account Finance tidak ditemukan.',
        'FINANCE_ACCOUNT_NOT_FOUND'
      );
    }

    const accounts = await this.accountRepository.findByIds(
      [query.account_id]
    );
    const account = accounts[0];
    if (!account) {
      throw new FinanceDomainError(
        'Account Finance tidak ditemukan.',
        'FINANCE_ACCOUNT_NOT_FOUND'
      );
    }

    const result =
      await this.journalRepository.findLedgerLines(
        query.account_id,
        query.period,
        MAX_LEDGER_ROWS
      );
    let runningBalance = 0;
    const rows = result.rows.map((row) => {
      const movement =
        account.normal_balance === 'credit'
          ? row.lines.credit - row.lines.debit
          : row.lines.debit - row.lines.credit;
      runningBalance += movement;
      return mapLedgerRow(row, account, runningBalance);
    });
    const availableTotal = Math.min(
      result.total,
      rows.length
    );
    const offset = (query.page - 1) * query.limit;

    return FinanceLedgerResponseSchema.parse({
      account: {
        id: String(account._id),
        code: account.code,
        name: account.name,
        normal_balance: account.normal_balance,
      },
      rows: rows.slice(offset, offset + query.limit),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: availableTotal,
        total_pages: Math.ceil(
          availableTotal / query.limit
        ),
        truncated: result.total > rows.length,
      },
    });
  }
}
