import { Types } from 'mongoose';
import type { FinanceInventoryItemRepository } from './finance-inventory-item.repository';
import type { FinanceInventoryLocationRepository } from './finance-inventory-location.repository';
import type {
  FinanceInventoryMovementPersistenceRecord,
  FinanceInventoryMovementRepository,
} from './finance-inventory-movement.repository';
import { FinanceInventoryMovementReadService } from './finance-inventory-movement-read.service';

const organizationId = '507f1f77bcf86cd799439010';
const itemId = new Types.ObjectId();
const locationId = new Types.ObjectId();
const movementId = new Types.ObjectId();
const journalId = new Types.ObjectId();

const movement: FinanceInventoryMovementPersistenceRecord =
  {
    _id: movementId,
    organization: new Types.ObjectId(organizationId),
    inventory_item: itemId,
    location: locationId,
    movement_type: 'opening_balance',
    quantity: 50,
    unit_cost: 50000,
    total_cost: 2500000,
    occurred_at: new Date('2026-04-01T00:00:00.000Z'),
    source_type: 'opening_balance',
    source_id: '507f1f77bcf86cd799439011',
    reference: 'Saldo awal Finance',
    notes: 'Saldo awal SKU-01',
    status: 'posted',
    journal_entry: journalId,
  };

type MovementPort = Pick<
  FinanceInventoryMovementRepository,
  'listMovements'
>;
type ItemPort = Pick<
  FinanceInventoryItemRepository,
  'findByIds'
>;
type LocationPort = Pick<
  FinanceInventoryLocationRepository,
  'findByIds'
>;

const makeService = (overrides?: {
  movementRepository?: MovementPort;
  itemRepository?: ItemPort;
  locationRepository?: LocationPort;
}) =>
  new FinanceInventoryMovementReadService(
    { organizationId },
    {
      movementRepository: overrides?.movementRepository ?? {
        listMovements: async () => ({
          records: [movement],
          total: 1,
        }),
      },
      itemRepository: overrides?.itemRepository ?? {
        findByIds: async () => [
          {
            _id: itemId,
            organization: new Types.ObjectId(
              organizationId
            ),
            sku: 'SKU-01',
            name: 'Produk contoh',
            item_type: 'merchandise',
            unit: 'pcs',
            track_quantity: true,
            track_value: true,
            is_active: true,
          },
        ],
      },
      locationRepository: overrides?.locationRepository ?? {
        findByIds: async () => [
          {
            _id: locationId,
            organization: new Types.ObjectId(
              organizationId
            ),
            code: 'MAIN',
            name: 'Gudang Utama',
            is_active: true,
          },
        ],
      },
    }
  );

describe('FinanceInventoryMovementReadService', () => {
  it('joins posted opening-balance movements with item and location details', async () => {
    const result = await makeService().list({});

    expect(result.items[0]).toMatchObject({
      id: String(movementId),
      movement_type: 'opening_balance',
      status: 'posted',
      quantity: 50,
      unit_cost: 50000,
      total_cost: 2500000,
      sku: 'SKU-01',
      item_name: 'Produk contoh',
      unit: 'pcs',
      location_name: 'Gudang Utama',
      reference: 'Saldo awal Finance',
      journal_entry_id: String(journalId),
    });
    expect(result.pagination).toMatchObject({
      page: 1,
      limit: 25,
      total: 1,
      total_pages: 1,
    });
  });

  it('keeps movements visible when their item or location record is missing', async () => {
    const result = await makeService({
      itemRepository: { findByIds: async () => [] },
      locationRepository: { findByIds: async () => [] },
    }).list({});

    expect(result.items[0]).toMatchObject({
      item_name: null,
      sku: null,
      location_name: null,
    });
  });

  it('validates and applies bounded pagination and supported filters', async () => {
    const listMovements = jest.fn(async () => ({
      records: [],
      total: 0,
    }));
    await makeService({
      movementRepository: { listMovements },
    }).list({
      page: 2,
      limit: 50,
      status: 'all',
      movement_type: 'purchase',
    });

    expect(listMovements).toHaveBeenCalledWith({
      page: 2,
      limit: 50,
      movement_type: 'purchase',
      status: 'all',
    });
    await expect(
      makeService().list({ limit: 101 })
    ).rejects.toHaveProperty('name', 'ZodError');
  });
});
