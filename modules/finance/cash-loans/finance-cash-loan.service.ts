import { Types, type ClientSession } from 'mongoose';
import { createHash } from 'node:crypto';
import { FinanceAccountRepository } from '../accounts/finance-account.repository';
import { FinanceAccountService } from '../accounts/finance-account.service';
import type { FinanceAccountPersistenceRecord } from '../accounts/finance-account.repository';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import { FinanceJournalService } from '../journal/finance-journal.service';
import type {
  FinanceJournalReversalDTO,
  FinanceOperationalPostingDTO,
} from '../journal/finance-journal.dto';
import type {
  FinanceCashLoanEventType,
  FinanceCashLoanLenderType,
} from './finance-cash-loan.constants';
import type {
  FinanceCashLoanInputDTO,
  FinanceCashLoanResponseDTO,
  FinanceCashLoanReversalInputDTO,
} from './finance-cash-loan.dto';
import {
  FinanceCashLoanInputSchema,
  FinanceCashLoanResponseSchema,
  FinanceCashLoanReversalInputSchema,
} from './finance-cash-loan.schema';
import {
  FinanceCashLoanRepository,
  type CreateFinanceCashLoanRecord,
  type FinanceCashLoanBalanceRecord,
  type FinanceCashLoanPersistenceRecord,
} from './finance-cash-loan.repository';

const OWNER_LIABILITY_CODE = '2500';
const EXTERNAL_LIABILITY_CODE = '2600';

type FinanceCashLoanAccountPort = Pick<
  FinanceAccountRepository,
  'findSelectableById' | 'findByCode'
>;
type FinanceCashLoanAccountSetupPort = Pick<
  FinanceAccountService,
  'ensureDefaultAccountByCode'
>;
type FinanceCashLoanJournalPort = Pick<
  FinanceJournalService,
  'postOperational' | 'reverse'
>;
type FinanceCashLoanRepositoryPort = Pick<
  FinanceCashLoanRepository,
  | 'findByIdempotencyKey'
  | 'findLoanById'
  | 'findByJournalEntry'
  | 'getPostedBalancesByLender'
  | 'createDraft'
  | 'markPosted'
  | 'markReversedByJournalEntry'
>;

type ResolvedLender = {
  key: string;
  type: FinanceCashLoanLenderType;
  name: string;
  ownerAccount: {
    _id: Types.ObjectId;
    code: string;
    name: string;
  } | null;
  liabilityCode: string;
};

const getIdempotencyKey = (
  input: FinanceCashLoanInputDTO
) =>
  input.idempotency_key ??
  `finance-cash-loan:${new Types.ObjectId().toHexString()}`;

const normalizeLenderName = (name: string) =>
  name.trim().replace(/\s+/g, ' ');

const makeLenderKey = (
  type: FinanceCashLoanLenderType,
  name: string
) => {
  const normalized =
    normalizeLenderName(name).toLocaleLowerCase('id-ID');
  const digest = createHash('sha256')
    .update(normalized)
    .digest('hex');
  return `lender:${type}:${digest}`;
};

const getLiabilityAccountCode = (
  lenderType: FinanceCashLoanLenderType
) =>
  lenderType === 'owner'
    ? OWNER_LIABILITY_CODE
    : EXTERNAL_LIABILITY_CODE;

const getDescription = (input: FinanceCashLoanInputDTO) =>
  input.description?.trim() ||
  (input.event_type === 'received'
    ? 'Penerimaan pinjaman tunai'
    : 'Pembayaran pokok pinjaman tunai');

const isDuplicateKeyError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 11000;

const mapAccount = (
  id: Types.ObjectId,
  code: string,
  name: string
) => ({ id: String(id), code, name });

const toResponse = (
  record: FinanceCashLoanPersistenceRecord,
  replayed: boolean
): FinanceCashLoanResponseDTO =>
  FinanceCashLoanResponseSchema.parse({
    loan_id: String(record._id),
    event_type: record.event_type,
    lender: {
      key: record.lender_key,
      type: record.lender_type,
      name: record.lender_name,
      owner_account:
        record.owner_account &&
        record.owner_account_code &&
        record.owner_account_name
          ? mapAccount(
              record.owner_account,
              record.owner_account_code,
              record.owner_account_name
            )
          : null,
    },
    liability_account: {
      code: record.liability_account_code,
      name: record.liability_account_name,
    },
    payment_account: mapAccount(
      record.payment_account,
      record.payment_account_code,
      record.payment_account_name
    ),
    amount: record.amount,
    transaction_date: record.transaction_date.toISOString(),
    description: record.description,
    reference: record.reference ?? null,
    status: record.status,
    journal_entry_id: record.journal_entry
      ? String(record.journal_entry)
      : null,
    reversal_journal_entry_id: record.reversal_journal_entry
      ? String(record.reversal_journal_entry)
      : null,
    idempotency_key: record.idempotency_key,
    replayed,
  });

const getBalance = (
  records: FinanceCashLoanBalanceRecord[],
  lenderKey: string
) => records.find((record) => record._id === lenderKey);

const getOutstanding = (
  balance?: FinanceCashLoanBalanceRecord
) =>
  Math.max(
    0,
    (balance?.received_total ?? 0) -
      (balance?.repayment_total ?? 0)
  );

const assertSameRequest = (
  existing: FinanceCashLoanPersistenceRecord,
  input: FinanceCashLoanInputDTO,
  description: string
) => {
  const lenderKey =
    input.event_type === 'repayment'
      ? input.lender_key
      : input.lender_type === 'owner'
        ? `owner:${input.owner_account_id}`
        : makeLenderKey(
            input.lender_type!,
            input.lender_name!
          );
  const lenderNameMatches =
    input.event_type === 'repayment' ||
    input.lender_type === 'owner' ||
    existing.lender_name.toLocaleLowerCase('id-ID') ===
      normalizeLenderName(
        input.lender_name!
      ).toLocaleLowerCase('id-ID');
  const sameRequest =
    existing.event_type === input.event_type &&
    existing.lender_key === lenderKey &&
    (input.event_type === 'repayment' ||
      existing.lender_type === input.lender_type) &&
    lenderNameMatches &&
    (input.event_type !== 'received' ||
      input.lender_type !== 'owner' ||
      String(existing.owner_account ?? '') ===
        input.owner_account_id) &&
    String(existing.payment_account) ===
      input.payment_account_id &&
    existing.amount === input.amount &&
    existing.transaction_date.getTime() ===
      input.transaction_date.getTime() &&
    existing.description === description &&
    (existing.reference ?? null) ===
      (input.reference ?? null);

  if (!sameRequest) {
    throw new FinanceDomainError(
      'Idempotency key sudah digunakan untuk transaksi pinjaman dengan data berbeda.',
      'FINANCE_CASH_LOAN_IDEMPOTENCY_CONFLICT'
    );
  }
};

export class FinanceCashLoanService {
  private readonly accountRepository: FinanceCashLoanAccountPort;
  private readonly accountSetupService: FinanceCashLoanAccountSetupPort;
  private readonly journalService: FinanceCashLoanJournalPort;
  private readonly loanRepository: FinanceCashLoanRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      accountRepository?: FinanceCashLoanAccountPort;
      accountSetupService?: FinanceCashLoanAccountSetupPort;
      journalService?: FinanceCashLoanJournalPort;
      loanRepository?: FinanceCashLoanRepositoryPort;
    }
  ) {
    assertFinanceTenant(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
    this.accountSetupService =
      dependencies?.accountSetupService ??
      new FinanceAccountService(context);
    this.journalService =
      dependencies?.journalService ??
      new FinanceJournalService(context);
    this.loanRepository =
      dependencies?.loanRepository ??
      new FinanceCashLoanRepository(context);
  }

  async createDraft(
    input: FinanceCashLoanInputDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceCashLoanResponseDTO> {
    const data = FinanceCashLoanInputSchema.parse(input);
    const idempotencyKey = getIdempotencyKey(data);
    const description = getDescription(data);
    const existing =
      await this.loanRepository.findByIdempotencyKey(
        idempotencyKey,
        session
      );
    if (existing) {
      assertSameRequest(existing, data, description);
      return toResponse(existing, true);
    }

    const lender =
      data.event_type === 'received'
        ? await this.resolveNewLender(data, session)
        : await this.resolveExistingLender(
            data.lender_key!,
            session
          );
    const paymentAccount = await this.resolvePaymentAccount(
      data.payment_account_id,
      data.event_type,
      session
    );

    const outstanding = await this.getLenderOutstanding(
      lender.key,
      session
    );
    if (
      data.event_type === 'repayment' &&
      (outstanding <= 0 || data.amount > outstanding)
    ) {
      throw this.repaymentExceedsBalance(outstanding);
    }

    const liabilityAccount =
      await this.resolveLiabilityAccount(
        lender.liabilityCode,
        lender.type,
        session
      );
    const record: CreateFinanceCashLoanRecord = {
      event_type: data.event_type,
      lender_key: lender.key,
      lender_type: lender.type,
      lender_name: lender.name,
      owner_account: lender.ownerAccount?._id ?? null,
      owner_account_code: lender.ownerAccount?.code ?? null,
      owner_account_name: lender.ownerAccount?.name ?? null,
      liability_account_code: liabilityAccount.code,
      liability_account_name: liabilityAccount.name,
      payment_account: paymentAccount._id,
      payment_account_code: paymentAccount.code,
      payment_account_name: paymentAccount.name,
      amount: data.amount,
      transaction_date: data.transaction_date,
      description,
      reference: data.reference ?? null,
      status: 'draft',
      journal_entry: null,
      reversal_journal_entry: null,
      idempotency_key: idempotencyKey,
    };

    return this.createSource(
      record,
      data,
      lender,
      paymentAccount,
      session
    );
  }

  async post(
    loanId: string,
    session?: ClientSession
  ): Promise<FinanceCashLoanResponseDTO> {
    const loan = await this.loanRepository.findLoanById(
      loanId,
      session
    );
    if (!loan) {
      throw new FinanceDomainError(
        'Transaksi pinjaman tunai tidak ditemukan.',
        'FINANCE_CASH_LOAN_NOT_FOUND'
      );
    }
    if (loan.status === 'posted')
      return toResponse(loan, true);
    if (loan.status === 'reversed') {
      throw new FinanceDomainError(
        'Transaksi pinjaman yang sudah dibalik tidak dapat diposting kembali.',
        'FINANCE_CASH_LOAN_NOT_REVERSIBLE'
      );
    }

    if (loan.event_type === 'repayment') {
      const outstanding = await this.getLenderOutstanding(
        loan.lender_key,
        session
      );
      if (loan.amount > outstanding) {
        throw this.repaymentExceedsBalance(outstanding);
      }
    }

    await this.accountSetupService.ensureDefaultAccountByCode(
      loan.liability_account_code,
      session
    );
    if (loan.lender_type === 'owner') {
      await this.resolveOwnerAccount(
        String(loan.owner_account),
        session
      );
    }
    const [paymentAccount, liabilityAccount] =
      await Promise.all([
        this.resolvePaymentAccount(
          String(loan.payment_account),
          loan.event_type,
          session
        ),
        this.resolveLiabilityAccount(
          loan.liability_account_code,
          loan.lender_type,
          session
        ),
      ]);

    const isReceipt = loan.event_type === 'received';
    const journalResult =
      await this.journalService.postOperational(
        {
          transaction_date: loan.transaction_date,
          posting_date: loan.transaction_date,
          currency: 'IDR',
          description: `${loan.description} — ${loan.lender_name}`,
          source_type: 'cash_loan',
          source_id: String(loan._id),
          source_event: isReceipt
            ? 'loan_received'
            : 'principal_repaid',
          idempotency_key: `finance-cash-loan-journal:${String(loan._id)}`,
          lines: isReceipt
            ? [
                {
                  account_id: String(paymentAccount._id),
                  debit: loan.amount,
                  credit: 0,
                  description: `Dana pinjaman masuk ke ${loan.payment_account_name}`,
                },
                {
                  account_id: String(liabilityAccount._id),
                  debit: 0,
                  credit: loan.amount,
                  description: `Utang kepada ${loan.lender_name}`,
                },
              ]
            : [
                {
                  account_id: String(liabilityAccount._id),
                  debit: loan.amount,
                  credit: 0,
                  description: `Pembayaran pokok pinjaman kepada ${loan.lender_name}`,
                },
                {
                  account_id: String(paymentAccount._id),
                  debit: 0,
                  credit: loan.amount,
                  description: `Dana pembayaran keluar dari ${loan.payment_account_name}`,
                },
              ],
        } satisfies FinanceOperationalPostingDTO,
        session
      );

    const posted = await this.loanRepository.markPosted(
      String(loan._id),
      journalResult.journal_entry.id,
      session
    );
    if (!posted) {
      const latest = await this.loanRepository.findLoanById(
        String(loan._id),
        session
      );
      if (latest?.status === 'posted') {
        return toResponse(latest, true);
      }
      throw new FinanceDomainError(
        'Jurnal berhasil dibuat tetapi transaksi pinjaman gagal ditandai posted.',
        'FINANCE_CASH_LOAN_FINALIZATION_FAILED'
      );
    }
    return toResponse(posted, journalResult.replayed);
  }

  async reverse(
    loanId: string,
    input: FinanceCashLoanReversalInputDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceCashLoanResponseDTO> {
    const data =
      FinanceCashLoanReversalInputSchema.parse(input);
    const loan = await this.loanRepository.findLoanById(
      loanId,
      session
    );
    if (!loan) {
      throw new FinanceDomainError(
        'Transaksi pinjaman tunai tidak ditemukan.',
        'FINANCE_CASH_LOAN_NOT_FOUND'
      );
    }
    if (loan.status === 'reversed') {
      if (loan.reversal_journal_entry) {
        return toResponse(loan, true);
      }
      throw new FinanceDomainError(
        'Transaksi sudah ditandai dibalik tetapi jurnal pembalik tidak ditemukan.',
        'FINANCE_CASH_LOAN_REVERSAL_FINALIZATION_FAILED'
      );
    }
    if (loan.status !== 'posted' || !loan.journal_entry) {
      throw new FinanceDomainError(
        'Hanya transaksi pinjaman yang sudah posted yang dapat dibalik.',
        'FINANCE_CASH_LOAN_NOT_REVERSIBLE'
      );
    }
    await this.assertCanReverse(loan, session);

    const reversalResult =
      await this.journalService.reverse(
        String(loan.journal_entry),
        {
          effective_date: data.effective_date,
          description: `Reversal pinjaman tunai: ${data.reason}`,
          idempotency_key: `finance-cash-loan-reversal:${String(loan._id)}`,
        } satisfies FinanceJournalReversalDTO,
        session
      );
    const reversed = await this.synchronizeJournalReversal(
      String(loan.journal_entry),
      reversalResult.journal_entry.id,
      session
    );
    if (!reversed) {
      throw new FinanceDomainError(
        'Jurnal pembalik berhasil dibuat tetapi transaksi pinjaman tidak dapat ditemukan.',
        'FINANCE_CASH_LOAN_REVERSAL_FINALIZATION_FAILED'
      );
    }
    return {
      ...reversed,
      replayed:
        reversalResult.replayed || reversed.replayed,
    };
  }

  async synchronizeJournalReversal(
    journalEntryId: string,
    reversalJournalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceCashLoanResponseDTO | null> {
    const source =
      await this.loanRepository.findByJournalEntry(
        journalEntryId,
        session
      );
    if (!source) return null;
    if (source.status === 'reversed') {
      if (
        String(source.reversal_journal_entry ?? '') ===
        reversalJournalEntryId
      ) {
        return toResponse(source, true);
      }
      throw new FinanceDomainError(
        'Transaksi pinjaman sudah terhubung dengan jurnal reversal yang berbeda.',
        'FINANCE_CASH_LOAN_REVERSAL_FINALIZATION_FAILED'
      );
    }
    if (source.status !== 'posted') {
      throw new FinanceDomainError(
        'Sumber pinjaman tidak berada dalam status yang dapat dibalik.',
        'FINANCE_CASH_LOAN_NOT_REVERSIBLE'
      );
    }
    const reversed =
      await this.loanRepository.markReversedByJournalEntry(
        journalEntryId,
        reversalJournalEntryId,
        session
      );
    if (reversed) return toResponse(reversed, false);

    const latest =
      await this.loanRepository.findByJournalEntry(
        journalEntryId,
        session
      );
    if (
      latest?.status === 'reversed' &&
      String(latest.reversal_journal_entry ?? '') ===
        reversalJournalEntryId
    ) {
      return toResponse(latest, true);
    }
    throw new FinanceDomainError(
      'Jurnal reversal berhasil dibuat tetapi transaksi pinjaman gagal ditandai dibalik.',
      'FINANCE_CASH_LOAN_REVERSAL_FINALIZATION_FAILED'
    );
  }

  async assertCanReverseJournal(
    journalEntryId: string,
    session?: ClientSession
  ): Promise<void> {
    const source =
      await this.loanRepository.findByJournalEntry(
        journalEntryId,
        session
      );
    if (source?.status === 'posted') {
      await this.assertCanReverse(source, session);
    }
  }

  private async createSource(
    record: CreateFinanceCashLoanRecord,
    input: FinanceCashLoanInputDTO,
    lender: ResolvedLender,
    paymentAccount: FinanceAccountPersistenceRecord,
    session?: ClientSession
  ): Promise<FinanceCashLoanResponseDTO> {
    try {
      const created = await this.loanRepository.createDraft(
        record,
        session
      );
      return toResponse(created, false);
    } catch (error: unknown) {
      if (!isDuplicateKeyError(error)) throw error;
      const existing =
        await this.loanRepository.findByIdempotencyKey(
          record.idempotency_key,
          session
        );
      if (existing) {
        assertSameRequest(
          existing,
          input,
          record.description
        );
        return toResponse(existing, true);
      }
      throw new FinanceDomainError(
        'Transaksi pinjaman gagal dibuat karena konflik data.',
        'FINANCE_CASH_LOAN_IDEMPOTENCY_CONFLICT'
      );
    }
  }

  private async resolveNewLender(
    input: FinanceCashLoanInputDTO,
    session?: ClientSession
  ): Promise<ResolvedLender> {
    const type = input.lender_type!;
    let name: string;
    let ownerAccount: FinanceAccountPersistenceRecord | null =
      null;

    if (type === 'owner') {
      ownerAccount = await this.resolveOwnerAccount(
        input.owner_account_id!,
        session
      );
      name = ownerAccount.name;
      return {
        key: `owner:${String(ownerAccount._id)}`,
        type,
        name,
        ownerAccount: {
          _id: ownerAccount._id,
          code: ownerAccount.code,
          name: ownerAccount.name,
        },
        liabilityCode: OWNER_LIABILITY_CODE,
      };
    }

    name = normalizeLenderName(input.lender_name!);
    return {
      key: makeLenderKey(type, name),
      type,
      name,
      ownerAccount: null,
      liabilityCode: EXTERNAL_LIABILITY_CODE,
    };
  }

  private async resolveExistingLender(
    lenderKey: string,
    session?: ClientSession
  ): Promise<ResolvedLender> {
    const balance = getBalance(
      await this.loanRepository.getPostedBalancesByLender(
        session
      ),
      lenderKey
    );
    if (!balance || getOutstanding(balance) <= 0) {
      throw new FinanceDomainError(
        'Pinjaman ini tidak ditemukan atau tidak memiliki sisa pokok yang dapat dibayar.',
        'FINANCE_CASH_LOAN_LENDER_NOT_FOUND'
      );
    }
    return {
      key: balance._id,
      type: balance.lender_type,
      name: balance.lender_name,
      ownerAccount:
        balance.owner_account &&
        balance.owner_account_code &&
        balance.owner_account_name
          ? {
              _id: balance.owner_account,
              code: balance.owner_account_code,
              name: balance.owner_account_name,
            }
          : null,
      liabilityCode: getLiabilityAccountCode(
        balance.lender_type
      ),
    };
  }

  private async resolveOwnerAccount(
    accountId: string,
    session?: ClientSession
  ): Promise<FinanceAccountPersistenceRecord> {
    const account =
      await this.accountRepository.findSelectableById(
        accountId,
        session
      );
    if (
      !account ||
      account.type !== 'equity' ||
      account.subtype !== 'owner_capital'
    ) {
      throw new FinanceDomainError(
        'Pilih akun Modal Pemilik yang aktif untuk mengidentifikasi pemberi pinjaman.',
        'FINANCE_CASH_LOAN_OWNER_ACCOUNT_INVALID'
      );
    }
    return account;
  }

  private async resolvePaymentAccount(
    accountId: string,
    eventType: FinanceCashLoanEventType,
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
      (eventType === 'received'
        ? account.subtype !== 'bank'
        : !['cash', 'bank'].includes(account.subtype ?? ''))
    ) {
      throw new FinanceDomainError(
        eventType === 'received'
          ? 'Pilih rekening Bank usaha yang aktif dan dapat diposting sebagai rekening penerima.'
          : 'Pilih akun Kas atau Bank yang aktif dan dapat diposting untuk pembayaran.',
        'FINANCE_CASH_LOAN_PAYMENT_ACCOUNT_INVALID'
      );
    }
    return account;
  }

  private async resolveLiabilityAccount(
    code: string,
    lenderType: FinanceCashLoanLenderType,
    session?: ClientSession
  ) {
    const expectedCode =
      getLiabilityAccountCode(lenderType);
    const expectedSubtype =
      lenderType === 'owner'
        ? 'owner_loan_payable'
        : 'cash_loan_payable';
    const account = await this.accountRepository.findByCode(
      code,
      session
    );
    if (
      code !== expectedCode ||
      !account ||
      account.type !== 'liability' ||
      account.subtype !== expectedSubtype ||
      !account.is_active ||
      !account.is_postable
    ) {
      throw new FinanceDomainError(
        lenderType === 'owner'
          ? 'Akun sistem Utang kepada Pemilik belum tersedia di Chart of Accounts.'
          : 'Akun sistem Utang Pinjaman Tunai belum tersedia di Chart of Accounts.',
        'FINANCE_CASH_LOAN_LIABILITY_ACCOUNT_MISSING'
      );
    }
    return account;
  }

  private async getLenderOutstanding(
    lenderKey: string,
    session?: ClientSession
  ) {
    const balances =
      await this.loanRepository.getPostedBalancesByLender(
        session
      );
    return getOutstanding(getBalance(balances, lenderKey));
  }

  private repaymentExceedsBalance(outstanding: number) {
    return new FinanceDomainError(
      `Nominal pembayaran pokok melebihi sisa pinjaman (${outstanding}).`,
      'FINANCE_CASH_LOAN_REPAYMENT_EXCEEDS_BALANCE'
    );
  }

  private async assertCanReverse(
    loan: FinanceCashLoanPersistenceRecord,
    session?: ClientSession
  ) {
    if (loan.event_type !== 'received') return;
    const outstanding = await this.getLenderOutstanding(
      loan.lender_key,
      session
    );
    if (outstanding < loan.amount) {
      throw new FinanceDomainError(
        'Pinjaman ini sudah digunakan untuk pembayaran pokok. Balikkan transaksi pembayaran terkait terlebih dahulu sebelum membalik penerimaan pinjaman.',
        'FINANCE_CASH_LOAN_NOT_REVERSIBLE'
      );
    }
  }
}
