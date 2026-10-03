import { Types } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type {
  FinancePurchaseDetailResponseDTO,
  FinancePurchaseListQueryDTO,
  FinancePurchaseListResponseDTO,
  FinancePurchaseSummaryDTO,
} from './finance-purchase.dto';
import {
  FinancePurchaseDetailResponseSchema,
  FinancePurchaseListQuerySchema,
  FinancePurchaseListResponseSchema,
  FinancePurchaseSummarySchema,
} from './finance-purchase.schema';
import {
  FinancePurchaseRepository,
  type FinancePurchasePersistenceRecord,
} from './finance-purchase.repository';

type FinancePurchaseReadRepositoryPort = Pick<
  FinancePurchaseRepository,
  'list' | 'findPurchaseById'
>;

const mapSummary = (
  record: FinancePurchasePersistenceRecord
): FinancePurchaseSummaryDTO =>
  FinancePurchaseSummarySchema.parse({
    purchase_id: String(record._id),
    supplier_name_snapshot:
      record.supplier_name_snapshot ?? null,
    supplier_document_reference:
      record.supplier_document_reference ?? null,
    transaction_date: record.transaction_date.toISOString(),
    payment_timing: record.payment_timing,
    payment_account:
      record.payment_account &&
      record.payment_account_code &&
      record.payment_account_name
        ? {
            id: String(record.payment_account),
            code: record.payment_account_code,
            name: record.payment_account_name,
          }
        : null,
    offset_account:
      record.offset_account &&
      record.offset_account_code &&
      record.offset_account_name
        ? {
            id: String(record.offset_account),
            code: record.offset_account_code,
            name: record.offset_account_name,
          }
        : null,
    inventory_movement_ids: record.inventory_movements.map(
      (movementId) => String(movementId)
    ),
    total_amount: record.total_amount,
    notes: record.notes ?? null,
    status: record.status,
    journal_entry_id: record.journal_entry
      ? String(record.journal_entry)
      : null,
    idempotency_key: record.idempotency_key,
  });

export class FinancePurchaseReadService {
  private readonly repository: FinancePurchaseReadRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      repository?: FinancePurchaseReadRepositoryPort;
    }
  ) {
    assertFinanceTenant(context);
    this.repository =
      dependencies?.repository ??
      new FinancePurchaseRepository(context);
  }

  async list(
    input: FinancePurchaseListQueryDTO | unknown
  ): Promise<FinancePurchaseListResponseDTO> {
    const query =
      FinancePurchaseListQuerySchema.parse(input);
    const result = await this.repository.list(query);

    return FinancePurchaseListResponseSchema.parse({
      purchases: result.records.map(mapSummary),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / query.limit),
      },
    });
  }

  async get(
    purchaseId: string
  ): Promise<FinancePurchaseDetailResponseDTO> {
    if (!Types.ObjectId.isValid(purchaseId)) {
      throw new FinanceDomainError(
        'Purchase Finance tidak ditemukan.',
        'FINANCE_PURCHASE_NOT_FOUND'
      );
    }

    const record =
      await this.repository.findPurchaseById(purchaseId);
    if (!record) {
      throw new FinanceDomainError(
        'Purchase Finance tidak ditemukan.',
        'FINANCE_PURCHASE_NOT_FOUND'
      );
    }

    return FinancePurchaseDetailResponseSchema.parse({
      purchase: {
        ...mapSummary(record),
        lines: record.lines.map((line) => ({
          item_id: String(line.inventory_item),
          item_sku: line.item_sku,
          item_name: line.item_name,
          location_id: String(line.location),
          location_code: line.location_code,
          location_name: line.location_name,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          line_total: line.line_total,
        })),
        replayed: false,
      },
    });
  }
}
