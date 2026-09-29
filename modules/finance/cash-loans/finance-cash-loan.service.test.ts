import { Types } from 'mongoose';
import type { FinanceAccountPersistenceRecord } from '../accounts/finance-account.repository';
import type { FinanceAccountService } from '../accounts/finance-account.service';
import type { FinanceJournalService } from '../journal/finance-journal.service';
import type { FinanceOperationalPostingDTO } from '../journal/finance-journal.dto';
import type {
  FinanceCashLoanBalanceRecord,
  FinanceCashLoanPersistenceRecord,
  FinanceCashLoanRepository,
} from './finance-cash-loan.repository';
import { FinanceCashLoanService } from './finance-cash-loan.service';

const organizationId = '507f1f77bcf86cd799439010';
const ownerAccountId = new Types.ObjectId();
const paymentAccountId = new Types.ObjectId();
const ownerLiabilityId = new Types.ObjectId();
const externalLiabilityId = new Types.ObjectId();
const journalId = new Types.ObjectId();
const reversalJournalId = new Types.ObjectId();
const firstLoanId = new Types.ObjectId();

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
  normal_balance: type === 'asset' ? 'debit' : 'credit',
  is_system: false,
  is_postable: true,
  is_active: true,
  display_order: 1,
});

const ownerAccount = makeAccount(
  ownerAccountId,
  '3110',
  'Modal Pemilik 1',
  'equity',
  'owner_capital'
);
const paymentAccount = makeAccount(
  paymentAccountId,
  '112001',
  'Bank Operasional',
  'asset',
  'bank'
);
const ownerLiabilityAccount = makeAccount(
  ownerLiabilityId,
  '2500',
  'Utang kepada Pemilik',
  'liability',
  'owner_loan_payable'
);
const externalLiabilityAccount = makeAccount(
  externalLiabilityId,
  '2600',
  'Utang Pinjaman Tunai',
  'liability',
  'cash_loan_payable'
);

const externalReceiptInput = {
  event_type: 'received' as const,
  lender_type: 'bank' as const,
  lender_name: 'Bank Contoh',
  payment_account_id: String(paymentAccountId),
  amount: 1_000_000,
  transaction_date: '2026-09-26T00:00:00.000Z',
  description: 'Pinjaman modal kerja',
  reference: 'LOAN-01',
  idempotency_key: 'cash-loan-receipt-1',
};

function makeDependencies() {
  const records: FinanceCashLoanPersistenceRecord[] = [];
  const journalService: Pick<
    FinanceJournalService,
    'postOperational' | 'reverse'
  > = {
    postOperational: jest.fn(
      async (posting: FinanceOperationalPostingDTO) => ({
        journal_entry: {
          id: String(journalId),
          entry_number: 'FIN-CASH-LOAN-1',
          transaction_date: '2026-09-26T00:00:00.000Z',
          posting_date: '2026-09-26T00:00:00.000Z',
          period: '2026-09',
          currency: 'IDR',
          description: posting.description,
          source_type: 'cash_loan',
          source_id: String(firstLoanId),
          source_event: posting.source_event,
          idempotency_key: posting.idempotency_key,
          status: 'posted' as const,
          posted_at: '2026-09-26T00:00:00.000Z',
          posted_by: null,
          reversal_of: null,
          lines: [],
        },
        replayed: false,
      })
    ),
    reverse: jest.fn(async () => ({
      journal_entry: {
        id: String(reversalJournalId),
        entry_number: 'FIN-CASH-LOAN-REVERSAL-1',
        transaction_date: '2026-09-27T00:00:00.000Z',
        posting_date: '2026-09-27T00:00:00.000Z',
        period: '2026-09',
        currency: 'IDR',
        description: 'Reversal pinjaman tunai',
        source_type: 'journal_reversal',
        source_id: String(journalId),
        source_event: 'reversal',
        idempotency_key: `finance-cash-loan-reversal:${String(firstLoanId)}`,
        status: 'posted' as const,
        posted_at: '2026-09-27T00:00:00.000Z',
        posted_by: null,
        reversal_of: String(journalId),
        lines: [],
      },
      replayed: false,
    })),
  };

  const getBalances =
    (): FinanceCashLoanBalanceRecord[] => {
      const groups = new Map<
        string,
        FinanceCashLoanBalanceRecord
      >();
      for (const record of records.filter(
        (item) => item.status === 'posted'
      )) {
        const balance = groups.get(record.lender_key) ?? {
          _id: record.lender_key,
          lender_type: record.lender_type,
          lender_name: record.lender_name,
          owner_account: record.owner_account,
          owner_account_code: record.owner_account_code,
          owner_account_name: record.owner_account_name,
          liability_account_code:
            record.liability_account_code,
          liability_account_name:
            record.liability_account_name,
          received_total: 0,
          repayment_total: 0,
        };
        if (record.event_type === 'received') {
          balance.received_total += record.amount;
        } else {
          balance.repayment_total += record.amount;
        }
        groups.set(record.lender_key, balance);
      }
      return [...groups.values()];
    };

  const repository: Pick<
    FinanceCashLoanRepository,
    | 'findByIdempotencyKey'
    | 'findLoanById'
    | 'findByJournalEntry'
    | 'getPostedBalancesByLender'
    | 'createDraft'
    | 'markPosted'
    | 'markReversedByJournalEntry'
  > = {
    findByIdempotencyKey: async (key) =>
      records.find(
        (record) => record.idempotency_key === key
      ) ?? null,
    findLoanById: async (id) =>
      records.find((record) => String(record._id) === id) ??
      null,
    findByJournalEntry: async (id) =>
      records.find(
        (record) =>
          String(record.journal_entry ?? '') === id
      ) ?? null,
    getPostedBalancesByLender: async () => getBalances(),
    createDraft: async (data) => {
      const record: FinanceCashLoanPersistenceRecord = {
        ...data,
        _id:
          records.length === 0
            ? firstLoanId
            : new Types.ObjectId(),
        organization: new Types.ObjectId(organizationId),
      };
      records.push(record);
      return record;
    },
    markPosted: async (id, entryId) => {
      const record = records.find(
        (item) => String(item._id) === id
      );
      if (!record) return null;
      record.status = 'posted';
      record.journal_entry = new Types.ObjectId(entryId);
      return record;
    },
    markReversedByJournalEntry: async (
      entryId,
      reversalId
    ) => {
      const record = records.find(
        (item) =>
          String(item.journal_entry ?? '') === entryId
      );
      if (!record) return null;
      record.status = 'reversed';
      record.reversal_journal_entry = new Types.ObjectId(
        reversalId
      );
      return record;
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
    findByCode: async (code: string) =>
      code === '2500'
        ? ownerLiabilityAccount
        : code === '2600'
          ? externalLiabilityAccount
          : null,
  };
  const accountSetupService: Pick<
    FinanceAccountService,
    'ensureDefaultAccountByCode'
  > = {
    ensureDefaultAccountByCode: jest.fn(
      async () => undefined
    ),
  };

  return {
    accountRepository,
    accountSetupService,
    journalService,
    loanRepository: repository,
    records,
  };
}

describe('FinanceCashLoanService', () => {
  it('posts external loan proceeds to the generic loan liability', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceCashLoanService(
      { organizationId },
      dependencies
    );
    const draft = await service.createDraft(
      externalReceiptInput
    );
    const posted = await service.post(draft.loan_id);

    expect(posted).toMatchObject({
      status: 'posted',
      lender: { type: 'bank', name: 'Bank Contoh' },
      liability_account: { code: '2600' },
      amount: 1_000_000,
    });
    expect(
      dependencies.journalService.postOperational
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        source_type: 'cash_loan',
        source_event: 'loan_received',
        lines: [
          expect.objectContaining({
            account_id: String(paymentAccountId),
            debit: 1_000_000,
            credit: 0,
          }),
          expect.objectContaining({
            account_id: String(externalLiabilityId),
            debit: 0,
            credit: 1_000_000,
          }),
        ],
      }),
      undefined
    );
  });

  it('posts an owner loan to the separate owner-loan liability', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceCashLoanService(
      { organizationId },
      dependencies
    );
    const draft = await service.createDraft({
      ...externalReceiptInput,
      lender_type: 'owner',
      owner_account_id: String(ownerAccountId),
      lender_name: undefined,
      idempotency_key: 'owner-loan-receipt',
    });
    const posted = await service.post(draft.loan_id);
    const posting = (
      dependencies.journalService
        .postOperational as jest.Mock
    ).mock.calls[0][0];

    expect(posted.liability_account.code).toBe('2500');
    expect(posting.lines[1]).toMatchObject({
      account_id: String(ownerLiabilityId),
      credit: 1_000_000,
    });
  });

  it('records principal repayment and blocks amounts above the lender balance', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceCashLoanService(
      { organizationId },
      dependencies
    );
    const receipt = await service.createDraft(
      externalReceiptInput
    );
    await service.post(receipt.loan_id);

    await expect(
      service.createDraft({
        ...externalReceiptInput,
        event_type: 'repayment',
        lender_type: undefined,
        lender_name: undefined,
        lender_key: receipt.lender.key,
        amount: 1_000_001,
        idempotency_key: 'cash-loan-repayment-too-large',
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_CASH_LOAN_REPAYMENT_EXCEEDS_BALANCE',
    });

    const repayment = await service.createDraft({
      ...externalReceiptInput,
      event_type: 'repayment',
      lender_type: undefined,
      lender_name: undefined,
      lender_key: receipt.lender.key,
      amount: 400_000,
      idempotency_key: 'cash-loan-repayment-1',
    });
    await service.post(repayment.loan_id);
    const posting = (
      dependencies.journalService
        .postOperational as jest.Mock
    ).mock.calls[1][0];

    expect(posting).toMatchObject({
      source_event: 'principal_repaid',
      lines: [
        expect.objectContaining({
          account_id: String(externalLiabilityId),
          debit: 400_000,
          credit: 0,
        }),
        expect.objectContaining({
          account_id: String(paymentAccountId),
          debit: 0,
          credit: 400_000,
        }),
      ],
    });
  });

  it('requires a bank account for proceeds and allows only Cash/Bank for repayments', async () => {
    const dependencies = makeDependencies();
    dependencies.accountRepository.findSelectableById =
      async (id: string) =>
        id === String(ownerAccountId)
          ? ownerAccount
          : makeAccount(
              paymentAccountId,
              '1110',
              'Kas Operasional',
              'asset',
              'cash'
            );
    const service = new FinanceCashLoanService(
      { organizationId },
      dependencies
    );

    await expect(
      service.createDraft(externalReceiptInput)
    ).rejects.toMatchObject({
      code: 'FINANCE_CASH_LOAN_PAYMENT_ACCOUNT_INVALID',
    });
  });

  it('does not allow reversing a receipt after principal has been repaid', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceCashLoanService(
      { organizationId },
      dependencies
    );
    const receipt = await service.createDraft(
      externalReceiptInput
    );
    await service.post(receipt.loan_id);
    const repayment = await service.createDraft({
      ...externalReceiptInput,
      event_type: 'repayment',
      lender_type: undefined,
      lender_name: undefined,
      lender_key: receipt.lender.key,
      amount: 100_000,
      idempotency_key:
        'cash-loan-repayment-for-reversal-test',
    });
    await service.post(repayment.loan_id);

    await expect(
      service.reverse(receipt.loan_id, {
        effective_date: '2026-09-27T00:00:00.000Z',
        reason: 'Salah input',
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_CASH_LOAN_NOT_REVERSIBLE',
    });
    expect(
      dependencies.journalService.reverse
    ).not.toHaveBeenCalled();
  });

  it('replays a fully repaid request idempotently even when its remaining balance is zero', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceCashLoanService(
      { organizationId },
      dependencies
    );
    const receipt = await service.createDraft(
      externalReceiptInput
    );
    await service.post(receipt.loan_id);
    const repaymentInput = {
      ...externalReceiptInput,
      event_type: 'repayment' as const,
      lender_type: undefined,
      lender_name: undefined,
      lender_key: receipt.lender.key,
      amount: externalReceiptInput.amount,
      idempotency_key: 'full-repayment-once',
    };
    const repayment =
      await service.createDraft(repaymentInput);
    await service.post(repayment.loan_id);
    const replay =
      await service.createDraft(repaymentInput);

    expect(replay).toMatchObject({
      loan_id: repayment.loan_id,
      replayed: true,
      event_type: 'repayment',
    });
    expect(dependencies.records).toHaveLength(2);
  });
});
