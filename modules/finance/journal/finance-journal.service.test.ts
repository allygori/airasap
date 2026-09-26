import { Types } from 'mongoose';
import { FinanceJournalService } from './finance-journal.service';
import type {
  CreateFinanceJournalRecord,
  FinanceJournalPersistenceRecord,
} from './finance-journal.repository';
import type { FinanceAccountPersistenceRecord } from '../accounts/finance-account.repository';
import { getFinancePeriodKey } from '../calendar/finance-calendar';

const organizationId = '507f1f77bcf86cd799439010';
const accountOneId = '507f1f77bcf86cd799439011';
const accountTwoId = '507f1f77bcf86cd799439012';

const postingInput = {
  transaction_date: '2026-09-22T00:00:00.000Z',
  description: 'Penjualan marketplace',
  source_type: 'order',
  source_id: 'order-123',
  source_event: 'completed',
  idempotency_key: 'order:order-123:completed',
  lines: [
    {
      account_id: accountOneId,
      debit: 10000,
      credit: 0,
    },
    {
      account_id: accountTwoId,
      debit: 0,
      credit: 10000,
    },
  ],
};

const makeAccount = (
  id: string,
  code: string
): FinanceAccountPersistenceRecord => ({
  _id: new Types.ObjectId(id),
  organization: new Types.ObjectId(organizationId),
  code,
  name: `Account ${code}`,
  type: 'asset',
  normal_balance: 'debit',
  is_system: false,
  is_postable: true,
  is_active: true,
  display_order: 1,
});

describe('FinanceJournalService', () => {
  it('replays the same posted entry for an identical idempotency key', async () => {
    let created: FinanceJournalPersistenceRecord | null =
      null;
    const accounts = [
      makeAccount(accountOneId, '1100'),
      makeAccount(accountTwoId, '4000'),
    ];
    const findByIdempotencyKey = jest.fn(
      async () => created
    );
    const createPosted = jest.fn(
      async (
        record: CreateFinanceJournalRecord
      ): Promise<FinanceJournalPersistenceRecord> => {
        created = {
          ...record,
          _id: new Types.ObjectId(
            '507f1f77bcf86cd799439099'
          ),
          organization: new Types.ObjectId(organizationId),
        };
        return created;
      }
    );
    const service = new FinanceJournalService(
      { organizationId },
      {
        journalRepository: {
          findByIdempotencyKey,
          createPosted,
          findEntryById: jest.fn(async () => null),
          findByReversalOf: jest.fn(async () => null),
          markReversed: jest.fn(async () => null),
        },
        accountRepository: {
          findSelectableByIds: jest.fn(
            async () => accounts
          ),
        },
        periodService: {
          getPeriodKey: jest.fn(async (date: Date) =>
            getFinancePeriodKey(date, 'Asia/Jakarta')
          ),
          ensureOpen: jest.fn(async () => null),
        },
      }
    );

    const first =
      await service.postOperational(postingInput);
    const replay =
      await service.postOperational(postingInput);

    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.journal_entry.id).toBe(
      first.journal_entry.id
    );
    expect(createPosted).toHaveBeenCalledTimes(1);
  });

  it('rejects reuse of an idempotency key with a different payload', async () => {
    let created: FinanceJournalPersistenceRecord | null =
      null;
    const recordFactory = jest.fn(
      async (
        record: CreateFinanceJournalRecord
      ): Promise<FinanceJournalPersistenceRecord> => {
        created = {
          ...record,
          _id: new Types.ObjectId(
            '507f1f77bcf86cd799439099'
          ),
          organization: new Types.ObjectId(organizationId),
        };
        return created;
      }
    );
    const service = new FinanceJournalService(
      { organizationId },
      {
        journalRepository: {
          findByIdempotencyKey: jest.fn(
            async () => created
          ),
          createPosted: recordFactory,
          findEntryById: jest.fn(async () => null),
          findByReversalOf: jest.fn(async () => null),
          markReversed: jest.fn(async () => null),
        },
        accountRepository: {
          findSelectableByIds: jest.fn(async () => [
            makeAccount(accountOneId, '1100'),
            makeAccount(accountTwoId, '4000'),
          ]),
        },
        periodService: {
          getPeriodKey: jest.fn(async (date: Date) =>
            getFinancePeriodKey(date, 'Asia/Jakarta')
          ),
          ensureOpen: jest.fn(async () => null),
        },
      }
    );

    await service.postOperational(postingInput);

    await expect(
      service.postOperational({
        ...postingInput,
        description: 'Payload berbeda',
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_JOURNAL_IDEMPOTENCY_CONFLICT',
    });
  });

  it('rejects accounts that are not active and postable', async () => {
    const service = new FinanceJournalService(
      { organizationId },
      {
        journalRepository: {
          findByIdempotencyKey: jest.fn(async () => null),
          createPosted: jest.fn(),
          findEntryById: jest.fn(async () => null),
          findByReversalOf: jest.fn(async () => null),
          markReversed: jest.fn(async () => null),
        },
        accountRepository: {
          findSelectableByIds: jest.fn(async () => []),
        },
        periodService: {
          getPeriodKey: jest.fn(async (date: Date) =>
            getFinancePeriodKey(date, 'Asia/Jakarta')
          ),
          ensureOpen: jest.fn(async () => null),
        },
      }
    );

    await expect(
      service.postOperational(postingInput)
    ).rejects.toMatchObject({
      code: 'FINANCE_JOURNAL_ACCOUNT_NOT_SELECTABLE',
    });
  });
});
