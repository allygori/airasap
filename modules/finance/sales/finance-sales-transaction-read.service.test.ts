import { Types } from 'mongoose';
import type { FinanceSalesTransactionRepository } from './finance-sales-transaction.repository';
import type { FinanceSalesTransactionPersistenceRecord } from './finance-sales-transaction.repository';
import { FinanceSalesTransactionReadService } from './finance-sales-transaction-read.service';

const organizationId = '507f1f77bcf86cd799439010';

const makeRecord =
  (): FinanceSalesTransactionPersistenceRecord => ({
    _id: new Types.ObjectId(),
    organization: new Types.ObjectId(organizationId),
    source_order_id: '507f1f77bcf86cd799439099',
    source_order_number: 'SP-1001',
    store_id: '507f1f77bcf86cd799439011',
    platform: 'shopee',
    source_status: 'selesai',
    transaction_date: new Date('2026-09-22T00:00:00.000Z'),
    currency: 'IDR',
    sales_amount: 125000,
    posting_mode: 'manual',
    status: 'blocked',
    idempotency_key:
      'finance-sales:completed:507f1f77bcf86cd799439099',
    blocked_reason: 'Account belum tersedia.',
    journal_entry_id: null,
    source_lines: [
      {
        source_line_id: 'line-1',
        product_reference_id: null,
        product_id: 'SKU-001',
        variation_id: null,
        product_name: 'Produk contoh',
        variation_name: null,
        parent_sku: null,
        child_sku: 'SKU-001',
        quantity: 1,
        returned_quantity: 0,
        final_quantity: 1,
        subtotal: 125000,
        gross_sales: null,
        net_sales: null,
        product_cost: null,
        total_product_cost: null,
      },
    ],
    intent_source_event: 'completed_order',
    intent_transaction_date: new Date(
      '2026-09-22T00:00:00.000Z'
    ),
    intent_description: 'Penjualan shopee SP-1001',
    intent_lines: [
      {
        account_role: 'marketplace_receivable',
        debit: 125000,
        credit: 0,
      },
      {
        account_role: 'sales_revenue',
        debit: 0,
        credit: 125000,
      },
    ],
    inventory_cogs_deferred_reason: 'Ditunda ke Plan 05.',
    inventory_cogs_status: 'deferred',
    inventory_cogs_total_cost: null,
    inventory_movement_ids: [],
    created_at: new Date('2026-09-22T00:00:00.000Z'),
    updated_at: new Date('2026-09-22T00:00:00.000Z'),
  });

type RepositoryPort = Pick<
  FinanceSalesTransactionRepository,
  'list' | 'findTransactionById'
>;

describe('FinanceSalesTransactionReadService', () => {
  it('maps persisted sales work into a safe summary and detail contract', async () => {
    const record = makeRecord();
    const repository: RepositoryPort = {
      list: async () => ({
        records: [record],
        total: 1,
      }),
      findTransactionById: async () => record,
    };
    const service = new FinanceSalesTransactionReadService(
      { organizationId },
      { repository }
    );

    const list = await service.list({ page: 1, limit: 25 });
    const detail = await service.get(String(record._id));

    expect(list.transactions[0]).toMatchObject({
      source_order_number: 'SP-1001',
      status: 'blocked',
      idempotency_key: record.idempotency_key,
    });
    expect(detail.transaction.intent?.lines).toHaveLength(
      2
    );
    expect(detail.transaction.source_lines).toHaveLength(1);
  });

  it('rejects a transaction outside the tenant or with an invalid id', async () => {
    const repository: RepositoryPort = {
      list: async () => ({ records: [], total: 0 }),
      findTransactionById: async () => null,
    };
    const service = new FinanceSalesTransactionReadService(
      { organizationId },
      { repository }
    );

    await expect(
      service.get('invalid')
    ).rejects.toMatchObject({
      code: 'FINANCE_SALES_TRANSACTION_NOT_FOUND',
    });
  });
});
