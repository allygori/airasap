import { Types } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import type {
  FinanceSalesTransactionDetailResponseDTO,
  FinanceSalesTransactionListQueryDTO,
  FinanceSalesTransactionListResponseDTO,
  FinanceSalesTransactionSummaryDTO,
} from './finance-sales.dto';
import {
  FinanceSalesTransactionDetailResponseSchema,
  FinanceSalesTransactionListQuerySchema,
  FinanceSalesTransactionListResponseSchema,
  FinanceSalesTransactionSummarySchema,
  FinanceSalesPostingIntentSchema,
} from './finance-sales.schema';
import {
  FinanceSalesTransactionRepository,
  type FinanceSalesTransactionPersistenceRecord,
} from './finance-sales-transaction.repository';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';

const toIsoString = (value: Date | null | undefined) =>
  (value ?? new Date(0)).toISOString();

const mapSummary = (
  record: FinanceSalesTransactionPersistenceRecord
): FinanceSalesTransactionSummaryDTO =>
  FinanceSalesTransactionSummarySchema.parse({
    id: String(record._id),
    source_order_id: record.source_order_id,
    source_order_number: record.source_order_number,
    store_id: record.store_id,
    platform: record.platform,
    source_status: record.source_status,
    transaction_date: record.transaction_date
      ? record.transaction_date.toISOString()
      : null,
    currency: record.currency,
    sales_amount: record.sales_amount,
    posting_mode: record.posting_mode,
    status: record.status,
    idempotency_key: record.idempotency_key,
    blocked_reason: record.blocked_reason,
    journal_entry_id: record.journal_entry_id
      ? String(record.journal_entry_id)
      : null,
    inventory_cogs_status:
      record.inventory_cogs_status ?? 'deferred',
    inventory_cogs_deferred_reason:
      record.inventory_cogs_deferred_reason ?? null,
    inventory_cogs_total_cost:
      record.inventory_cogs_total_cost ?? null,
    inventory_cogs_journal_entry_id:
      record.inventory_cogs_journal_entry_id
        ? String(record.inventory_cogs_journal_entry_id)
        : null,
    created_at: toIsoString(record.created_at),
    updated_at: toIsoString(record.updated_at),
  });

const mapIntent = (
  record: FinanceSalesTransactionPersistenceRecord
) => {
  if (
    !record.intent_source_event ||
    !record.intent_transaction_date ||
    !record.intent_description ||
    record.intent_lines.length === 0
  ) {
    return null;
  }

  return FinanceSalesPostingIntentSchema.parse({
    source_order_id: record.source_order_id,
    source_order_number: record.source_order_number,
    source_event: record.intent_source_event,
    transaction_date:
      record.intent_transaction_date.toISOString(),
    currency: record.currency,
    description: record.intent_description,
    idempotency_key: record.idempotency_key,
    lines: record.intent_lines,
    inventory_cogs: {
      status: record.inventory_cogs_status ?? 'deferred',
      reason:
        record.inventory_cogs_status === 'posted'
          ? null
          : (record.inventory_cogs_deferred_reason ??
            'HPP belum diposting.'),
    },
  });
};

type FinanceSalesTransactionReadRepositoryPort = Pick<
  FinanceSalesTransactionRepository,
  'list' | 'findTransactionById'
>;

export class FinanceSalesTransactionReadService {
  private readonly repository: FinanceSalesTransactionReadRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      repository?: FinanceSalesTransactionReadRepositoryPort;
    }
  ) {
    assertFinanceTenant(context);
    this.repository =
      dependencies?.repository ??
      new FinanceSalesTransactionRepository(context);
  }

  async list(
    input: FinanceSalesTransactionListQueryDTO | unknown
  ): Promise<FinanceSalesTransactionListResponseDTO> {
    const query =
      FinanceSalesTransactionListQuerySchema.parse(input);
    const result = await this.repository.list(query);

    return FinanceSalesTransactionListResponseSchema.parse({
      transactions: result.records.map(mapSummary),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / query.limit),
      },
    });
  }

  async get(
    transactionId: string
  ): Promise<FinanceSalesTransactionDetailResponseDTO> {
    if (!Types.ObjectId.isValid(transactionId)) {
      throw new FinanceDomainError(
        'Transaksi sales Finance tidak ditemukan.',
        'FINANCE_SALES_TRANSACTION_NOT_FOUND'
      );
    }

    const record =
      await this.repository.findTransactionById(
        transactionId
      );
    if (!record) {
      throw new FinanceDomainError(
        'Transaksi sales Finance tidak ditemukan.',
        'FINANCE_SALES_TRANSACTION_NOT_FOUND'
      );
    }

    return FinanceSalesTransactionDetailResponseSchema.parse(
      {
        transaction: {
          ...mapSummary(record),
          source_lines: record.source_lines,
          intent: mapIntent(record),
        },
      }
    );
  }
}
