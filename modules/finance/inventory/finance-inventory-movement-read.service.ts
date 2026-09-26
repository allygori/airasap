import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import {
  FinanceInventoryItemRepository,
  type FinanceInventoryItemPersistenceRecord,
} from './finance-inventory-item.repository';
import {
  FinanceInventoryLocationRepository,
  type FinanceInventoryLocationPersistenceRecord,
} from './finance-inventory-location.repository';
import {
  FinanceInventoryMovementRepository,
  type FinanceInventoryMovementPersistenceRecord,
} from './finance-inventory-movement.repository';
import type {
  FinanceInventoryMovementListQueryDTO,
  FinanceInventoryMovementListResponseDTO,
} from './finance-inventory.dto';
import {
  FinanceInventoryMovementListQuerySchema,
  FinanceInventoryMovementListResponseSchema,
} from './finance-inventory.schema';

type MovementReadPort = Pick<
  FinanceInventoryMovementRepository,
  'listMovements'
>;
type ItemReadPort = Pick<
  FinanceInventoryItemRepository,
  'findByIds'
>;
type LocationReadPort = Pick<
  FinanceInventoryLocationRepository,
  'findByIds'
>;

const toMap = <T extends { _id: { toString(): string } }>(
  records: T[]
) =>
  new Map(
    records.map((record) => [record._id.toString(), record])
  );

const mapMovement = (
  record: FinanceInventoryMovementPersistenceRecord,
  items: Map<string, FinanceInventoryItemPersistenceRecord>,
  locations: Map<
    string,
    FinanceInventoryLocationPersistenceRecord
  >
) => {
  const item = items.get(String(record.inventory_item));
  const location = locations.get(String(record.location));

  return {
    id: String(record._id),
    inventory_item_id: String(record.inventory_item),
    sku: item?.sku ?? null,
    item_name: item?.name ?? null,
    unit: item?.unit ?? null,
    location_id: String(record.location),
    location_name: location?.name ?? null,
    movement_type: record.movement_type,
    adjustment_direction:
      record.adjustment_direction ?? null,
    adjustment_reason: record.adjustment_reason ?? null,
    status: record.status,
    quantity: record.quantity,
    unit_cost: record.unit_cost ?? null,
    total_cost: record.total_cost ?? null,
    occurred_at: record.occurred_at.toISOString(),
    source_type: record.source_type ?? null,
    source_id: record.source_id ?? null,
    reference: record.reference ?? null,
    notes: record.notes ?? null,
    journal_entry_id: record.journal_entry
      ? String(record.journal_entry)
      : null,
  };
};

export class FinanceInventoryMovementReadService {
  private readonly movementRepository: MovementReadPort;
  private readonly itemRepository: ItemReadPort;
  private readonly locationRepository: LocationReadPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      movementRepository?: MovementReadPort;
      itemRepository?: ItemReadPort;
      locationRepository?: LocationReadPort;
    }
  ) {
    assertFinanceTenant(context);
    this.movementRepository =
      dependencies?.movementRepository ??
      new FinanceInventoryMovementRepository(context);
    this.itemRepository =
      dependencies?.itemRepository ??
      new FinanceInventoryItemRepository(context);
    this.locationRepository =
      dependencies?.locationRepository ??
      new FinanceInventoryLocationRepository(context);
  }

  async list(
    input: FinanceInventoryMovementListQueryDTO | unknown
  ): Promise<FinanceInventoryMovementListResponseDTO> {
    const query =
      FinanceInventoryMovementListQuerySchema.parse(input);
    const result =
      await this.movementRepository.listMovements(query);
    const itemIds = [
      ...new Set(
        result.records.map((record) =>
          String(record.inventory_item)
        )
      ),
    ];
    const locationIds = [
      ...new Set(
        result.records.map((record) =>
          String(record.location)
        )
      ),
    ];
    const [items, locations] = await Promise.all([
      this.itemRepository.findByIds(itemIds),
      this.locationRepository.findByIds(locationIds),
    ]);
    const itemMap = toMap(items);
    const locationMap = toMap(locations);

    return FinanceInventoryMovementListResponseSchema.parse(
      {
        items: result.records.map((record) =>
          mapMovement(record, itemMap, locationMap)
        ),
        pagination: {
          page: query.page,
          limit: query.limit,
          total: result.total,
          total_pages: Math.ceil(
            result.total / query.limit
          ),
        },
      }
    );
  }
}
