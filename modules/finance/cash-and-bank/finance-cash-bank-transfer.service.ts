import { Types, type ClientSession } from 'mongoose';
import { FinanceAccountRepository } from '../accounts/finance-account.repository';
import { FinanceDomainError } from '../finance.error';
import { FinanceJournalService } from '../journal/finance-journal.service';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import { FINANCE_CASH_BANK_SUBTYPE_VALUES } from './finance-cash-bank.constants';
import type {
  FinanceCashBankTransferInputDTO,
  FinanceCashBankTransferResponseDTO,
} from './finance-cash-bank-transfer.dto';
import {
  FinanceCashBankTransferInputSchema,
  FinanceCashBankTransferResponseSchema,
} from './finance-cash-bank-transfer.schema';
import {
  FinanceCashBankTransferRepository,
  type CreateFinanceCashBankTransferRecord,
  type FinanceCashBankTransferPersistenceRecord,
} from './finance-cash-bank-transfer.repository';

type FinanceCashBankTransferAccountPort = Pick<
  FinanceAccountRepository,
  'findSelectableById'
>;

type FinanceCashBankTransferJournalPort = Pick<
  FinanceJournalService,
  'postOperational'
>;

type FinanceCashBankTransferRepositoryPort = Pick<
  FinanceCashBankTransferRepository,
  'findByIdempotencyKey' | 'createPending' | 'markPosted'
>;

const eligibleSubtypes = new Set<string>(
  FINANCE_CASH_BANK_SUBTYPE_VALUES
);

const isDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  if (!('code' in error)) return false;
  return (error as { code?: unknown }).code === 11000;
};

const getIdempotencyKey = (
  input: FinanceCashBankTransferInputDTO
) =>
  input.idempotency_key ??
  `finance-cash-bank-transfer:${new Types.ObjectId().toHexString()}`;

const getDescription = (
  input: FinanceCashBankTransferInputDTO,
  sourceName: string,
  destinationName: string
) =>
  input.description?.trim() ||
  `Transfer ${sourceName} ke ${destinationName}`;

const assertSameRequest = (
  existing: FinanceCashBankTransferPersistenceRecord,
  input: FinanceCashBankTransferInputDTO,
  description: string,
  idempotencyKey: string
) => {
  const matches =
    String(existing.source_account) ===
      input.source_account_id &&
    String(existing.destination_account) ===
      input.destination_account_id &&
    existing.amount === input.amount &&
    existing.transaction_date.getTime() ===
      input.transaction_date.getTime() &&
    (existing.reference ?? null) ===
      (input.reference ?? null) &&
    existing.description === description &&
    existing.idempotency_key === idempotencyKey;

  if (!matches) {
    throw new FinanceDomainError(
      'Idempotency key sudah digunakan untuk transfer dengan data berbeda.',
      'FINANCE_CASH_BANK_TRANSFER_IDEMPOTENCY_CONFLICT'
    );
  }
};

const toResponse = (
  record: FinanceCashBankTransferPersistenceRecord,
  replayed: boolean
): FinanceCashBankTransferResponseDTO =>
  FinanceCashBankTransferResponseSchema.parse({
    transfer_id: String(record._id),
    source_account: {
      id: String(record.source_account),
      code: record.source_account_code,
      name: record.source_account_name,
    },
    destination_account: {
      id: String(record.destination_account),
      code: record.destination_account_code,
      name: record.destination_account_name,
    },
    amount: record.amount,
    transaction_date: record.transaction_date.toISOString(),
    reference: record.reference,
    description: record.description,
    status: record.status,
    journal_entry_id: record.journal_entry
      ? String(record.journal_entry)
      : null,
    idempotency_key: record.idempotency_key,
    replayed,
  });

export class FinanceCashBankTransferService {
  private readonly accountRepository: FinanceCashBankTransferAccountPort;
  private readonly journalService: FinanceCashBankTransferJournalPort;
  private readonly transferRepository: FinanceCashBankTransferRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      accountRepository?: FinanceCashBankTransferAccountPort;
      journalService?: FinanceCashBankTransferJournalPort;
      transferRepository?: FinanceCashBankTransferRepositoryPort;
    }
  ) {
    assertFinanceTenant(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
    this.journalService =
      dependencies?.journalService ??
      new FinanceJournalService(context);
    this.transferRepository =
      dependencies?.transferRepository ??
      new FinanceCashBankTransferRepository(context);
  }

  async post(
    input: FinanceCashBankTransferInputDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceCashBankTransferResponseDTO> {
    const data =
      FinanceCashBankTransferInputSchema.parse(input);
    const idempotencyKey = getIdempotencyKey(data);
    const [sourceAccount, destinationAccount] =
      await Promise.all([
        this.accountRepository.findSelectableById(
          data.source_account_id,
          session
        ),
        this.accountRepository.findSelectableById(
          data.destination_account_id,
          session
        ),
      ]);

    if (
      !sourceAccount ||
      !destinationAccount ||
      !eligibleSubtypes.has(sourceAccount.subtype ?? '') ||
      !eligibleSubtypes.has(
        destinationAccount.subtype ?? ''
      )
    ) {
      throw new FinanceDomainError(
        'Sumber dan tujuan transfer harus berupa akun Kas, Bank, E-wallet, atau Saldo Marketplace yang aktif dan postable.',
        'FINANCE_CASH_BANK_TRANSFER_ACCOUNT_INVALID'
      );
    }

    const description = getDescription(
      data,
      sourceAccount.name,
      destinationAccount.name
    );
    const existing =
      await this.transferRepository.findByIdempotencyKey(
        idempotencyKey,
        session
      );
    if (existing) {
      assertSameRequest(
        existing,
        data,
        description,
        idempotencyKey
      );
      if (existing.status === 'posted') {
        return toResponse(existing, true);
      }
    }

    const transfer =
      existing ??
      (await this.createPending(
        {
          source_account: new Types.ObjectId(
            data.source_account_id
          ),
          source_account_code: sourceAccount.code,
          source_account_name: sourceAccount.name,
          destination_account: new Types.ObjectId(
            data.destination_account_id
          ),
          destination_account_code: destinationAccount.code,
          destination_account_name: destinationAccount.name,
          amount: data.amount,
          transaction_date: data.transaction_date,
          reference: data.reference ?? null,
          description,
          idempotency_key: idempotencyKey,
          status: 'pending',
          journal_entry: null,
        },
        session
      ));

    const journalResult =
      await this.journalService.postOperational(
        {
          transaction_date: transfer.transaction_date,
          posting_date: transfer.transaction_date,
          currency: 'IDR',
          description: transfer.description,
          source_type: 'cash_bank_transfer',
          source_id: String(transfer._id),
          source_event: 'cash_bank_transfer_posted',
          idempotency_key: `finance-cash-bank-transfer-journal:${idempotencyKey}`,
          lines: [
            {
              account_id: String(
                transfer.destination_account
              ),
              debit: transfer.amount,
              credit: 0,
              description: `Transfer masuk dari ${transfer.source_account_name}`,
            },
            {
              account_id: String(transfer.source_account),
              debit: 0,
              credit: transfer.amount,
              description: `Transfer keluar ke ${transfer.destination_account_name}`,
            },
          ],
        },
        session
      );

    const posted = await this.transferRepository.markPosted(
      String(transfer._id),
      journalResult.journal_entry.id,
      session
    );
    if (!posted) {
      const latest =
        await this.transferRepository.findByIdempotencyKey(
          idempotencyKey,
          session
        );
      if (latest?.status === 'posted') {
        return toResponse(latest, true);
      }

      throw new FinanceDomainError(
        'Journal berhasil dibuat tetapi transfer gagal ditandai posted.',
        'FINANCE_CASH_BANK_TRANSFER_FINALIZATION_FAILED'
      );
    }

    return toResponse(posted, journalResult.replayed);
  }

  private async createPending(
    data: CreateFinanceCashBankTransferRecord,
    session?: ClientSession
  ): Promise<FinanceCashBankTransferPersistenceRecord> {
    try {
      return await this.transferRepository.createPending(
        data,
        session
      );
    } catch (error: unknown) {
      if (!isDuplicateKeyError(error)) throw error;

      const existing =
        await this.transferRepository.findByIdempotencyKey(
          data.idempotency_key,
          session
        );
      if (existing) return existing;

      throw new FinanceDomainError(
        'Transfer gagal dibuat karena konflik data.',
        'FINANCE_CASH_BANK_TRANSFER_IDEMPOTENCY_CONFLICT'
      );
    }
  }
}
