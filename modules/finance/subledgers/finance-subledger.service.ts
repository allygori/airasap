import { Types, type ClientSession } from 'mongoose';
import { FinanceAccountRepository } from '../accounts/finance-account.repository';
import { FINANCE_CASH_BANK_SUBTYPE_VALUES } from '../cash-and-bank/finance-cash-bank.constants';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import { FinanceJournalService } from '../journal/finance-journal.service';
import type { FinanceOperationalPostingDTO } from '../journal/finance-journal.dto';
import type {
  FinanceSettlementInputDTO,
  FinanceSettlementResponseDTO,
  FinanceSubledgerBalanceDTO,
  FinanceSubledgerListResponseDTO,
  FinanceSubledgerListQueryDTO,
} from './finance-subledger.dto';
import {
  FinanceSettlementInputSchema,
  FinanceSettlementResponseSchema,
  FinanceSubledgerListQuerySchema,
  FinanceSubledgerListResponseSchema,
} from './finance-subledger.schema';
import {
  FinanceSubledgerRepository,
  type CreateFinanceSettlementRecord,
  type FinanceSettlementPersistenceRecord,
  type FinanceSourceJournalPersistenceRecord,
} from './finance-subledger.repository';

type FinanceSubledgerAccountPort = Pick<
  FinanceAccountRepository,
  | 'findSelectableById'
  | 'findSelectableBySubtype'
  | 'findSelectableByCode'
>;

type FinanceSubledgerJournalPort = Pick<
  FinanceJournalService,
  'postOperational'
>;

type FinanceSubledgerRepositoryPort = Pick<
  FinanceSubledgerRepository,
  | 'listSourceBalances'
  | 'findSourceJournal'
  | 'listSettlementTotals'
  | 'sumSettledAmount'
  | 'findByIdempotencyKey'
  | 'createPending'
  | 'markPosted'
> &
  Partial<
    Pick<
      FinanceSubledgerRepository,
      'findOpeningBalanceSubledgerItem'
    >
  >;

const eligiblePaymentSubtypes = new Set<string>(
  FINANCE_CASH_BANK_SUBTYPE_VALUES
);

const getIdempotencyKey = (
  input: FinanceSettlementInputDTO
) =>
  input.idempotency_key ??
  `finance-settlement:${new Types.ObjectId().toHexString()}`;

const isDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  if (!('code' in error)) return false;
  return (error as { code?: unknown }).code === 11000;
};

const mapAccount = (account: {
  _id: Types.ObjectId;
  code: string;
  name: string;
}) => ({
  id: String(account._id),
  code: account.code,
  name: account.name,
});

const toSettlementResponse = (
  record: FinanceSettlementPersistenceRecord,
  replayed: boolean
): FinanceSettlementResponseDTO =>
  FinanceSettlementResponseSchema.parse({
    settlement_id: String(record._id),
    balance_type: record.balance_type,
    source_journal_entry_id: String(
      record.source_journal_entry
    ),
    source_item_id: record.source_item_id
      ? String(record.source_item_id)
      : null,
    amount: record.amount,
    settlement_date: record.settlement_date.toISOString(),
    payment_account: {
      id: String(record.payment_account),
      code: record.payment_account_code,
      name: record.payment_account_name,
    },
    reference: record.reference ?? null,
    description: record.description,
    status: record.status,
    journal_entry_id: record.journal_entry
      ? String(record.journal_entry)
      : null,
    idempotency_key: record.idempotency_key,
    replayed,
  });

const getSourceLabel = (
  sourceType: string,
  sourceId: string
) => {
  if (sourceType === 'order') return `Order ${sourceId}`;
  if (sourceType === 'purchase')
    return `Purchase ${sourceId}`;
  if (sourceType === 'expense')
    return `Expense ${sourceId}`;
  if (sourceType === 'opening_balance')
    return `Saldo awal ${sourceId}`;
  return `${sourceType} ${sourceId}`;
};

const getSourceAmount = (
  source: FinanceSourceJournalPersistenceRecord,
  accountId: string,
  balanceType: FinanceSubledgerListQueryDTO['balance_type']
) =>
  source.lines.reduce((total, line) => {
    if (String(line.account_id) !== accountId) return total;
    return (
      total +
      (balanceType === 'receivable'
        ? line.debit - line.credit
        : line.credit - line.debit)
    );
  }, 0);

const assertSameSettlementRequest = (
  existing: FinanceSettlementPersistenceRecord,
  input: FinanceSettlementInputDTO,
  idempotencyKey: string
) => {
  const sameRequest =
    existing.balance_type === input.balance_type &&
    String(existing.source_journal_entry) ===
      input.source_journal_entry_id &&
    String(existing.source_item_id ?? '') ===
      (input.source_item_id ?? '') &&
    existing.amount === input.amount &&
    existing.settlement_date.getTime() ===
      input.settlement_date.getTime() &&
    String(existing.payment_account) ===
      input.payment_account_id &&
    (existing.reference ?? null) ===
      (input.reference ?? null) &&
    existing.idempotency_key === idempotencyKey;

  if (!sameRequest) {
    throw new FinanceDomainError(
      'Idempotency key sudah digunakan untuk settlement dengan data berbeda.',
      'FINANCE_SETTLEMENT_IDEMPOTENCY_CONFLICT'
    );
  }
};

export class FinanceSubledgerService {
  private readonly accountRepository: FinanceSubledgerAccountPort;
  private readonly journalService: FinanceSubledgerJournalPort;
  private readonly repository: FinanceSubledgerRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      accountRepository?: FinanceSubledgerAccountPort;
      journalService?: FinanceSubledgerJournalPort;
      repository?: FinanceSubledgerRepositoryPort;
    }
  ) {
    assertFinanceTenant(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
    this.journalService =
      dependencies?.journalService ??
      new FinanceJournalService(context);
    this.repository =
      dependencies?.repository ??
      new FinanceSubledgerRepository(context);
  }

  async listBalances(
    input: FinanceSubledgerListQueryDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceSubledgerListResponseDTO> {
    const query =
      FinanceSubledgerListQuerySchema.parse(input);
    const balanceAccount = await this.resolveBalanceAccount(
      query.balance_type,
      session
    );
    const sourceRows =
      await this.repository.listSourceBalances(
        query,
        [String(balanceAccount._id)],
        session
      );
    const totals =
      await this.repository.listSettlementTotals(
        sourceRows.map((row) =>
          String(row.source_journal_entry)
        ),
        query.balance_type,
        session
      );
    const totalsBySource = new Map(
      totals.map((total) => [
        total.source_item_id
          ? `item:${String(total.source_item_id)}`
          : `journal:${String(total.source_journal_entry ?? total._id)}`,
        total,
      ])
    );
    const balances = sourceRows
      .map((row): FinanceSubledgerBalanceDTO | null => {
        const sourceKey = row.source_item_id
          ? `item:${String(row.source_item_id)}`
          : `journal:${String(row.source_journal_entry)}`;
        const settled = totalsBySource.get(sourceKey);
        const settledAmount = settled?.settled_amount ?? 0;
        const outstandingAmount =
          row.original_amount - settledAmount;
        if (outstandingAmount <= 0) return null;
        return {
          source_key: sourceKey,
          source_journal_entry_id: String(
            row.source_journal_entry
          ),
          source_item_id: row.source_item_id
            ? String(row.source_item_id)
            : null,
          balance_type: query.balance_type,
          source_type: row.source_type,
          source_id: row.source_id,
          source_label:
            row.source_label ??
            getSourceLabel(row.source_type, row.source_id),
          description: row.description,
          transaction_date:
            row.transaction_date.toISOString(),
          due_date: null,
          overdue_status: 'not_configured',
          account: mapAccount({
            _id: row.account_id,
            code: balanceAccount.code,
            name: balanceAccount.name,
          }),
          original_amount: row.original_amount,
          settled_amount: settledAmount,
          outstanding_amount: outstandingAmount,
          settlement_status:
            settledAmount > 0 ? 'partial' : 'open',
          last_settlement_date:
            settled?.last_settlement_date
              ? settled.last_settlement_date.toISOString()
              : null,
          currency: row.currency,
        };
      })
      .filter(
        (balance): balance is FinanceSubledgerBalanceDTO =>
          !!balance
      );
    const start = (query.page - 1) * query.limit;

    return FinanceSubledgerListResponseSchema.parse({
      balance_type: query.balance_type,
      balances: balances.slice(start, start + query.limit),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: balances.length,
        total_pages: Math.ceil(
          balances.length / query.limit
        ),
      },
    });
  }

  async settle(
    input: FinanceSettlementInputDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceSettlementResponseDTO> {
    const data = FinanceSettlementInputSchema.parse(input);
    const idempotencyKey = getIdempotencyKey(data);
    const existing =
      await this.repository.findByIdempotencyKey(
        idempotencyKey,
        session
      );
    if (existing) {
      assertSameSettlementRequest(
        existing,
        data,
        idempotencyKey
      );
      if (existing.status === 'posted') {
        return toSettlementResponse(existing, true);
      }
    }

    const balanceAccount = await this.resolveBalanceAccount(
      data.balance_type,
      session
    );
    const openingItem = data.source_item_id
      ? await this.repository.findOpeningBalanceSubledgerItem?.(
          data.source_item_id,
          data.balance_type,
          [String(balanceAccount._id)],
          session
        )
      : null;
    const source = data.source_item_id
      ? null
      : await this.repository.findSourceJournal(
          data.source_journal_entry_id,
          data.balance_type,
          [String(balanceAccount._id)],
          session
        );
    if (
      (!openingItem && !source) ||
      (openingItem &&
        String(openingItem.journal_entry) !==
          data.source_journal_entry_id)
    ) {
      throw new FinanceDomainError(
        'Saldo Finance tidak ditemukan atau belum berstatus posted.',
        'FINANCE_SUBLEDGER_SOURCE_NOT_FOUND'
      );
    }

    const originalAmount = openingItem
      ? openingItem.amount
      : getSourceAmount(
          source!,
          String(balanceAccount._id),
          data.balance_type
        );
    const settledAmount =
      await this.repository.sumSettledAmount(
        data.source_journal_entry_id,
        data.balance_type,
        session,
        data.source_item_id
      );
    const outstandingAmount =
      originalAmount - settledAmount;
    if (data.amount > outstandingAmount) {
      throw new FinanceDomainError(
        'Nominal settlement melebihi saldo yang masih terbuka.',
        'FINANCE_SETTLEMENT_AMOUNT_EXCEEDS_BALANCE'
      );
    }

    const paymentAccount = await this.resolvePaymentAccount(
      data.payment_account_id,
      session
    );
    const settlement =
      existing ??
      (await this.createSettlement(
        {
          balance_type: data.balance_type,
          source_journal_entry: new Types.ObjectId(
            data.source_journal_entry_id
          ),
          ...(data.source_item_id
            ? {
                source_item_id: new Types.ObjectId(
                  data.source_item_id
                ),
              }
            : {}),
          source_type: openingItem
            ? 'opening_balance'
            : source!.source_type,
          source_id: openingItem
            ? openingItem.source_id
            : source!.source_id,
          source_description: openingItem
            ? openingItem.source_label
            : source!.description,
          amount: data.amount,
          settlement_date: data.settlement_date,
          payment_account: paymentAccount._id,
          payment_account_code: paymentAccount.code,
          payment_account_name: paymentAccount.name,
          reference: data.reference ?? null,
          description:
            data.description ??
            `${data.balance_type === 'receivable' ? 'Penerimaan piutang' : 'Pembayaran hutang'} ${openingItem ? openingItem.source_label : getSourceLabel(source!.source_type, source!.source_id)}`,
          status: 'pending',
          journal_entry: null,
          idempotency_key: idempotencyKey,
        },
        session
      ));

    const journalLines: FinanceOperationalPostingDTO['lines'] =
      data.balance_type === 'receivable'
        ? [
            {
              account_id: String(paymentAccount._id),
              debit: data.amount,
              credit: 0,
              description: 'Penerimaan settlement piutang',
            },
            {
              account_id: String(balanceAccount._id),
              debit: 0,
              credit: data.amount,
              description: 'Pengurangan piutang',
            },
          ]
        : [
            {
              account_id: String(balanceAccount._id),
              debit: data.amount,
              credit: 0,
              description: 'Pengurangan hutang',
            },
            {
              account_id: String(paymentAccount._id),
              debit: 0,
              credit: data.amount,
              description: 'Pembayaran hutang',
            },
          ];
    const journalResult =
      await this.journalService.postOperational(
        {
          transaction_date: data.settlement_date,
          posting_date: data.settlement_date,
          currency:
            openingItem?.currency ?? source!.currency,
          description: settlement.description,
          source_type: 'finance_settlement',
          source_id: String(settlement._id),
          source_event:
            data.balance_type === 'receivable'
              ? 'receivable_settlement_posted'
              : 'payable_settlement_posted',
          idempotency_key: `finance-settlement-journal:${String(settlement._id)}`,
          lines: journalLines,
        },
        session
      );
    const posted = await this.repository.markPosted(
      String(settlement._id),
      journalResult.journal_entry.id,
      session
    );
    if (!posted) {
      const latest =
        await this.repository.findByIdempotencyKey(
          idempotencyKey,
          session
        );
      if (latest?.status === 'posted') {
        return toSettlementResponse(latest, true);
      }
      throw new FinanceDomainError(
        'Journal settlement berhasil dibuat tetapi transaksi gagal ditandai posted.',
        'FINANCE_SETTLEMENT_FINALIZATION_FAILED'
      );
    }

    return toSettlementResponse(
      posted,
      journalResult.replayed
    );
  }

  private async resolveBalanceAccount(
    balanceType: FinanceSubledgerListQueryDTO['balance_type'],
    session?: ClientSession
  ) {
    const account =
      balanceType === 'receivable'
        ? ((await this.accountRepository.findSelectableBySubtype(
            'marketplace_receivable',
            session
          )) ??
          (await this.accountRepository.findSelectableByCode(
            '1210',
            session
          )))
        : ((await this.accountRepository.findSelectableBySubtype(
            'accounts_payable',
            session
          )) ??
          (await this.accountRepository.findSelectableByCode(
            '2100',
            session
          )));
    if (
      !account ||
      (balanceType === 'receivable'
        ? account.type !== 'asset'
        : account.type !== 'liability')
    ) {
      throw new FinanceDomainError(
        balanceType === 'receivable'
          ? 'Akun Piutang Marketplace aktif dan postable belum tersedia.'
          : 'Akun Utang Usaha aktif dan postable belum tersedia.',
        'FINANCE_SUBLEDGER_ACCOUNT_MISSING'
      );
    }
    return account;
  }

  private async resolvePaymentAccount(
    accountId: string,
    session?: ClientSession
  ) {
    const account =
      await this.accountRepository.findSelectableById(
        accountId,
        session
      );
    if (
      !account ||
      account.type !== 'asset' ||
      !eligiblePaymentSubtypes.has(account.subtype ?? '')
    ) {
      throw new FinanceDomainError(
        'Akun settlement harus berupa Kas, Bank, E-wallet, atau Saldo Marketplace yang aktif dan postable.',
        'FINANCE_SETTLEMENT_PAYMENT_ACCOUNT_INVALID'
      );
    }
    return account;
  }

  private async createSettlement(
    data: CreateFinanceSettlementRecord,
    session?: ClientSession
  ): Promise<FinanceSettlementPersistenceRecord> {
    try {
      return await this.repository.createPending(
        data,
        session
      );
    } catch (error: unknown) {
      if (!isDuplicateKeyError(error)) throw error;
      const existing =
        await this.repository.findByIdempotencyKey(
          data.idempotency_key,
          session
        );
      if (existing) {
        return existing;
      }
      throw new FinanceDomainError(
        'Settlement Finance gagal dibuat karena konflik data.',
        'FINANCE_SETTLEMENT_IDEMPOTENCY_CONFLICT'
      );
    }
  }
}
