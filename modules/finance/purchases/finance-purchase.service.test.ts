import { Types } from 'mongoose';
import type { FinanceAccountPersistenceRecord } from '../accounts/finance-account.repository';
import type { FinanceJournalService } from '../journal/finance-journal.service';
import type { FinanceInventoryItemPersistenceRecord } from '../inventory/finance-inventory-item.repository';
import type { FinanceInventoryLocationPersistenceRecord } from '../inventory/finance-inventory-location.repository';
import type {
  FinanceInventoryMovementPersistenceRecord,
  FinanceInventoryMovementRepository,
} from '../inventory/finance-inventory-movement.repository';
import { FinanceDomainError } from '../finance.error';
import type {
  FinancePurchasePersistenceRecord,
  FinancePurchaseRepository,
} from './finance-purchase.repository';
import { FinancePurchaseService } from './finance-purchase.service';

const organizationId = '507f1f77bcf86cd799439010';
const itemId = new Types.ObjectId();
const locationId = new Types.ObjectId();
const paymentAccountId = new Types.ObjectId();
const payableAccountId = new Types.ObjectId();
const supplierId = new Types.ObjectId();
const inventoryAccountId = new Types.ObjectId();
const purchaseId = new Types.ObjectId();
const journalId = new Types.ObjectId();
const movementId = new Types.ObjectId();

const makeAccount = (
  id: Types.ObjectId,
  code: string,
  name: string,
  type: string,
  subtype: string
): FinanceAccountPersistenceRecord => ({
  _id: id,
  organization: new Types.ObjectId(organizationId),
  code,
  name,
  type,
  subtype,
  parent_account: null,
  normal_balance: type === 'liability' ? 'credit' : 'debit',
  is_system: false,
  is_postable: true,
  is_active: true,
  display_order: 1,
});

const item: FinanceInventoryItemPersistenceRecord = {
  _id: itemId,
  organization: new Types.ObjectId(organizationId),
  sku: 'SKU-001',
  name: 'Produk contoh',
  item_type: 'merchandise',
  unit: 'pcs',
  track_quantity: true,
  track_value: true,
  is_active: true,
  inventory_account: inventoryAccountId,
};

const location: FinanceInventoryLocationPersistenceRecord =
  {
    _id: locationId,
    organization: new Types.ObjectId(organizationId),
    code: 'MAIN',
    name: 'Gudang utama',
    is_active: true,
  };

const paymentAccount = makeAccount(
  paymentAccountId,
  '1120',
  'Bank Operasional',
  'asset',
  'bank'
);
const payableAccount = makeAccount(
  payableAccountId,
  '2100',
  'Utang Usaha',
  'liability',
  'accounts_payable'
);
const inventoryAccount = makeAccount(
  inventoryAccountId,
  '1310',
  'Persediaan Barang Dagang',
  'asset',
  'merchandise_inventory'
);

const makeJournalResult = () => ({
  journal_entry: {
    id: String(journalId),
    entry_number: 'FIN-PURCHASE-1',
    transaction_date: '2026-09-22T00:00:00.000Z',
    posting_date: '2026-09-22T00:00:00.000Z',
    period: '2026-09',
    currency: 'IDR',
    description: 'Pembelian dari Supplier A',
    source_type: 'purchase',
    source_id: String(purchaseId),
    source_event: 'purchase_posted',
    idempotency_key: `finance-purchase-journal:${String(purchaseId)}`,
    status: 'posted' as const,
    posted_at: '2026-09-22T00:00:00.000Z',
    posted_by: null,
    reversal_of: null,
    lines: [],
  },
  replayed: false,
});

const makeMovement = (
  data: Partial<FinanceInventoryMovementPersistenceRecord> = {}
): FinanceInventoryMovementPersistenceRecord => ({
  _id: movementId,
  organization: new Types.ObjectId(organizationId),
  inventory_item: itemId,
  location: locationId,
  movement_type: 'purchase',
  quantity: 2,
  unit_cost: 25000,
  total_cost: 50000,
  occurred_at: new Date('2026-09-22T00:00:00.000Z'),
  source_type: 'finance_purchase',
  source_id: String(purchaseId),
  idempotency_key: `finance-purchase:${String(purchaseId)}:line:0`,
  status: 'posted',
  journal_entry: journalId,
  ...data,
});

const makeDependencies = () => {
  let current: FinancePurchasePersistenceRecord | null =
    null;
  const movements = new Map<
    string,
    FinanceInventoryMovementPersistenceRecord
  >();
  const journalService: Pick<
    FinanceJournalService,
    'postOperational'
  > = {
    postOperational: jest.fn(async () =>
      makeJournalResult()
    ),
  };
  const purchaseRepository: Pick<
    FinancePurchaseRepository,
    | 'findByIdempotencyKey'
    | 'findPurchaseById'
    | 'createDraft'
    | 'markPosted'
  > = {
    findByIdempotencyKey: async () => current,
    findPurchaseById: async () => current,
    createDraft: async (data) => {
      current = {
        ...data,
        _id: purchaseId,
        organization: new Types.ObjectId(organizationId),
      };
      return current;
    },
    markPosted: async (
      _id,
      journalEntryId,
      offsetAccountId,
      offsetAccountCode,
      offsetAccountName,
      inventoryMovementIds
    ) => {
      if (!current) return null;
      current = {
        ...current,
        status: 'posted',
        journal_entry: new Types.ObjectId(journalEntryId),
        offset_account: new Types.ObjectId(offsetAccountId),
        offset_account_code: offsetAccountCode,
        offset_account_name: offsetAccountName,
        inventory_movements: inventoryMovementIds.map(
          (id) => new Types.ObjectId(id)
        ),
      };
      return current;
    },
  };
  const movementRepository: Pick<
    FinanceInventoryMovementRepository,
    'findByIdempotencyKey' | 'createPosted'
  > = {
    findByIdempotencyKey: async (key) =>
      movements.get(key) ?? null,
    createPosted: async (data) => {
      const created = makeMovement(data);
      movements.set(data.idempotency_key!, created);
      return created;
    },
  };
  const accountRepository = {
    findSelectableById: async (id: string) =>
      id === String(paymentAccountId)
        ? paymentAccount
        : id === String(inventoryAccountId)
          ? inventoryAccount
          : null,
    findSelectableBySubtype: async (subtype: string) =>
      subtype === 'accounts_payable'
        ? payableAccount
        : subtype === 'merchandise_inventory'
          ? inventoryAccount
          : null,
    findSelectableByCode: async (code: string) =>
      code === '2100' ? payableAccount : null,
  };

  return {
    supplierService: {
      findActiveById: async () => ({
        _id: supplierId,
        name: 'Supplier A',
      }),
    },
    itemRepository: {
      findActiveById: async () => item,
    },
    locationRepository: {
      findActiveById: async () => location,
    },
    accountRepository,
    movementRepository,
    journalService,
    purchaseRepository,
    getCurrent: () => current,
  };
};

const input = {
  supplier_id: String(supplierId),
  supplier_document_reference: 'INV-001',
  transaction_date: '2026-09-22T00:00:00.000Z',
  payment_timing: 'paid' as const,
  payment_account_id: String(paymentAccountId),
  lines: [
    {
      item_id: String(itemId),
      location_id: String(locationId),
      quantity: 2,
      unit_cost: 25000,
    },
  ],
  idempotency_key: 'purchase-key-1',
};

describe('FinancePurchaseService', () => {
  it('keeps draft side-effect free and posts inventory plus a balanced journal', async () => {
    const dependencies = makeDependencies();
    const service = new FinancePurchaseService(
      { organizationId },
      dependencies
    );

    const draft = await service.createDraft(input);

    expect(draft).toMatchObject({
      status: 'draft',
      total_amount: 50000,
      journal_entry_id: null,
      inventory_movement_ids: [],
    });
    expect(
      dependencies.journalService.postOperational
    ).not.toHaveBeenCalled();

    const posted = await service.post(draft.purchase_id);

    expect(posted).toMatchObject({
      status: 'posted',
      journal_entry_id: String(journalId),
      inventory_movement_ids: [String(movementId)],
      offset_account: {
        code: '1120',
        name: 'Bank Operasional',
      },
    });
    expect(
      dependencies.journalService.postOperational
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        source_type: 'purchase',
        lines: [
          expect.objectContaining({
            account_id: String(inventoryAccountId),
            debit: 50000,
            credit: 0,
          }),
          expect.objectContaining({
            account_id: String(paymentAccountId),
            debit: 0,
            credit: 50000,
          }),
        ],
      }),
      undefined
    );
  });

  it('uses payable as the credit account when payment timing is payable', async () => {
    const dependencies = makeDependencies();
    const service = new FinancePurchaseService(
      { organizationId },
      dependencies
    );

    const draft = await service.createDraft({
      ...input,
      payment_timing: 'payable',
      payment_account_id: undefined,
      idempotency_key: 'purchase-key-payable',
    });
    const posted = await service.post(draft.purchase_id);

    expect(posted.offset_account).toMatchObject({
      code: '2100',
      name: 'Utang Usaha',
    });
    expect(
      dependencies.journalService.postOperational
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        lines: expect.arrayContaining([
          expect.objectContaining({
            account_id: String(payableAccountId),
            credit: 50000,
          }),
        ]),
      }),
      undefined
    );
  });

  it('replays an identical draft request without creating a duplicate', async () => {
    const dependencies = makeDependencies();
    const service = new FinancePurchaseService(
      { organizationId },
      dependencies
    );

    await service.createDraft(input);
    const replay = await service.createDraft(input);

    expect(replay.replayed).toBe(true);
    expect(dependencies.getCurrent()?.status).toBe('draft');
  });

  it('rejects an inventory item that does not track value', async () => {
    const dependencies = makeDependencies();
    dependencies.itemRepository.findActiveById =
      async () => ({
        ...item,
        track_value: false,
      });
    const service = new FinancePurchaseService(
      { organizationId },
      dependencies
    );

    await expect(
      service.createDraft(input)
    ).rejects.toMatchObject<Partial<FinanceDomainError>>({
      code: 'FINANCE_PURCHASE_INVENTORY_TRACKING_REQUIRED',
    });
  });
});
