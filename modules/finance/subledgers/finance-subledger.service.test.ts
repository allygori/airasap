import { Types } from 'mongoose';
import type { FinanceAccountPersistenceRecord } from '../accounts/finance-account.repository';
import type { FinanceJournalService } from '../journal/finance-journal.service';
import { FinanceDomainError } from '../finance.error';
import type {
  FinanceSettlementPersistenceRecord,
  FinanceSourceBalanceAggregate,
  FinanceSourceJournalPersistenceRecord,
  FinanceSubledgerRepository,
} from './finance-subledger.repository';
import { FinanceSubledgerService } from './finance-subledger.service';

const organizationId = '507f1f77bcf86cd799439010';
const receivableAccountId = new Types.ObjectId();
const payableAccountId = new Types.ObjectId();
const paymentAccountId = new Types.ObjectId();
const sourceJournalId = new Types.ObjectId();
const settlementId = new Types.ObjectId();
const journalId = new Types.ObjectId();

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
  normal_balance: type === 'liability' ? 'credit' : 'debit',
  is_system: false,
  is_postable: true,
  is_active: true,
  display_order: 1,
});

const receivableAccount = makeAccount(
  receivableAccountId,
  '1210',
  'Piutang Marketplace',
  'asset',
  'marketplace_receivable'
);
const payableAccount = makeAccount(
  payableAccountId,
  '2100',
  'Utang Usaha',
  'liability',
  'accounts_payable'
);
const paymentAccount = makeAccount(
  paymentAccountId,
  '1120',
  'Bank Operasional',
  'asset',
  'bank'
);

const makeJournalResult = () => ({
  journal_entry: {
    id: String(journalId),
    entry_number: 'FIN-SETTLEMENT-1',
    transaction_date: '2026-09-22T00:00:00.000Z',
    posting_date: '2026-09-22T00:00:00.000Z',
    period: '2026-09',
    currency: 'IDR',
    description: 'Settlement Finance',
    source_type: 'finance_settlement',
    source_id: String(settlementId),
    source_event: 'receivable_settlement_posted',
    idempotency_key: `finance-settlement-journal:${String(settlementId)}`,
    status: 'posted' as const,
    posted_at: '2026-09-22T00:00:00.000Z',
    posted_by: null,
    reversal_of: null,
    lines: [],
  },
  replayed: false,
});

const sourceJournal = (
  balanceType: 'receivable' | 'payable'
): FinanceSourceJournalPersistenceRecord => ({
  _id: sourceJournalId,
  source_type:
    balanceType === 'receivable' ? 'order' : 'purchase',
  source_id:
    balanceType === 'receivable'
      ? 'ORDER-001'
      : String(new Types.ObjectId()),
  description:
    balanceType === 'receivable'
      ? 'Penjualan Shopee ORDER-001'
      : 'Purchase Supplier A',
  transaction_date: new Date('2026-09-22T00:00:00.000Z'),
  currency: 'IDR',
  lines: [
    {
      account_id:
        balanceType === 'receivable'
          ? receivableAccountId
          : payableAccountId,
      debit: balanceType === 'receivable' ? 500000 : 0,
      credit: balanceType === 'receivable' ? 0 : 500000,
    },
  ],
});

const makeDependencies = () => {
  let current: FinanceSettlementPersistenceRecord | null =
    null;
  const journalService: Pick<
    FinanceJournalService,
    'postOperational'
  > = {
    postOperational: jest.fn(async () =>
      makeJournalResult()
    ),
  };
  const repository: Pick<
    FinanceSubledgerRepository,
    | 'listSourceBalances'
    | 'findSourceJournal'
    | 'listSettlementTotals'
    | 'sumSettledAmount'
    | 'findByIdempotencyKey'
    | 'createPending'
    | 'markPosted'
  > = {
    listSourceBalances: async (
      query
    ): Promise<FinanceSourceBalanceAggregate[]> => [
      {
        source_journal_entry: sourceJournalId,
        source_type:
          query.balance_type === 'receivable'
            ? 'order'
            : 'purchase',
        source_id: 'SOURCE-001',
        description: 'Source Finance',
        transaction_date: new Date(
          '2026-09-22T00:00:00.000Z'
        ),
        currency: 'IDR',
        account_id:
          query.balance_type === 'receivable'
            ? receivableAccountId
            : payableAccountId,
        original_amount: 500000,
      },
    ],
    findSourceJournal: async (_id, balanceType) =>
      sourceJournal(balanceType),
    listSettlementTotals: async () => [],
    sumSettledAmount: async () => 0,
    findByIdempotencyKey: async () => current,
    createPending: async (data) => {
      current = {
        ...data,
        _id: settlementId,
        organization: new Types.ObjectId(organizationId),
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
    findSelectableById: async (id: string) =>
      id === String(paymentAccountId)
        ? paymentAccount
        : null,
    findSelectableBySubtype: async (subtype: string) => {
      if (subtype === 'marketplace_receivable')
        return receivableAccount;
      if (subtype === 'accounts_payable')
        return payableAccount;
      return null;
    },
    findSelectableByCode: async (code: string) =>
      code === '1210'
        ? receivableAccount
        : code === '2100'
          ? payableAccount
          : null,
  };

  return {
    accountRepository,
    journalService,
    repository,
    getCurrent: () => current,
  };
};

describe('FinanceSubledgerService', () => {
  it('lists an open receivable and marks partial settlement state', async () => {
    const dependencies = makeDependencies();
    dependencies.repository.listSettlementTotals =
      async () => [
        {
          _id: sourceJournalId,
          settled_amount: 100000,
          last_settlement_date: new Date(
            '2026-09-23T00:00:00.000Z'
          ),
        },
      ];
    const service = new FinanceSubledgerService(
      { organizationId },
      dependencies
    );

    const result = await service.listBalances({
      balance_type: 'receivable',
      page: 1,
      limit: 25,
    });

    expect(result.balances[0]).toMatchObject({
      original_amount: 500000,
      settled_amount: 100000,
      outstanding_amount: 400000,
      settlement_status: 'partial',
      overdue_status: 'not_configured',
    });
  });

  it('posts a receivable settlement with debit cash and credit receivable', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceSubledgerService(
      { organizationId },
      dependencies
    );

    const result = await service.settle({
      balance_type: 'receivable',
      source_journal_entry_id: String(sourceJournalId),
      amount: 500000,
      settlement_date: '2026-09-23T00:00:00.000Z',
      payment_account_id: String(paymentAccountId),
      reference: 'PAYOUT-001',
      idempotency_key: 'settlement-key-1',
    });

    expect(result).toMatchObject({
      status: 'posted',
      amount: 500000,
      journal_entry_id: String(journalId),
    });
    expect(
      dependencies.journalService.postOperational
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        source_type: 'finance_settlement',
        lines: [
          expect.objectContaining({
            account_id: String(paymentAccountId),
            debit: 500000,
            credit: 0,
          }),
          expect.objectContaining({
            account_id: String(receivableAccountId),
            debit: 0,
            credit: 500000,
          }),
        ],
      }),
      undefined
    );
  });

  it('posts a payable settlement with debit payable and credit cash', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceSubledgerService(
      { organizationId },
      dependencies
    );

    await service.settle({
      balance_type: 'payable',
      source_journal_entry_id: String(sourceJournalId),
      amount: 200000,
      settlement_date: '2026-09-23T00:00:00.000Z',
      payment_account_id: String(paymentAccountId),
      idempotency_key: 'settlement-key-payable',
    });

    expect(
      dependencies.journalService.postOperational
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        source_event: 'payable_settlement_posted',
        lines: [
          expect.objectContaining({
            account_id: String(payableAccountId),
            debit: 200000,
            credit: 0,
          }),
          expect.objectContaining({
            account_id: String(paymentAccountId),
            debit: 0,
            credit: 200000,
          }),
        ],
      }),
      undefined
    );
  });

  it('rejects a settlement above the open balance', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceSubledgerService(
      { organizationId },
      dependencies
    );

    await expect(
      service.settle({
        balance_type: 'receivable',
        source_journal_entry_id: String(sourceJournalId),
        amount: 500001,
        settlement_date: '2026-09-23T00:00:00.000Z',
        payment_account_id: String(paymentAccountId),
        idempotency_key: 'settlement-key-too-large',
      })
    ).rejects.toMatchObject<Partial<FinanceDomainError>>({
      code: 'FINANCE_SETTLEMENT_AMOUNT_EXCEEDS_BALANCE',
    });
  });

  it('replays the same settlement without creating another journal', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceSubledgerService(
      { organizationId },
      dependencies
    );
    const input = {
      balance_type: 'receivable' as const,
      source_journal_entry_id: String(sourceJournalId),
      amount: 100000,
      settlement_date: '2026-09-23T00:00:00.000Z',
      payment_account_id: String(paymentAccountId),
      idempotency_key: 'settlement-key-replay',
    };

    await service.settle(input);
    const replay = await service.settle(input);

    expect(replay.replayed).toBe(true);
    expect(
      dependencies.journalService.postOperational
    ).toHaveBeenCalledTimes(1);
  });
});
