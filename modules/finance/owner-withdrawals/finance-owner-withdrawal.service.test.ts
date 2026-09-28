import { Types } from 'mongoose';
import type { FinanceAccountPersistenceRecord } from '../accounts/finance-account.repository';
import type { FinanceJournalService } from '../journal/finance-journal.service';
import type {
  FinanceOwnerWithdrawalPersistenceRecord,
  FinanceOwnerWithdrawalRepository,
} from './finance-owner-withdrawal.repository';
import { FinanceOwnerWithdrawalService } from './finance-owner-withdrawal.service';

const organizationId = '507f1f77bcf86cd799439010';
const ownerAccountId = new Types.ObjectId();
const paymentAccountId = new Types.ObjectId();
const withdrawalId = new Types.ObjectId();
const journalId = new Types.ObjectId();
const reversalJournalId = new Types.ObjectId();

const makeAccount = (
  id: Types.ObjectId,
  code: string,
  name: string,
  type: string,
  subtype: string
): FinanceAccountPersistenceRecord => ({
  _id: id,
  organization: new Types.ObjectId(organizationId),
  code,
  name,
  type,
  subtype,
  parent_account: null,
  normal_balance: type === 'equity' ? 'credit' : 'debit',
  is_system: false,
  is_postable: true,
  is_active: true,
  display_order: 1,
});

const ownerAccount = makeAccount(
  ownerAccountId,
  '3310',
  'Prive Pemilik',
  'equity',
  'owner_drawings'
);
const paymentAccount = makeAccount(
  paymentAccountId,
  '112001',
  'Bank Operasional',
  'asset',
  'bank'
);

const input = {
  owner_account_id: String(ownerAccountId),
  payment_account_id: String(paymentAccountId),
  amount: 250000,
  transaction_date: '2026-09-26T00:00:00.000Z',
  description: 'Penarikan pemilik',
  reference: 'WD-001',
  idempotency_key: 'owner-withdrawal-key-1',
};

const makeDependencies = () => {
  let current: FinanceOwnerWithdrawalPersistenceRecord | null =
    null;
  const journalService: Pick<
    FinanceJournalService,
    'postOperational' | 'reverse'
  > = {
    postOperational: jest.fn(async () => ({
      journal_entry: {
        id: String(journalId),
        entry_number: 'FIN-WITHDRAWAL-1',
        transaction_date: '2026-09-26T00:00:00.000Z',
        posting_date: '2026-09-26T00:00:00.000Z',
        period: '2026-09',
        currency: 'IDR',
        description: 'Penarikan pemilik',
        source_type: 'owner_withdrawal',
        source_id: String(withdrawalId),
        source_event: 'owner_withdrawal_posted',
        idempotency_key: `finance-owner-withdrawal-journal:${String(withdrawalId)}`,
        status: 'posted' as const,
        posted_at: '2026-09-26T00:00:00.000Z',
        posted_by: null,
        reversal_of: null,
        lines: [],
      },
      replayed: false,
    })),
    reverse: jest.fn(async () => ({
      journal_entry: {
        id: String(reversalJournalId),
        entry_number: 'FIN-WITHDRAWAL-REVERSAL-1',
        transaction_date: '2026-09-27T00:00:00.000Z',
        posting_date: '2026-09-27T00:00:00.000Z',
        period: '2026-09',
        currency: 'IDR',
        description:
          'Reversal penarikan pemilik: Koreksi nominal',
        source_type: 'journal_reversal',
        source_id: String(journalId),
        source_event: 'reversal',
        idempotency_key: `finance-owner-withdrawal-reversal:${String(withdrawalId)}`,
        status: 'posted' as const,
        posted_at: '2026-09-27T00:00:00.000Z',
        posted_by: null,
        reversal_of: String(journalId),
        lines: [],
      },
      replayed: false,
    })),
  };
  const withdrawalRepository: Pick<
    FinanceOwnerWithdrawalRepository,
    | 'findByIdempotencyKey'
    | 'findWithdrawalById'
    | 'findByJournalEntry'
    | 'createDraft'
    | 'markPosted'
    | 'markReversedByJournalEntry'
  > = {
    findByIdempotencyKey: async () => current,
    findWithdrawalById: async () => current,
    findByJournalEntry: async (id) =>
      current?.journal_entry &&
      String(current.journal_entry) === id
        ? current
        : null,
    createDraft: async (data) => {
      current = {
        ...data,
        _id: withdrawalId,
        organization: new Types.ObjectId(organizationId),
      };
      return current;
    },
    markReversedByJournalEntry: async (
      originalId,
      reversalId
    ) => {
      if (
        !current ||
        String(current.journal_entry ?? '') !==
          originalId ||
        current.status !== 'posted'
      ) {
        return null;
      }
      current = {
        ...current,
        status: 'reversed',
        reversal_journal_entry: new Types.ObjectId(
          reversalId
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
  const accountRepository = {
    findSelectableById: async (id: string) => {
      if (id === String(ownerAccountId))
        return ownerAccount;
      if (id === String(paymentAccountId))
        return paymentAccount;
      return null;
    },
  };

  return {
    accountRepository,
    journalService,
    withdrawalRepository,
    getCurrent: () => current,
  };
};

describe('FinanceOwnerWithdrawalService', () => {
  it('saves a draft without a journal, then posts debit drawings and credit cash/bank', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceOwnerWithdrawalService(
      { organizationId },
      dependencies
    );

    const draft = await service.createDraft(input);

    expect(draft).toMatchObject({
      status: 'draft',
      amount: 250000,
      journal_entry_id: null,
    });
    expect(
      dependencies.journalService.postOperational
    ).not.toHaveBeenCalled();

    const posted = await service.post(draft.withdrawal_id);

    expect(posted).toMatchObject({
      status: 'posted',
      journal_entry_id: String(journalId),
    });
    expect(
      dependencies.journalService.postOperational
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        source_type: 'owner_withdrawal',
        source_id: draft.withdrawal_id,
        lines: [
          expect.objectContaining({
            account_id: String(ownerAccountId),
            debit: 250000,
            credit: 0,
          }),
          expect.objectContaining({
            account_id: String(paymentAccountId),
            debit: 0,
            credit: 250000,
          }),
        ],
      }),
      undefined
    );
  });

  it('replays the same draft request without creating a duplicate', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceOwnerWithdrawalService(
      { organizationId },
      dependencies
    );

    await service.createDraft(input);
    const replay = await service.createDraft(input);

    expect(replay.replayed).toBe(true);
    expect(dependencies.getCurrent()).not.toBeNull();
  });

  it('rejects using an expense or liability account as the owner drawings account', async () => {
    const dependencies = makeDependencies();
    dependencies.accountRepository.findSelectableById =
      async (id: string) =>
        id === String(ownerAccountId)
          ? makeAccount(
              ownerAccountId,
              '6100',
              'Beban Operasional',
              'expense',
              'operating_expense'
            )
          : paymentAccount;
    const service = new FinanceOwnerWithdrawalService(
      { organizationId },
      dependencies
    );

    await expect(
      service.createDraft(input)
    ).rejects.toMatchObject({
      code: 'FINANCE_OWNER_WITHDRAWAL_OWNER_ACCOUNT_INVALID',
    });
  });

  it('rejects a non-cash/bank account as the payment source', async () => {
    const dependencies = makeDependencies();
    dependencies.accountRepository.findSelectableById =
      async (id: string) =>
        id === String(ownerAccountId)
          ? ownerAccount
          : makeAccount(
              paymentAccountId,
              '1300',
              'Piutang Usaha',
              'asset',
              'accounts_receivable'
            );
    const service = new FinanceOwnerWithdrawalService(
      { organizationId },
      dependencies
    );

    await expect(
      service.createDraft(input)
    ).rejects.toMatchObject({
      code: 'FINANCE_OWNER_WITHDRAWAL_PAYMENT_ACCOUNT_INVALID',
    });
  });

  it('does not post the journal twice for an already-posted withdrawal', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceOwnerWithdrawalService(
      { organizationId },
      dependencies
    );
    const draft = await service.createDraft(input);
    await service.post(draft.withdrawal_id);

    const replay = await service.post(draft.withdrawal_id);

    expect(replay.replayed).toBe(true);
    expect(
      dependencies.journalService.postOperational
    ).toHaveBeenCalledTimes(1);
  });

  it('can retry source finalization with the same journal idempotency key', async () => {
    const dependencies = makeDependencies();
    const markPosted =
      dependencies.withdrawalRepository.markPosted;
    let finalizationAttempts = 0;
    dependencies.withdrawalRepository.markPosted = async (
      ...args
    ) => {
      finalizationAttempts += 1;
      if (finalizationAttempts === 1) return null;
      return markPosted(...args);
    };
    const service = new FinanceOwnerWithdrawalService(
      { organizationId },
      dependencies
    );
    const draft = await service.createDraft(input);

    await expect(
      service.post(draft.withdrawal_id)
    ).rejects.toMatchObject({
      code: 'FINANCE_OWNER_WITHDRAWAL_FINALIZATION_FAILED',
    });
    const recovered = await service.post(
      draft.withdrawal_id
    );

    expect(recovered.status).toBe('posted');
    expect(
      dependencies.journalService.postOperational
    ).toHaveBeenCalledTimes(2);
    expect(
      dependencies.journalService.postOperational
    ).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        idempotency_key: `finance-owner-withdrawal-journal:${draft.withdrawal_id}`,
      }),
      undefined
    );
    expect(
      dependencies.journalService.postOperational
    ).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        idempotency_key: `finance-owner-withdrawal-journal:${draft.withdrawal_id}`,
      }),
      undefined
    );
  });

  it('reverses a posted withdrawal with a separate journal and links both records', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceOwnerWithdrawalService(
      { organizationId },
      dependencies
    );
    const draft = await service.createDraft(input);
    await service.post(draft.withdrawal_id);

    const reversed = await service.reverse(
      draft.withdrawal_id,
      {
        effective_date: '2026-09-27T00:00:00.000Z',
        reason: 'Koreksi nominal',
      }
    );

    expect(reversed).toMatchObject({
      status: 'reversed',
      journal_entry_id: String(journalId),
      reversal_journal_entry_id: String(reversalJournalId),
    });
    expect(
      dependencies.journalService.reverse
    ).toHaveBeenCalledWith(
      String(journalId),
      expect.objectContaining({
        effective_date: new Date(
          '2026-09-27T00:00:00.000Z'
        ),
        description:
          'Reversal penarikan pemilik: Koreksi nominal',
        idempotency_key: `finance-owner-withdrawal-reversal:${draft.withdrawal_id}`,
      }),
      undefined
    );
    await expect(
      service.post(draft.withdrawal_id)
    ).rejects.toMatchObject({
      code: 'FINANCE_OWNER_WITHDRAWAL_NOT_REVERSIBLE',
    });

    const replay = await service.reverse(
      draft.withdrawal_id,
      {
        effective_date: '2026-09-27T00:00:00.000Z',
        reason: 'Koreksi nominal',
      }
    );
    expect(replay.replayed).toBe(true);
    expect(
      dependencies.journalService.reverse
    ).toHaveBeenCalledTimes(1);
  });

  it('recovers source linkage after reversal journal creation succeeds first', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceOwnerWithdrawalService(
      { organizationId },
      dependencies
    );
    const draft = await service.createDraft(input);
    await service.post(draft.withdrawal_id);
    const markReversed =
      dependencies.withdrawalRepository
        .markReversedByJournalEntry;
    let attempts = 0;
    dependencies.withdrawalRepository.markReversedByJournalEntry =
      async (...args) => {
        attempts += 1;
        if (attempts === 1) return null;
        return markReversed(...args);
      };

    await expect(
      service.reverse(draft.withdrawal_id, {
        effective_date: '2026-09-27T00:00:00.000Z',
        reason: 'Koreksi nominal',
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_OWNER_WITHDRAWAL_REVERSAL_FINALIZATION_FAILED',
    });
    const recovered = await service.reverse(
      draft.withdrawal_id,
      {
        effective_date: '2026-09-27T00:00:00.000Z',
        reason: 'Koreksi nominal',
      }
    );

    expect(recovered.status).toBe('reversed');
    expect(recovered.reversal_journal_entry_id).toBe(
      String(reversalJournalId)
    );
    expect(
      dependencies.journalService.reverse
    ).toHaveBeenCalledTimes(2);
    expect(
      dependencies.journalService.reverse
    ).toHaveBeenNthCalledWith(
      1,
      String(journalId),
      expect.objectContaining({
        idempotency_key: `finance-owner-withdrawal-reversal:${draft.withdrawal_id}`,
      }),
      undefined
    );
    expect(
      dependencies.journalService.reverse
    ).toHaveBeenNthCalledWith(
      2,
      String(journalId),
      expect.objectContaining({
        idempotency_key: `finance-owner-withdrawal-reversal:${draft.withdrawal_id}`,
      }),
      undefined
    );
  });
});
