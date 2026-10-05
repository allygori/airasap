import { Types, type ClientSession } from 'mongoose';
import { FinanceAccountRepository } from '../accounts/finance-account.repository';
import { FinanceAccountRoleResolverService } from '../accounts/finance-account-role-resolver.service';
import { FinanceDomainError } from '../finance.error';
import { FinanceJournalService } from '../journal/finance-journal.service';
import { FinanceJournalRepository } from '../journal/finance-journal.repository';
import type { FinanceJournalReversalDTO } from '../journal/finance-journal.dto';
import { FinanceJournalReversalSchema } from '../journal/finance-journal.schema';
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
  FinanceMarketplaceWithdrawalInputSchema,
  type FinanceMarketplaceWithdrawalInputDTO,
} from './finance-marketplace-withdrawal.schema';
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
  'postOperational' | 'reverse'
> &
  Partial<
    Pick<FinanceJournalService, 'findByIdempotencyKey'>
  >;

type FinanceCashBankTransferRepositoryPort = Pick<
  FinanceCashBankTransferRepository,
  | 'findByIdempotencyKey'
  | 'findByTransferId'
  | 'createPending'
  | 'markPosted'
  | 'markReversedByJournalEntry'
>;

type FinanceCashBankTransferBalancePort = Pick<
  FinanceJournalRepository,
  'aggregatePostedAccountBalances'
>;

type FinanceCashBankTransferRoleResolverPort = Pick<
  FinanceAccountRoleResolverService,
  'resolve'
>;

const eligibleSubtypes = new Set<string>(
  FINANCE_CASH_BANK_SUBTYPE_VALUES.filter(
    (subtype) => subtype !== 'marketplace_balance'
  )
);

const marketplaceWithdrawalDestinationSubtypes = new Set([
  'bank',
  'e_wallet',
]);

const getAccountBalance = (
  normalBalance: 'debit' | 'credit',
  debit: number,
  credit: number
) =>
  normalBalance === 'credit'
    ? credit - debit
    : debit - credit;

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
    reversal_journal_entry_id: record.reversal_journal_entry
      ? String(record.reversal_journal_entry)
      : null,
    idempotency_key: record.idempotency_key,
    replayed,
  });

export class FinanceCashBankTransferService {
  private readonly accountRepository: FinanceCashBankTransferAccountPort;
  private readonly journalService: FinanceCashBankTransferJournalPort;
  private readonly transferRepository: FinanceCashBankTransferRepositoryPort;
  private readonly balanceRepository: FinanceCashBankTransferBalancePort;
  private readonly roleResolver: FinanceCashBankTransferRoleResolverPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      accountRepository?: FinanceCashBankTransferAccountPort;
      journalService?: FinanceCashBankTransferJournalPort;
      transferRepository?: FinanceCashBankTransferRepositoryPort;
      balanceRepository?: FinanceCashBankTransferBalancePort;
      roleResolver?: FinanceCashBankTransferRoleResolverPort;
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
    this.balanceRepository =
      dependencies?.balanceRepository ??
      new FinanceJournalRepository(context);
    this.roleResolver =
      dependencies?.roleResolver ??
      new FinanceAccountRoleResolverService(context);
  }

  async post(
    input: FinanceCashBankTransferInputDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceCashBankTransferResponseDTO> {
    return this.postInternal(input, session);
  }

  async postMarketplaceWithdrawal(
    input: FinanceMarketplaceWithdrawalInputDTO | unknown
  ): Promise<FinanceCashBankTransferResponseDTO> {
    const data =
      FinanceMarketplaceWithdrawalInputSchema.parse(input);
    const marketplaceBalanceAccount =
      await this.roleResolver.resolve(
        'marketplace_balance'
      );

    return this.postInternal(
      {
        ...data,
        source_account_id: String(
          marketplaceBalanceAccount._id
        ),
      },
      undefined,
      String(marketplaceBalanceAccount._id)
    );
  }

  private async postInternal(
    input: FinanceCashBankTransferInputDTO | unknown,
    session?: ClientSession,
    marketplaceWithdrawalSourceId?: string
  ): Promise<FinanceCashBankTransferResponseDTO> {
    const data =
      FinanceCashBankTransferInputSchema.parse(input);
    const idempotencyKey = getIdempotencyKey(data);
    const sourceAccount =
      await this.accountRepository.findSelectableById(
        data.source_account_id,
        session
      );
    const destinationAccount =
      await this.accountRepository.findSelectableById(
        data.destination_account_id,
        session
      );

    const isMarketplaceWithdrawal =
      marketplaceWithdrawalSourceId !== undefined;
    const sourceAllowed = sourceAccount
      ? isMarketplaceWithdrawal
        ? sourceAccount.subtype === 'marketplace_balance' &&
          String(sourceAccount._id) ===
            marketplaceWithdrawalSourceId
        : eligibleSubtypes.has(sourceAccount.subtype ?? '')
      : false;
    const destinationAllowed = destinationAccount
      ? isMarketplaceWithdrawal
        ? marketplaceWithdrawalDestinationSubtypes.has(
            destinationAccount.subtype ?? ''
          )
        : eligibleSubtypes.has(
            destinationAccount.subtype ?? ''
          )
      : false;

    if (
      !sourceAccount ||
      !destinationAccount ||
      !sourceAllowed ||
      !destinationAllowed
    ) {
      throw new FinanceDomainError(
        isMarketplaceWithdrawal
          ? 'Penarikan Marketplace harus berasal dari Saldo Marketplace dan menuju akun Bank atau E-wallet yang aktif.'
          : 'Transfer Kas & Bank hanya menerima akun Kas, Bank, atau E-wallet yang aktif dan postable. Gunakan halaman Penarikan Marketplace untuk sumber Saldo Marketplace.',
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

    if (isMarketplaceWithdrawal) {
      if (!marketplaceWithdrawalSourceId) {
        throw new FinanceDomainError(
          'Akun Saldo Marketplace tidak tersedia untuk penarikan.',
          'FINANCE_CASH_BANK_TRANSFER_ACCOUNT_INVALID'
        );
      }

      const journalIdempotencyKey = `finance-cash-bank-transfer-journal:${idempotencyKey}`;
      const existingJournal = this.journalService
        .findByIdempotencyKey
        ? await this.journalService.findByIdempotencyKey(
            journalIdempotencyKey,
            session
          )
        : null;

      if (!existingJournal) {
        const balances =
          await this.balanceRepository.aggregatePostedAccountBalances(
            [marketplaceWithdrawalSourceId],
            session
          );
        const balance = balances.find(
          (entry) =>
            String(entry._id) ===
            marketplaceWithdrawalSourceId
        );
        const availableBalance = getAccountBalance(
          sourceAccount.normal_balance,
          balance?.debit_total ?? 0,
          balance?.credit_total ?? 0
        );

        if (data.amount > availableBalance) {
          throw new FinanceDomainError(
            'Nominal penarikan melebihi saldo Marketplace yang tersedia. Muat ulang halaman untuk melihat saldo terbaru.',
            'FINANCE_MARKETPLACE_WITHDRAWAL_EXCEEDS_BALANCE'
          );
        }
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

  async reverse(
    transferId: string,
    input: FinanceJournalReversalDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceCashBankTransferResponseDTO> {
    const data = FinanceJournalReversalSchema.parse(input);
    const transfer =
      await this.transferRepository.findByTransferId(
        transferId,
        session
      );

    if (!transfer) {
      throw new FinanceDomainError(
        'Transfer Kas & Bank tidak ditemukan.',
        'FINANCE_CASH_BANK_TRANSFER_NOT_FOUND'
      );
    }
    if (transfer.status === 'reversed') {
      return toResponse(transfer, true);
    }
    if (
      transfer.status !== 'posted' ||
      !transfer.journal_entry
    ) {
      throw new FinanceDomainError(
        'Hanya transfer Kas & Bank posted yang dapat direverse.',
        'FINANCE_CASH_BANK_TRANSFER_NOT_REVERSIBLE'
      );
    }

    const reversalResult =
      await this.journalService.reverse(
        String(transfer.journal_entry),
        data,
        session
      );
    const reversed =
      await this.transferRepository.markReversedByJournalEntry(
        String(transfer.journal_entry),
        reversalResult.journal_entry.id,
        session
      );
    if (!reversed) {
      const latest =
        await this.transferRepository.findByTransferId(
          transferId,
          session
        );
      if (latest?.status === 'reversed') {
        return toResponse(latest, true);
      }

      throw new FinanceDomainError(
        'Reversal journal berhasil dibuat tetapi transfer gagal ditandai reversed.',
        'FINANCE_CASH_BANK_TRANSFER_REVERSAL_FINALIZATION_FAILED'
      );
    }

    return toResponse(reversed, reversalResult.replayed);
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
