import { Types } from 'mongoose';
import type {
  FinanceAccountPersistenceRecord,
  FinanceAccountRepository,
} from '../accounts/finance-account.repository';
import type { FinanceJournalService } from '../journal/finance-journal.service';
import type { FinanceJournalPostResultDTO } from '../journal/finance-journal.dto';
import type { FinanceInventoryItemRepository } from './finance-inventory-item.repository';
import type { FinanceInventoryLocationRepository } from './finance-inventory-location.repository';
import type {
  CreateFinanceInventoryMovementRecord,
  FinanceInventoryMovementRepository,
  FinanceInventoryMovementPersistenceRecord,
} from './finance-inventory-movement.repository';
import type { FinanceInventoryItemPersistenceRecord } from './finance-inventory-item.repository';
import { FinanceInventoryAdjustmentService } from './finance-inventory-adjustment.service';

const organizationId = '507f1f77bcf86cd799439010';
const itemId = new Types.ObjectId();
const locationId = new Types.ObjectId();
const inventoryAccountId = new Types.ObjectId();
const offsetAccountId = new Types.ObjectId();
const journalId = new Types.ObjectId();

const item = (
  overrides: Partial<FinanceInventoryItemPersistenceRecord> = {}
): FinanceInventoryItemPersistenceRecord => ({
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
  ...overrides,
});

const movement = (
  overrides: Partial<FinanceInventoryMovementPersistenceRecord> = {}
): FinanceInventoryMovementPersistenceRecord => ({
  _id: new Types.ObjectId(),
  organization: new Types.ObjectId(organizationId),
  inventory_item: itemId,
  location: locationId,
  movement_type: 'adjustment',
  adjustment_direction: 'increase',
  adjustment_reason: 'stock_count',
  quantity: 2,
  unit_cost: 100000,
  total_cost: 200000,
  occurred_at: new Date('2026-09-22T00:00:00.000Z'),
  source_type: 'finance_inventory_adjustment',
  source_id: 'source',
  offset_account: offsetAccountId,
  idempotency_key: 'adjustment-1',
  status: 'posted',
  journal_entry: journalId,
  ...overrides,
});

const account = (
  id: Types.ObjectId,
  overrides: Partial<{
    type: string;
    subtype: string;
  }> = {}
): FinanceAccountPersistenceRecord => ({
  _id: id,
  organization: new Types.ObjectId(organizationId),
  code: id === inventoryAccountId ? '1310' : '6900',
  name:
    id === inventoryAccountId
      ? 'Persediaan'
      : 'Beban selisih',
  type: id === inventoryAccountId ? 'asset' : 'expense',
  subtype:
    id === inventoryAccountId
      ? 'merchandise_inventory'
      : 'inventory_shrinkage',
  parent_account: null,
  normal_balance:
    id === inventoryAccountId ? 'debit' : 'debit',
  is_system: false,
  is_postable: true,
  is_active: true,
  display_order: 1,
  ...overrides,
});

type ItemPort = Pick<
  FinanceInventoryItemRepository,
  'findActiveById'
>;
type LocationPort = Pick<
  FinanceInventoryLocationRepository,
  'findActiveById'
>;
type MovementPort = Pick<
  FinanceInventoryMovementRepository,
  | 'findMovementById'
  | 'findByIdempotencyKey'
  | 'createDraft'
  | 'getPostedBalance'
  | 'markPosted'
>;
type AccountPort = Pick<
  FinanceAccountRepository,
  | 'findSelectableById'
  | 'findSelectableBySubtype'
  | 'findSelectableByCode'
>;
type JournalPort = Pick<
  FinanceJournalService,
  'postOperational'
>;

const makeService = (options?: {
  itemRepository?: ItemPort;
  locationRepository?: LocationPort;
  movementRepository?: MovementPort;
  accountRepository?: AccountPort;
  journalService?: JournalPort;
}) => {
  const created = movement({
    status: 'draft',
    journal_entry: undefined,
  });
  const journalResult = {
    replayed: false,
    journal_entry: { id: String(journalId) },
  } as FinanceJournalPostResultDTO;
  const defaultMovementPort: MovementPort = {
    findMovementById: async () => created,
    findByIdempotencyKey: async () => null,
    createDraft: async (
      data: CreateFinanceInventoryMovementRecord
    ) => ({
      ...created,
      ...data,
      _id: created._id,
      organization: new Types.ObjectId(organizationId),
    }),
    getPostedBalance: async () => ({
      _id: itemId,
      inbound_quantity: 10,
      outbound_quantity: 2,
      inbound_value: 1000000,
      outbound_value: 200000,
      location_count: 1,
      unresolved_movement_count: 0,
      missing_cost_movement_count: 0,
    }),
    markPosted: async (_id, journalEntryId, costs) =>
      movement({
        unit_cost: costs?.unit_cost,
        total_cost: costs?.total_cost,
        journal_entry: journalEntryId
          ? journalId
          : undefined,
      }),
  };

  return new FinanceInventoryAdjustmentService(
    { organizationId },
    {
      itemRepository: options?.itemRepository ?? {
        findActiveById: async () => item(),
      },
      locationRepository: options?.locationRepository ?? {
        findActiveById: async () => ({
          _id: locationId,
          organization: new Types.ObjectId(organizationId),
          code: 'WH-01',
          name: 'Gudang utama',
          is_active: true,
        }),
      },
      movementRepository:
        options?.movementRepository ?? defaultMovementPort,
      accountRepository: options?.accountRepository ?? {
        findSelectableById: async (id: string) =>
          id === String(inventoryAccountId)
            ? account(inventoryAccountId)
            : id === String(offsetAccountId)
              ? account(offsetAccountId)
              : null,
        findSelectableBySubtype: async (subtype: string) =>
          subtype === 'inventory_shrinkage'
            ? account(offsetAccountId)
            : null,
        findSelectableByCode: async () => null,
      },
      journalService: options?.journalService ?? {
        postOperational: async () => journalResult,
      },
    }
  );
};

describe('FinanceInventoryAdjustmentService', () => {
  it('posts a value-tracked increase with a balanced journal intent', async () => {
    const postOperational = jest.fn(
      async () =>
        ({
          replayed: false,
          journal_entry: { id: String(journalId) },
        }) as FinanceJournalPostResultDTO
    );
    const markPosted = jest.fn(async () => movement());

    const result = await makeService({
      movementRepository: {
        ...({} as MovementPort),
        findMovementById: async () => null,
        findByIdempotencyKey: async () => null,
        createDraft: async (data) => ({
          ...movement({
            status: 'draft',
            journal_entry: undefined,
          }),
          ...data,
          organization: new Types.ObjectId(organizationId),
        }),
        getPostedBalance: async () => ({
          _id: itemId,
          inbound_quantity: 10,
          outbound_quantity: 2,
          inbound_value: 1000000,
          outbound_value: 200000,
          location_count: 1,
          unresolved_movement_count: 0,
          missing_cost_movement_count: 0,
        }),
        markPosted,
      },
      journalService: { postOperational },
    }).post({
      item_id: String(itemId),
      location_id: String(locationId),
      direction: 'increase',
      reason: 'stock_count',
      quantity: 2,
      unit_cost: 100000,
      transaction_date: '2026-09-22T00:00:00.000Z',
      idempotency_key: 'increase-1',
    });

    expect(result).toMatchObject({
      status: 'posted',
      quantity: 2,
      total_cost: 200000,
      journal_entry_id: String(journalId),
    });
    expect(postOperational).toHaveBeenCalledWith(
      expect.objectContaining({
        source_type: 'inventory_adjustment',
        lines: [
          expect.objectContaining({
            account_id: String(inventoryAccountId),
            debit: 200000,
            credit: 0,
          }),
          expect.objectContaining({
            account_id: String(offsetAccountId),
            debit: 0,
            credit: 200000,
          }),
        ],
      }),
      undefined
    );
    expect(markPosted).toHaveBeenCalled();
  });

  it('rejects a decrease that would create negative stock', async () => {
    const postOperational = jest.fn();
    const service = makeService({
      movementRepository: {
        ...({} as MovementPort),
        findMovementById: async () => null,
        findByIdempotencyKey: async () => null,
        createDraft: async () =>
          movement({ status: 'draft' }),
        getPostedBalance: async () => ({
          _id: itemId,
          inbound_quantity: 1,
          outbound_quantity: 1,
          inbound_value: 100000,
          outbound_value: 100000,
          location_count: 1,
          unresolved_movement_count: 0,
          missing_cost_movement_count: 0,
        }),
        markPosted: async () => movement(),
      },
      journalService: { postOperational },
    });

    await expect(
      service.post({
        item_id: String(itemId),
        location_id: String(locationId),
        direction: 'decrease',
        reason: 'loss',
        quantity: 1,
        unit_cost: 100000,
        idempotency_key: 'decrease-1',
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_INVENTORY_NEGATIVE_STOCK',
    });
    expect(postOperational).not.toHaveBeenCalled();
  });

  it('posts quantity-only adjustments without a journal', async () => {
    const postOperational = jest.fn();
    const result = await makeService({
      itemRepository: {
        findActiveById: async () =>
          item({ track_value: false }),
      },
      journalService: { postOperational },
    }).post({
      item_id: String(itemId),
      location_id: String(locationId),
      direction: 'increase',
      reason: 'stock_count',
      quantity: 2,
      idempotency_key: 'quantity-only-1',
    });

    expect(result).toMatchObject({
      status: 'posted',
      total_cost: null,
      journal_entry_id: null,
    });
    expect(postOperational).not.toHaveBeenCalled();
  });

  it('replays an existing posted adjustment by idempotency key', async () => {
    const findByIdempotencyKey = jest.fn(async () =>
      movement({
        idempotency_key: 'replay-1',
        status: 'posted',
      })
    );
    const postOperational = jest.fn();

    const result = await makeService({
      movementRepository: {
        ...({} as MovementPort),
        findMovementById: async () => null,
        findByIdempotencyKey,
        createDraft: async () => movement(),
        getPostedBalance: async () => null,
        markPosted: async () => movement(),
      },
      journalService: { postOperational },
    }).post({
      item_id: String(itemId),
      location_id: String(locationId),
      direction: 'increase',
      reason: 'stock_count',
      quantity: 2,
      unit_cost: 100000,
      idempotency_key: 'replay-1',
    });

    expect(result.status).toBe('posted');
    expect(postOperational).not.toHaveBeenCalled();
  });
});
