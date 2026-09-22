import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type {
  FinanceInventoryBalanceDTO,
  FinanceInventoryStockQueryDTO,
  FinanceInventoryStockResponseDTO,
} from './finance-inventory.dto';
import {
  FinanceInventoryStockQuerySchema,
  FinanceInventoryStockResponseSchema,
} from './finance-inventory.schema';
import {
  FinanceInventoryItemRepository,
  type FinanceInventoryItemPersistenceRecord,
} from './finance-inventory-item.repository';
import { FinanceInventoryLocationRepository } from './finance-inventory-location.repository';
import {
  FinanceInventoryMovementRepository,
  type FinanceInventoryBalancePersistenceRecord,
} from './finance-inventory-movement.repository';
import { FinanceInventoryMappingRepository } from './finance-inventory-mapping.repository';

type FinanceInventoryItemReadPort = Pick<
  FinanceInventoryItemRepository,
  'listActive'
>;

type FinanceInventoryLocationReadPort = Pick<
  FinanceInventoryLocationRepository,
  'findActiveById'
>;

type FinanceInventoryMovementReadPort = Pick<
  FinanceInventoryMovementRepository,
  'aggregatePostedBalances'
>;

type FinanceInventoryMappingReadPort = Pick<
  FinanceInventoryMappingRepository,
  'countActiveByInventoryItemIds'
>;

const toMap = (
  records: FinanceInventoryBalancePersistenceRecord[]
) =>
  new Map(
    records.map((record) => [String(record._id), record])
  );

const toCountMap = (
  records: Array<{ _id: unknown; count: number }>
) =>
  new Map(
    records.map((record) => [
      String(record._id),
      record.count,
    ])
  );

const getStockStatus = ({
  item,
  quantity,
  balance,
}: {
  item: FinanceInventoryItemPersistenceRecord;
  quantity: number | null;
  balance: FinanceInventoryBalancePersistenceRecord;
}): FinanceInventoryBalanceDTO['status'] => {
  if (!item.track_quantity) return 'quantity_not_tracked';
  if (
    (quantity !== null && quantity < 0) ||
    balance.unresolved_movement_count > 0 ||
    (item.track_value &&
      balance.missing_cost_movement_count > 0)
  ) {
    return 'needs_review';
  }
  if (!item.track_value) return 'value_not_tracked';
  return 'ready';
};

const mapBalance = ({
  item,
  balance,
  mappingCount,
}: {
  item: FinanceInventoryItemPersistenceRecord;
  balance?: FinanceInventoryBalancePersistenceRecord;
  mappingCount: number;
}): FinanceInventoryBalanceDTO => {
  const current = balance ?? {
    _id: item._id,
    inbound_quantity: 0,
    outbound_quantity: 0,
    inbound_value: 0,
    outbound_value: 0,
    location_count: 0,
    unresolved_movement_count: 0,
    missing_cost_movement_count: 0,
  };
  const quantity = item.track_quantity
    ? current.inbound_quantity - current.outbound_quantity
    : null;
  const value = item.track_value
    ? current.inbound_value - current.outbound_value
    : null;
  const averageUnitCost =
    value !== null && quantity !== null && quantity > 0
      ? Math.round(value / quantity)
      : null;

  return {
    item_id: String(item._id),
    sku: item.sku,
    name: item.name,
    item_type: item.item_type,
    unit: item.unit,
    quantity_on_hand: quantity,
    value_on_hand: value,
    average_unit_cost: averageUnitCost,
    track_quantity: item.track_quantity,
    track_value: item.track_value,
    mapping_count: mappingCount,
    location_count: current.location_count,
    unresolved_movement_count:
      current.unresolved_movement_count,
    missing_cost_movement_count:
      current.missing_cost_movement_count,
    status: getStockStatus({
      item,
      quantity,
      balance: current,
    }),
  };
};

export class FinanceInventoryStockReadService {
  private readonly itemRepository: FinanceInventoryItemReadPort;
  private readonly locationRepository: FinanceInventoryLocationReadPort;
  private readonly movementRepository: FinanceInventoryMovementReadPort;
  private readonly mappingRepository: FinanceInventoryMappingReadPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      itemRepository?: FinanceInventoryItemReadPort;
      locationRepository?: FinanceInventoryLocationReadPort;
      movementRepository?: FinanceInventoryMovementReadPort;
      mappingRepository?: FinanceInventoryMappingReadPort;
    }
  ) {
    assertFinanceTenant(context);
    this.itemRepository =
      dependencies?.itemRepository ??
      new FinanceInventoryItemRepository(context);
    this.locationRepository =
      dependencies?.locationRepository ??
      new FinanceInventoryLocationRepository(context);
    this.movementRepository =
      dependencies?.movementRepository ??
      new FinanceInventoryMovementRepository(context);
    this.mappingRepository =
      dependencies?.mappingRepository ??
      new FinanceInventoryMappingRepository(context);
  }

  async list(
    input: FinanceInventoryStockQueryDTO | unknown
  ): Promise<FinanceInventoryStockResponseDTO> {
    const query =
      FinanceInventoryStockQuerySchema.parse(input);

    if (query.location_id) {
      const location =
        await this.locationRepository.findActiveById(
          query.location_id
        );
      if (!location) {
        throw new FinanceDomainError(
          'Lokasi inventory tidak ditemukan pada organization aktif.',
          'FINANCE_INVENTORY_LOCATION_NOT_FOUND'
        );
      }
    }

    const items = await this.itemRepository.listActive({
      page: query.page,
      limit: query.limit,
      search: query.search,
      item_type: query.item_type,
    });
    const itemIds = items.records.map((item) =>
      String(item._id)
    );
    const [balances, mappings] = await Promise.all([
      this.movementRepository.aggregatePostedBalances(
        itemIds,
        query.location_id
      ),
      this.mappingRepository.countActiveByInventoryItemIds(
        itemIds
      ),
    ]);
    const balanceMap = toMap(balances);
    const mappingMap = toCountMap(mappings);

    return FinanceInventoryStockResponseSchema.parse({
      items: items.records.map((item) =>
        mapBalance({
          item,
          balance: balanceMap.get(String(item._id)),
          mappingCount:
            mappingMap.get(String(item._id)) ?? 0,
        })
      ),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: items.total,
        total_pages: Math.ceil(items.total / query.limit),
      },
      source: {
        collection: 'inventory_movements',
        status: 'posted',
        costing_note:
          'Nilai berasal dari total_cost movement posted; average unit cost hanya indikator saldo, bukan keputusan FIFO atau moving average final.',
      },
    });
  }
}
