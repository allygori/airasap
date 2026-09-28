import { Types, type ClientSession } from 'mongoose';
import { FinanceAccountRepository } from '../accounts/finance-account.repository';
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
  FinanceOwnerWithdrawalInputDTO,
  FinanceOwnerWithdrawalReversalInputDTO,
  FinanceOwnerWithdrawalResponseDTO,
} from './finance-owner-withdrawal.dto';
import {
  FinanceOwnerWithdrawalInputSchema,
  FinanceOwnerWithdrawalReversalInputSchema,
  FinanceOwnerWithdrawalResponseSchema,
} from './finance-owner-withdrawal.schema';
import {
  FinanceOwnerWithdrawalRepository,
  type CreateFinanceOwnerWithdrawalRecord,
  type FinanceOwnerWithdrawalPersistenceRecord,
} from './finance-owner-withdrawal.repository';

type FinanceOwnerWithdrawalAccountPort = Pick<
  FinanceAccountRepository,
  'findSelectableById'
>;

type FinanceOwnerWithdrawalJournalPort = Pick<
  FinanceJournalService,
  'postOperational' | 'reverse'
>;

type FinanceOwnerWithdrawalRepositoryPort = Pick<
  FinanceOwnerWithdrawalRepository,
  | 'findByIdempotencyKey'
  | 'findWithdrawalById'
  | 'findByJournalEntry'
  | 'createDraft'
  | 'markPosted'
  | 'markReversedByJournalEntry'
>;

const getIdempotencyKey = (
  input: FinanceOwnerWithdrawalInputDTO
) =>
  input.idempotency_key ??
  `finance-owner-withdrawal:${new Types.ObjectId().toHexString()}`;

const getDescription = (
  input: FinanceOwnerWithdrawalInputDTO
) => input.description?.trim() || 'Penarikan pemilik';

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
  record: FinanceOwnerWithdrawalPersistenceRecord,
  replayed: boolean
): FinanceOwnerWithdrawalResponseDTO =>
  FinanceOwnerWithdrawalResponseSchema.parse({
    withdrawal_id: String(record._id),
    owner_account: mapAccount(
      record.owner_account,
      record.owner_account_code,
      record.owner_account_name
    ),
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

const assertSameRequest = (
  existing: FinanceOwnerWithdrawalPersistenceRecord,
  input: FinanceOwnerWithdrawalInputDTO,
  description: string
) => {
  const sameRequest =
    String(existing.owner_account) ===
      input.owner_account_id &&
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
      'Idempotency key sudah digunakan untuk penarikan pemilik dengan data berbeda.',
      'FINANCE_OWNER_WITHDRAWAL_IDEMPOTENCY_CONFLICT'
    );
  }
};

export class FinanceOwnerWithdrawalService {
  private readonly accountRepository: FinanceOwnerWithdrawalAccountPort;
  private readonly journalService: FinanceOwnerWithdrawalJournalPort;
  private readonly withdrawalRepository: FinanceOwnerWithdrawalRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      accountRepository?: FinanceOwnerWithdrawalAccountPort;
      journalService?: FinanceOwnerWithdrawalJournalPort;
      withdrawalRepository?: FinanceOwnerWithdrawalRepositoryPort;
    }
  ) {
    assertFinanceTenant(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
    this.journalService =
      dependencies?.journalService ??
      new FinanceJournalService(context);
    this.withdrawalRepository =
      dependencies?.withdrawalRepository ??
      new FinanceOwnerWithdrawalRepository(context);
  }

  async createDraft(
    input: FinanceOwnerWithdrawalInputDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceOwnerWithdrawalResponseDTO> {
    const data =
      FinanceOwnerWithdrawalInputSchema.parse(input);
    const idempotencyKey = getIdempotencyKey(data);
    const description = getDescription(data);
    const existing =
      await this.withdrawalRepository.findByIdempotencyKey(
        idempotencyKey,
        session
      );

    if (existing) {
      assertSameRequest(existing, data, description);
      return toResponse(existing, true);
    }

    const [ownerAccount, paymentAccount] =
      await Promise.all([
        this.resolveOwnerAccount(
          data.owner_account_id,
          session
        ),
        this.resolvePaymentAccount(
          data.payment_account_id,
          session
        ),
      ]);

    return this.createSource(
      {
        owner_account: ownerAccount._id,
        owner_account_code: ownerAccount.code,
        owner_account_name: ownerAccount.name,
        payment_account: paymentAccount._id,
        payment_account_code: paymentAccount.code,
        payment_account_name: paymentAccount.name,
        amount: data.amount,
        transaction_date: data.transaction_date,
        description,
        reference: data.reference ?? null,
        status: 'draft',
        journal_entry: null,
        idempotency_key: idempotencyKey,
      },
      data,
      session
    );
  }

  async post(
    withdrawalId: string,
    session?: ClientSession
  ): Promise<FinanceOwnerWithdrawalResponseDTO> {
    const withdrawal =
      await this.withdrawalRepository.findWithdrawalById(
        withdrawalId,
        session
      );

    if (!withdrawal) {
      throw new FinanceDomainError(
        'Penarikan pemilik Finance tidak ditemukan.',
        'FINANCE_OWNER_WITHDRAWAL_NOT_FOUND'
      );
    }
    if (withdrawal.status === 'posted') {
      return toResponse(withdrawal, true);
    }
    if (withdrawal.status === 'reversed') {
      throw new FinanceDomainError(
        'Penarikan yang sudah dibalik tidak dapat diposting kembali.',
        'FINANCE_OWNER_WITHDRAWAL_NOT_REVERSIBLE'
      );
    }

    const [ownerAccount, paymentAccount] =
      await Promise.all([
        this.resolveOwnerAccount(
          String(withdrawal.owner_account),
          session
        ),
        this.resolvePaymentAccount(
          String(withdrawal.payment_account),
          session
        ),
      ]);

    const journalResult =
      await this.journalService.postOperational(
        {
          transaction_date: withdrawal.transaction_date,
          posting_date: withdrawal.transaction_date,
          currency: 'IDR',
          description: `${withdrawal.description} — ${withdrawal.owner_account_name}`,
          source_type: 'owner_withdrawal',
          source_id: String(withdrawal._id),
          source_event: 'owner_withdrawal_posted',
          idempotency_key: `finance-owner-withdrawal-journal:${String(withdrawal._id)}`,
          lines: [
            {
              account_id: String(ownerAccount._id),
              debit: withdrawal.amount,
              credit: 0,
              description: `Penarikan ${withdrawal.owner_account_name}`,
            },
            {
              account_id: String(paymentAccount._id),
              debit: 0,
              credit: withdrawal.amount,
              description: `Dana keluar dari ${withdrawal.payment_account_name}`,
            },
          ] satisfies FinanceOperationalPostingDTO['lines'],
        },
        session
      );

    const posted =
      await this.withdrawalRepository.markPosted(
        String(withdrawal._id),
        journalResult.journal_entry.id,
        session
      );
    if (!posted) {
      const latest =
        await this.withdrawalRepository.findWithdrawalById(
          String(withdrawal._id),
          session
        );
      if (latest?.status === 'posted') {
        return toResponse(latest, true);
      }

      throw new FinanceDomainError(
        'Journal berhasil dibuat tetapi penarikan pemilik gagal ditandai posted.',
        'FINANCE_OWNER_WITHDRAWAL_FINALIZATION_FAILED'
      );
    }

    return toResponse(posted, journalResult.replayed);
  }

  async reverse(
    withdrawalId: string,
    input: FinanceOwnerWithdrawalReversalInputDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceOwnerWithdrawalResponseDTO> {
    const data =
      FinanceOwnerWithdrawalReversalInputSchema.parse(
        input
      );
    const withdrawal =
      await this.withdrawalRepository.findWithdrawalById(
        withdrawalId,
        session
      );

    if (!withdrawal) {
      throw new FinanceDomainError(
        'Penarikan pemilik Finance tidak ditemukan.',
        'FINANCE_OWNER_WITHDRAWAL_NOT_FOUND'
      );
    }
    if (withdrawal.status === 'reversed') {
      if (withdrawal.reversal_journal_entry) {
        return toResponse(withdrawal, true);
      }
      throw new FinanceDomainError(
        'Penarikan sudah ditandai reversed tetapi jurnal pembalik tidak ditemukan.',
        'FINANCE_OWNER_WITHDRAWAL_REVERSAL_FINALIZATION_FAILED'
      );
    }
    if (
      withdrawal.status !== 'posted' ||
      !withdrawal.journal_entry
    ) {
      throw new FinanceDomainError(
        'Hanya penarikan pemilik yang sudah posted yang dapat dibalik.',
        'FINANCE_OWNER_WITHDRAWAL_NOT_REVERSIBLE'
      );
    }

    const reversalResult =
      await this.journalService.reverse(
        String(withdrawal.journal_entry),
        {
          effective_date: data.effective_date,
          description: `Reversal penarikan pemilik: ${data.reason}`,
          idempotency_key: `finance-owner-withdrawal-reversal:${String(withdrawal._id)}`,
        } satisfies FinanceJournalReversalDTO,
        session
      );
    const reversed = await this.synchronizeJournalReversal(
      String(withdrawal.journal_entry),
      reversalResult.journal_entry.id,
      session
    );

    if (!reversed) {
      throw new FinanceDomainError(
        'Reversal journal berhasil dibuat tetapi sumber penarikan tidak dapat ditemukan.',
        'FINANCE_OWNER_WITHDRAWAL_REVERSAL_FINALIZATION_FAILED'
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
  ): Promise<FinanceOwnerWithdrawalResponseDTO | null> {
    const source =
      await this.withdrawalRepository.findByJournalEntry(
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
        'Penarikan sudah terhubung dengan jurnal reversal yang berbeda.',
        'FINANCE_OWNER_WITHDRAWAL_REVERSAL_FINALIZATION_FAILED'
      );
    }
    if (source.status !== 'posted') {
      throw new FinanceDomainError(
        'Sumber penarikan tidak berada dalam status yang dapat dibalik.',
        'FINANCE_OWNER_WITHDRAWAL_NOT_REVERSIBLE'
      );
    }

    const reversed =
      await this.withdrawalRepository.markReversedByJournalEntry(
        journalEntryId,
        reversalJournalEntryId,
        session
      );
    if (reversed) return toResponse(reversed, false);

    const latest =
      await this.withdrawalRepository.findByJournalEntry(
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
      'Reversal journal berhasil dibuat tetapi penarikan gagal ditandai reversed.',
      'FINANCE_OWNER_WITHDRAWAL_REVERSAL_FINALIZATION_FAILED'
    );
  }

  private async createSource(
    record: CreateFinanceOwnerWithdrawalRecord,
    input: FinanceOwnerWithdrawalInputDTO,
    session?: ClientSession
  ): Promise<FinanceOwnerWithdrawalResponseDTO> {
    try {
      const created =
        await this.withdrawalRepository.createDraft(
          record,
          session
        );
      return toResponse(created, false);
    } catch (error: unknown) {
      if (!isDuplicateKeyError(error)) throw error;

      const existing =
        await this.withdrawalRepository.findByIdempotencyKey(
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
        'Penarikan pemilik gagal dibuat karena konflik data.',
        'FINANCE_OWNER_WITHDRAWAL_IDEMPOTENCY_CONFLICT'
      );
    }
  }

  private async resolveOwnerAccount(
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
      account.type !== 'equity' ||
      account.subtype !== 'owner_drawings'
    ) {
      throw new FinanceDomainError(
        'Pilih akun penarikan pemilik yang aktif dan dapat diposting.',
        'FINANCE_OWNER_WITHDRAWAL_OWNER_ACCOUNT_INVALID'
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
      !['cash', 'bank'].includes(account.subtype ?? '')
    ) {
      throw new FinanceDomainError(
        'Pilih akun Kas atau Bank yang aktif dan dapat diposting.',
        'FINANCE_OWNER_WITHDRAWAL_PAYMENT_ACCOUNT_INVALID'
      );
    }

    return account;
  }
}
