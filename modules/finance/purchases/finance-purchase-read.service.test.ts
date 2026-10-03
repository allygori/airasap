import { Types } from 'mongoose';
import type {
  FinancePurchasePersistenceRecord,
  FinancePurchaseRepository,
} from './finance-purchase.repository';
import { FinancePurchaseReadService } from './finance-purchase-read.service';

const organizationId = '507f1f77bcf86cd799439010';

const record: FinancePurchasePersistenceRecord = {
  _id: new Types.ObjectId(),
  organization: new Types.ObjectId(organizationId),
  supplier: new Types.ObjectId(),
  supplier_name_snapshot: 'Supplier A',
  supplier_document_reference: 'INV-001',
  transaction_date: new Date('2026-09-22T00:00:00.000Z'),
  payment_timing: 'payable',
  payment_account: null,
  payment_account_code: null,
  payment_account_name: null,
  offset_account: new Types.ObjectId(),
  offset_account_code: '2100',
  offset_account_name: 'Utang Usaha',
  lines: [
    {
      inventory_item: new Types.ObjectId(),
      item_sku: 'SKU-001',
      item_name: 'Produk contoh',
      location: new Types.ObjectId(),
      location_code: 'MAIN',
      location_name: 'Gudang utama',
      quantity: 2,
      unit_cost: 25000,
      line_total: 50000,
    },
  ],
  inventory_movements: [new Types.ObjectId()],
  total_amount: 50000,
  notes: null,
  status: 'posted',
  journal_entry: new Types.ObjectId(),
  idempotency_key: 'purchase-key-1',
};

type RepositoryPort = Pick<
  FinancePurchaseRepository,
  'list' | 'findPurchaseById'
>;

describe('FinancePurchaseReadService', () => {
  it('maps purchase list and detail into stable response contracts', async () => {
    const repository: RepositoryPort = {
      list: async () => ({ records: [record], total: 1 }),
      findPurchaseById: async () => record,
    };
    const service = new FinancePurchaseReadService(
      { organizationId },
      { repository }
    );

    const list = await service.list({ page: 1, limit: 25 });
    const detail = await service.get(String(record._id));

    expect(list.purchases[0]).toMatchObject({
      supplier_name_snapshot: 'Supplier A',
      status: 'posted',
      total_amount: 50000,
    });
    expect(detail.purchase.lines).toHaveLength(1);
    expect(detail.purchase.offset_account?.code).toBe(
      '2100'
    );
  });

  it('rejects an invalid purchase id', async () => {
    const repository: RepositoryPort = {
      list: async () => ({ records: [], total: 0 }),
      findPurchaseById: async () => null,
    };
    const service = new FinancePurchaseReadService(
      { organizationId },
      { repository }
    );

    await expect(
      service.get('invalid')
    ).rejects.toMatchObject({
      code: 'FINANCE_PURCHASE_NOT_FOUND',
    });
  });
});
