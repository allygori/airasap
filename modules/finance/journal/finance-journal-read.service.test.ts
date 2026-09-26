import { Types } from 'mongoose';
import type { FinanceAccountPersistenceRecord } from '../accounts/finance-account.repository';
import {
  type FinanceJournalPersistenceRecord,
  type FinanceLedgerPersistenceRow,
} from './finance-journal.repository';
import { FinanceJournalReadService } from './finance-journal-read.service';

const organizationId = '507f1f77bcf86cd799439010';
const journalId = '507f1f77bcf86cd799439099';
const debitAccountId = '507f1f77bcf86cd799439011';
const creditAccountId = '507f1f77bcf86cd799439012';

const makeAccount = (
  id: string,
  code: string,
  normalBalance: 'debit' | 'credit' = 'debit'
): FinanceAccountPersistenceRecord => ({
  _id: new Types.ObjectId(id),
  organization: new Types.ObjectId(organizationId),
  code,
  name: `Account ${code}`,
  type: 'asset',
  normal_balance: normalBalance,
  is_system: false,
  is_postable: true,
  is_active: true,
  display_order: 1,
});

const makeJournal =
  (): FinanceJournalPersistenceRecord => ({
    _id: new Types.ObjectId(journalId),
    organization: new Types.ObjectId(organizationId),
    entry_number: 'JV-20260922-0001',
    transaction_date: new Date('2026-09-22T00:00:00.000Z'),
    posting_date: new Date('2026-09-22T00:00:00.000Z'),
    period: '2026-09',
    currency: 'IDR',
    description: 'Penjualan marketplace',
    source_type: 'order',
    source_id: 'order-123',
    source_event: 'completed',
    idempotency_key: 'order:order-123:completed',
    idempotency_hash: 'hash',
    status: 'posted',
    posted_at: new Date('2026-09-22T00:00:00.000Z'),
    lines: [
      {
        account_id: new Types.ObjectId(debitAccountId),
        debit: 10000,
        credit: 0,
      },
      {
        account_id: new Types.ObjectId(creditAccountId),
        debit: 0,
        credit: 10000,
      },
    ],
  });

describe('FinanceJournalReadService', () => {
  it('lists journal summaries with pagination metadata', async () => {
    const repository = {
      list: jest.fn(async () => ({
        records: [makeJournal()],
        total: 3,
      })),
      findEntryById: jest.fn(),
      findLedgerLines: jest.fn(),
    };
    const service = new FinanceJournalReadService(
      { organizationId },
      {
        journalRepository: repository,
        accountRepository: { findByIds: jest.fn() },
      }
    );

    const result = await service.list({
      page: 2,
      limit: 2,
      period: '2026-09',
    });

    expect(result.entries[0]).toMatchObject({
      id: journalId,
      entry_number: 'JV-20260922-0001',
      total_debit: 10000,
      total_credit: 10000,
      line_count: 2,
    });
    expect(result.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 3,
      total_pages: 2,
    });
    expect(repository.list).toHaveBeenCalledWith({
      page: 2,
      limit: 2,
      period: '2026-09',
    });
  });

  it('joins account metadata for journal detail', async () => {
    const journal = makeJournal();
    const repository = {
      list: jest.fn(),
      findEntryById: jest.fn(async () => journal),
      findLedgerLines: jest.fn(),
    };
    const accountRepository = {
      findByIds: jest.fn(async () => [
        makeAccount(debitAccountId, '1100'),
        makeAccount(creditAccountId, '4000', 'credit'),
      ]),
    };
    const service = new FinanceJournalReadService(
      { organizationId },
      { journalRepository: repository, accountRepository }
    );

    const result = await service.get(journalId);

    expect(result.journal_entry.lines).toEqual([
      expect.objectContaining({
        account_id: debitAccountId,
        account_code: '1100',
        normal_balance: 'debit',
      }),
      expect.objectContaining({
        account_id: creditAccountId,
        account_code: '4000',
        normal_balance: 'credit',
      }),
    ]);
    expect(
      accountRepository.findByIds
    ).toHaveBeenCalledWith([
      debitAccountId,
      creditAccountId,
    ]);
  });

  it('passes report drill-down account and cumulative period filters to the repository', async () => {
    const repository = {
      list: jest.fn(async () => ({
        records: [],
        total: 0,
      })),
      findEntryById: jest.fn(),
      findLedgerLines: jest.fn(),
    };
    const service = new FinanceJournalReadService(
      { organizationId },
      {
        journalRepository: repository,
        accountRepository: { findByIds: jest.fn() },
      }
    );

    await service.list({
      page: 1,
      limit: 25,
      period_to: '2026-09',
      account_id: debitAccountId,
      status: 'posted',
    });

    expect(repository.list).toHaveBeenCalledWith({
      page: 1,
      limit: 25,
      period_to: '2026-09',
      account_id: debitAccountId,
      status: 'posted',
    });
  });

  it('calculates a normal-balance running balance for ledger rows', async () => {
    const account = makeAccount(debitAccountId, '1100');
    const row: FinanceLedgerPersistenceRow = {
      _id: new Types.ObjectId(journalId),
      entry_number: 'JV-20260922-0001',
      transaction_date: new Date(
        '2026-09-22T00:00:00.000Z'
      ),
      posting_date: new Date('2026-09-22T00:00:00.000Z'),
      description: 'Penjualan marketplace',
      source_type: 'order',
      line_index: 0,
      lines: {
        account_id: new Types.ObjectId(debitAccountId),
        debit: 10000,
        credit: 0,
      },
    };
    const repository = {
      list: jest.fn(),
      findEntryById: jest.fn(),
      findLedgerLines: jest.fn(async () => ({
        rows: [row],
        total: 1,
      })),
    };
    const service = new FinanceJournalReadService(
      { organizationId },
      {
        journalRepository: repository,
        accountRepository: {
          findByIds: jest.fn(async () => [account]),
        },
      }
    );

    const result = await service.ledger({
      account_id: debitAccountId,
      page: 1,
      limit: 25,
    });

    expect(result.rows[0]).toMatchObject({
      account_code: '1100',
      debit: 10000,
      credit: 0,
      running_balance: 10000,
    });
    expect(result.pagination).toMatchObject({
      total: 1,
      total_pages: 1,
      truncated: false,
    });
  });
});
