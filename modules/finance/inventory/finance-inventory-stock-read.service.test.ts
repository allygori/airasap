import { Types } from 'mongoose';
import type { FinanceInventoryItemRepository } from './finance-inventory-item.repository';
import type { FinanceInventoryLocationRepository } from './finance-inventory-location.repository';
import type { FinanceInventoryMappingRepository } from './finance-inventory-mapping.repository';
import type { FinanceInventoryBalancePersistenceRecord } from './finance-inventory-movement.repository';
import type { FinanceInventoryMovementRepository } from './finance-inventory-movement.repository';
import type { FinanceInventoryItemPersistenceRecord } from './finance-inventory-item.repository';
import { FinanceInventoryStockReadService } from './finance-inventory-stock-read.service';

const organizationId = '507f1f77bcf86cd799439010';
const itemId = new Types.ObjectId();
const locationId = new Types.ObjectId();

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
  ...overrides,
});

const balance = (
  overrides: Partial<FinanceInventoryBalancePersistenceRecord> = {}
): FinanceInventoryBalancePersistenceRecord => ({
  _id: itemId,
  inbound_quantity: 10,
  outbound_quantity: 2,
  inbound_value: 1000000,
  outbound_value: 200000,
  location_count: 2,
  unresolved_movement_count: 0,
  missing_cost_movement_count: 0,
  ...overrides,
});

type ItemPort = Pick<
  FinanceInventoryItemRepository,
  'listActive'
>;
type LocationPort = Pick<
  FinanceInventoryLocationRepository,
  'findActiveById'
>;
type MovementPort = Pick<
  FinanceInventoryMovementRepository,
  'aggregatePostedBalances'
>;
type MappingPort = Pick<
  FinanceInventoryMappingRepository,
  'countActiveByInventoryItemIds'
>;

const makeService = (options?: {
  itemRepository?: ItemPort;
  locationRepository?: LocationPort;
  movementRepository?: MovementPort;
  mappingRepository?: MappingPort;
}) =>
  new FinanceInventoryStockReadService(
    { organizationId },
    {
      itemRepository: options?.itemRepository ?? {
        listActive: async () => ({
          records: [item()],
          total: 1,
        }),
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
      movementRepository: options?.movementRepository ?? {
        aggregatePostedBalances: async () => [balance()],
      },
      mappingRepository: options?.mappingRepository ?? {
        countActiveByInventoryItemIds: async () => [
          { _id: itemId, count: 1 },
        ],
      },
    }
  );

describe('FinanceInventoryStockReadService', () => {
  it('projects posted movements into quantity, value, and mapping visibility', async () => {
    const result = await makeService().list({
      page: 1,
      limit: 25,
    });

    expect(result.items[0]).toMatchObject({
      sku: 'SKU-001',
      quantity_on_hand: 8,
      value_on_hand: 800000,
      average_unit_cost: 100000,
      mapping_count: 1,
      location_count: 2,
      status: 'ready',
    });
    expect(result.source.collection).toBe(
      'finance_inventory_movements'
    );
  });

  it('marks ambiguous cost or negative quantity as needing review', async () => {
    const result = await makeService({
      movementRepository: {
        aggregatePostedBalances: async () => [
          balance({
            inbound_quantity: 1,
            outbound_quantity: 3,
            missing_cost_movement_count: 1,
          }),
        ],
      },
    }).list({ page: 1, limit: 25 });

    expect(result.items[0]).toMatchObject({
      quantity_on_hand: -2,
      status: 'needs_review',
      missing_cost_movement_count: 1,
    });
  });

  it('does not expose a value when the item is not value-tracked', async () => {
    const result = await makeService({
      itemRepository: {
        listActive: async () => ({
          records: [item({ track_value: false })],
          total: 1,
        }),
      },
    }).list({ page: 1, limit: 25 });

    expect(result.items[0]).toMatchObject({
      quantity_on_hand: 8,
      value_on_hand: null,
      average_unit_cost: null,
      status: 'value_not_tracked',
    });
  });

  it('requires an active tenant-scoped location when filtering by location', async () => {
    const service = makeService({
      locationRepository: {
        findActiveById: async () => null,
      },
    });

    await expect(
      service.list({
        page: 1,
        limit: 25,
        location_id: String(locationId),
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_INVENTORY_LOCATION_NOT_FOUND',
    });
  });
});
