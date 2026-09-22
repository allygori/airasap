import { Types } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type {
  FinanceCashBankTransferDetailResponseDTO,
  FinanceCashBankTransferListQueryDTO,
  FinanceCashBankTransferListResponseDTO,
  FinanceCashBankTransferSummaryDTO,
} from './finance-cash-bank-transfer.dto';
import {
  FinanceCashBankTransferDetailResponseSchema,
  FinanceCashBankTransferListQuerySchema,
  FinanceCashBankTransferListResponseSchema,
  FinanceCashBankTransferSummarySchema,
} from './finance-cash-bank-transfer.schema';
import {
  FinanceCashBankTransferRepository,
  type FinanceCashBankTransferPersistenceRecord,
} from './finance-cash-bank-transfer.repository';

type FinanceCashBankTransferReadRepositoryPort = Pick<
  FinanceCashBankTransferRepository,
  'list' | 'findByTransferId'
>;

const mapSummary = (
  record: FinanceCashBankTransferPersistenceRecord
): FinanceCashBankTransferSummaryDTO =>
  FinanceCashBankTransferSummarySchema.parse({
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
  });

export class FinanceCashBankTransferReadService {
  private readonly repository: FinanceCashBankTransferReadRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      repository?: FinanceCashBankTransferReadRepositoryPort;
    }
  ) {
    assertFinanceTenant(context);
    this.repository =
      dependencies?.repository ??
      new FinanceCashBankTransferRepository(context);
  }

  async list(
    input: FinanceCashBankTransferListQueryDTO | unknown
  ): Promise<FinanceCashBankTransferListResponseDTO> {
    const query =
      FinanceCashBankTransferListQuerySchema.parse(input);
    const result = await this.repository.list(query);

    return FinanceCashBankTransferListResponseSchema.parse({
      transfers: result.records.map(mapSummary),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / query.limit),
      },
    });
  }

  async get(
    transferId: string
  ): Promise<FinanceCashBankTransferDetailResponseDTO> {
    if (!Types.ObjectId.isValid(transferId)) {
      throw new FinanceDomainError(
        'Transfer Kas & Bank tidak ditemukan.',
        'FINANCE_CASH_BANK_TRANSFER_NOT_FOUND'
      );
    }

    const record =
      await this.repository.findByTransferId(transferId);
    if (!record) {
      throw new FinanceDomainError(
        'Transfer Kas & Bank tidak ditemukan.',
        'FINANCE_CASH_BANK_TRANSFER_NOT_FOUND'
      );
    }

    return FinanceCashBankTransferDetailResponseSchema.parse(
      {
        transfer: mapSummary(record),
      }
    );
  }
}
