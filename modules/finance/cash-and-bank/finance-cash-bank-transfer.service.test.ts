import { Types } from 'mongoose';
import type {
  FinanceAccountPersistenceRecord,
  FinanceAccountRepository,
} from '../accounts/finance-account.repository';
import { FinanceDomainError } from '../finance.error';
import type { FinanceJournalService } from '../journal/finance-journal.service';
import type {
  FinanceCashBankTransferRepository,
  FinanceCashBankTransferPersistenceRecord,
} from './finance-cash-bank-transfer.repository';
import { FinanceCashBankTransferService } from './finance-cash-bank-transfer.service';

const organizationId = '507f1f77bcf86cd799439010';
const sourceId = new Types.ObjectId();
const destinationId = new Types.ObjectId();
const transferId = new Types.ObjectId();
const journalId = new Types.ObjectId();
const reversalJournalId = new Types.ObjectId();

const makeAccount = (
  id: Types.ObjectId,
  code: string,
  name: string,
  subtype: string
): FinanceAccountPersistenceRecord => ({
  _id: id,
  organization: new Types.ObjectId(organizationId),
  code,
  name,
  type: 'asset',
  subtype,
  parent_account: null,
  normal_balance: 'debit',
  is_system: false,
  is_postable: true,
  is_active: true,
  display_order: 1,
});

const sourceAccount = makeAccount(
  sourceId,
  '1120',
  'Bank Operasional',
  'bank'
);
const destinationAccount = makeAccount(
  destinationId,
  '1110',
  'Kas Toko',
  'cash'
);

const makeDependencies = () => {
  let current: FinanceCashBankTransferPersistenceRecord | null =
    null;
  const journalService: Pick<
    FinanceJournalService,
    'postOperational' | 'reverse'
  > = {
    postOperational: jest.fn(async () => ({
      journal_entry: {
        id: String(journalId),
        entry_number: 'FIN-TRANSFER-1',
        transaction_date: '2026-09-22T00:00:00.000Z',
        posting_date: '2026-09-22T00:00:00.000Z',
        period: '2026-09',
        currency: 'IDR',
        description:
          'Transfer Bank Operasional ke Kas Toko',
        source_type: 'cash_bank_transfer',
        source_id: String(transferId),
        source_event: 'cash_bank_transfer_posted',
        idempotency_key:
          'finance-cash-bank-transfer-journal:key-1',
        status: 'posted' as const,
        posted_at: '2026-09-22T00:00:00.000Z',
        posted_by: null,
        reversal_of: null,
        lines: [],
      },
      replayed: false,
    })),
    reverse: jest.fn(async () => ({
      journal_entry: {
        id: String(reversalJournalId),
        entry_number: 'FIN-TRANSFER-REVERSAL-1',
        transaction_date: '2026-09-22T00:00:00.000Z',
        posting_date: '2026-09-22T00:00:00.000Z',
        period: '2026-09',
        currency: 'IDR',
        description: 'Reversal transfer',
        source_type: 'journal_reversal',
        source_id: String(journalId),
        source_event: 'journal_reversed',
        idempotency_key: 'finance-journal-reversal:key-1',
        status: 'posted' as const,
        posted_at: '2026-09-22T00:00:00.000Z',
        posted_by: null,
        reversal_of: String(journalId),
        lines: [],
      },
      replayed: false,
    })),
  };
  const transferRepository: Pick<
    FinanceCashBankTransferRepository,
    | 'findByIdempotencyKey'
    | 'findByTransferId'
    | 'createPending'
    | 'markPosted'
    | 'markReversedByJournalEntry'
  > = {
    findByIdempotencyKey: async () => current,
    findByTransferId: async () => current,
    createPending: async (data) => {
      current = {
        ...data,
        _id: transferId,
        organization: new Types.ObjectId(organizationId),
      };
      return current;
    },
    markReversedByJournalEntry: async (
      _originalJournalEntryId,
      reversalEntryId
    ) => {
      if (!current) return null;
      current = {
        ...current,
        status: 'reversed',
        reversal_journal_entry: new Types.ObjectId(
          reversalEntryId
        ),
      };
      return current;
    },
    markPosted: async (_id, journalEntryId) => {
      if (!current) return null;
      current = {
        ...current,
        status: 'posted',
        journal_entry: new Types.ObjectId(journalEntryId),
      };
      return current;
    },
  };
  const accountRepository: Pick<
    FinanceAccountRepository,
    'findSelectableById'
  > = {
    findSelectableById: async (id) =>
      id === String(sourceId)
        ? sourceAccount
        : destinationAccount,
  };

  return {
    accountRepository,
    journalService,
    transferRepository,
    getCurrent: () => current,
  };
};

const input = {
  source_account_id: String(sourceId),
  destination_account_id: String(destinationId),
  amount: 500000,
  transaction_date: '2026-09-22T00:00:00.000Z',
  reference: 'SETOR-001',
  idempotency_key: 'key-1',
};

describe('FinanceCashBankTransferService', () => {
  it('posts a balanced transfer journal and stores the source transaction', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceCashBankTransferService(
      { organizationId },
      dependencies
    );

    const result = await service.post(input);

    expect(result).toMatchObject({
      amount: 500000,
      status: 'posted',
      journal_entry_id: String(journalId),
      replayed: false,
    });
    expect(dependencies.getCurrent()?.status).toBe(
      'posted'
    );
    expect(
      dependencies.journalService.postOperational
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        source_type: 'cash_bank_transfer',
        lines: [
          expect.objectContaining({
            account_id: String(destinationId),
            debit: 500000,
            credit: 0,
          }),
          expect.objectContaining({
            account_id: String(sourceId),
            debit: 0,
            credit: 500000,
          }),
        ],
      }),
      undefined
    );
  });

  it('replays the same transfer without posting a duplicate journal', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceCashBankTransferService(
      { organizationId },
      dependencies
    );

    await service.post(input);
    const replay = await service.post(input);

    expect(replay.replayed).toBe(true);
    expect(
      dependencies.journalService.postOperational
    ).toHaveBeenCalledTimes(1);
  });

  it('rejects a reused idempotency key with different transfer data', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceCashBankTransferService(
      { organizationId },
      dependencies
    );

    await service.post(input);

    await expect(
      service.post({ ...input, amount: 600000 })
    ).rejects.toMatchObject<Partial<FinanceDomainError>>({
      code: 'FINANCE_CASH_BANK_TRANSFER_IDEMPOTENCY_CONFLICT',
    });
  });

  it('rejects an account outside the cash and bank categories', async () => {
    const dependencies = makeDependencies();
    dependencies.accountRepository.findSelectableById =
      async (id) =>
        id === String(sourceId)
          ? makeAccount(
              sourceId,
              '1210',
              'Piutang Marketplace',
              'marketplace_receivable'
            )
          : destinationAccount;
    const service = new FinanceCashBankTransferService(
      { organizationId },
      dependencies
    );

    await expect(service.post(input)).rejects.toMatchObject(
      {
        code: 'FINANCE_CASH_BANK_TRANSFER_ACCOUNT_INVALID',
      }
    );
  });

  it('reverses a posted transfer with a new journal and preserves the source journal', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceCashBankTransferService(
      { organizationId },
      dependencies
    );

    await service.post(input);
    const result = await service.reverse(
      String(transferId),
      {
        description: 'Koreksi transfer',
        idempotency_key: 'reverse-key-1',
      }
    );

    expect(result).toMatchObject({
      status: 'reversed',
      journal_entry_id: String(journalId),
      reversal_journal_entry_id: String(reversalJournalId),
      replayed: false,
    });
    expect(
      dependencies.journalService.reverse
    ).toHaveBeenCalledWith(
      String(journalId),
      expect.objectContaining({
        description: 'Koreksi transfer',
      }),
      undefined
    );
  });
});
