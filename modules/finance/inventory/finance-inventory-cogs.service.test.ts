import { Types } from 'mongoose';
import type {
  FinanceAccountPersistenceRecord,
  FinanceAccountRepository,
} from '../accounts/finance-account.repository';
import type { FinanceInventoryItemRepository } from './finance-inventory-item.repository';
import type { FinanceInventoryLocationRepository } from './finance-inventory-location.repository';
import type { FinanceInventoryMappingRepository } from './finance-inventory-mapping.repository';
import type { FinanceInventoryMovementRepository } from './finance-inventory-movement.repository';
import { FinanceInventoryCogsService } from './finance-inventory-cogs.service';

const organizationId = '507f1f77bcf86cd799439010';
const productId = new Types.ObjectId();
const itemId = new Types.ObjectId();
const locationId = new Types.ObjectId();
const inventoryAccountId = new Types.ObjectId();
const cogsAccountId = new Types.ObjectId();
const movementId = new Types.ObjectId();

const item = {
  _id: itemId,
  organization: new Types.ObjectId(organizationId),
  sku: 'SKU-001',
  name: 'Produk contoh',
  item_type: 'merchandise' as const,
  unit: 'pcs',
  track_quantity: true,
  track_value: true,
  inventory_account: inventoryAccountId,
  cogs_account: cogsAccountId,
  is_active: true,
};

const account = (
  id: Types.ObjectId,
  type: 'asset' | 'cost_of_sales'
): FinanceAccountPersistenceRecord => ({
  _id: id,
  organization: new Types.ObjectId(organizationId),
  code: type === 'asset' ? '1310' : '5100',
  name: type === 'asset' ? 'Persediaan' : 'HPP',
  type,
  subtype:
    type === 'asset'
      ? 'merchandise_inventory'
      : 'merchandise_cost',
  parent_account: null,
  normal_balance: type === 'asset' ? 'debit' : 'debit',
  is_system: false,
  is_postable: true,
  is_active: true,
  display_order: 1,
});

type ItemPort = Pick<
  FinanceInventoryItemRepository,
  'findActiveById'
>;
type LocationPort = Pick<
  FinanceInventoryLocationRepository,
  'listActive'
>;
type MappingPort = Pick<
  FinanceInventoryMappingRepository,
  'findActiveByProductVariant'
>;
type MovementPort = Pick<
  FinanceInventoryMovementRepository,
  | 'getPostedBalance'
  | 'findByIdempotencyKey'
  | 'listPostedByJournalEntry'
  | 'createPosted'
>;
type AccountPort = Pick<
  FinanceAccountRepository,
  | 'findSelectableById'
  | 'findSelectableBySubtype'
  | 'findSelectableByCode'
>;

const makeService = (overrides?: {
  itemRepository?: ItemPort;
  locationRepository?: LocationPort;
  mappingRepository?: MappingPort;
  movementRepository?: MovementPort;
  accountRepository?: AccountPort;
}) =>
  new FinanceInventoryCogsService(
    { organizationId },
    {
      itemRepository: overrides?.itemRepository ?? {
        findActiveById: async () => item,
      },
      locationRepository: overrides?.locationRepository ?? {
        listActive: async () => [
          {
            _id: locationId,
            organization: new Types.ObjectId(
              organizationId
            ),
            code: 'WH-01',
            name: 'Gudang utama',
            is_active: true,
          },
        ],
      },
      mappingRepository: overrides?.mappingRepository ?? {
        findActiveByProductVariant: async () => ({
          _id: new Types.ObjectId(),
          organization: new Types.ObjectId(organizationId),
          product: productId,
          variant_key: '__product__',
          inventory_item: itemId,
          mapping_method: 'manual',
          is_active: true,
        }),
      },
      movementRepository: overrides?.movementRepository ?? {
        getPostedBalance: async () => ({
          _id: itemId,
          inbound_quantity: 10,
          outbound_quantity: 0,
          inbound_value: 1000000,
          outbound_value: 0,
          location_count: 1,
          unresolved_movement_count: 0,
          missing_cost_movement_count: 0,
        }),
        findByIdempotencyKey: async () => null,
        listPostedByJournalEntry: async () => [],
        createPosted: async (data) => ({
          ...data,
          _id: movementId,
          organization: new Types.ObjectId(organizationId),
          status: 'posted' as const,
        }),
      },
      accountRepository: overrides?.accountRepository ?? {
        findSelectableById: async (id: string) =>
          id === String(inventoryAccountId)
            ? account(inventoryAccountId, 'asset')
            : id === String(cogsAccountId)
              ? account(cogsAccountId, 'cost_of_sales')
              : null,
        findSelectableBySubtype: async () => null,
        findSelectableByCode: async () => null,
      },
    }
  );

const source = {
  source_order_id: 'ORDER-001',
  source_order_number: 'SP-001',
  transaction_date: new Date('2026-09-22T00:00:00.000Z'),
  lines: [
    {
      source_line_id: 'ORDER-001:0',
      product_reference_id: String(productId),
      product_id: 'MARKETPLACE-001',
      variation_id: null,
      variation_name: null,
      product_name: 'Produk contoh',
      parent_sku: null,
      child_sku: 'SKU-001',
      quantity: 2,
      returned_quantity: 0,
      final_quantity: 2,
      subtotal: 250000,
      gross_sales: 250000,
      net_sales: 250000,
      product_cost: null,
      total_product_cost: null,
    },
  ],
};

describe('FinanceInventoryCogsService', () => {
  it('calculates moving-average COGS and sale movement plans', async () => {
    const result = await makeService().prepare(source);

    expect(result).toMatchObject({
      status: 'posted',
      total_cost: 200000,
    });
    expect(result.journal_lines).toEqual([
      expect.objectContaining({
        account_id: String(cogsAccountId),
        debit: 200000,
        credit: 0,
      }),
      expect.objectContaining({
        account_id: String(inventoryAccountId),
        debit: 0,
        credit: 200000,
      }),
    ]);
    expect(result.movements[0]).toMatchObject({
      quantity: 2,
      unit_cost: 100000,
      total_cost: 200000,
      location_id: String(locationId),
    });

    const movementIds = await makeService().finalize(
      result,
      String(new Types.ObjectId())
    );
    expect(movementIds).toEqual([String(movementId)]);
  });

  it('defers without querying inventory when product reference is missing', async () => {
    const listActive = jest.fn(async () => []);
    const result = await makeService({
      locationRepository: { listActive },
    }).prepare({
      ...source,
      lines: [
        {
          ...source.lines[0],
          product_reference_id: null,
        },
      ],
    });

    expect(result.status).toBe('deferred');
    expect(result.reason).toContain('reference Product');
    expect(listActive).not.toHaveBeenCalled();
  });

  it('defers when more than one active location exists', async () => {
    const result = await makeService({
      locationRepository: {
        listActive: async () => [
          {
            _id: locationId,
            organization: new Types.ObjectId(
              organizationId
            ),
            code: 'WH-01',
            name: 'Gudang utama',
            is_active: true,
          },
          {
            _id: new Types.ObjectId(),
            organization: new Types.ObjectId(
              organizationId
            ),
            code: 'WH-02',
            name: 'Gudang kedua',
            is_active: true,
          },
        ],
      },
    }).prepare(source);

    expect(result.status).toBe('deferred');
    expect(result.reason).toContain('satu lokasi');
  });

  it('creates an inbound return movement when the sales journal is reversed', async () => {
    const originalMovementId = new Types.ObjectId();
    const reversalMovementId = new Types.ObjectId();
    const createPosted = jest.fn(async (data) => ({
      ...data,
      _id: reversalMovementId,
      organization: new Types.ObjectId(organizationId),
      status: 'posted' as const,
    }));
    const service = makeService({
      movementRepository: {
        getPostedBalance: async () => null,
        findByIdempotencyKey: async () => null,
        listPostedByJournalEntry: async () => [
          {
            _id: originalMovementId,
            organization: new Types.ObjectId(
              organizationId
            ),
            inventory_item: itemId,
            location: locationId,
            movement_type: 'sale' as const,
            quantity: 2,
            unit_cost: 100000,
            total_cost: 200000,
            occurred_at: source.transaction_date,
            source_type: 'order',
            source_id: source.source_order_id,
            idempotency_key:
              'finance-sales-cogs:ORDER-001:ORDER-001:0',
            status: 'posted' as const,
            journal_entry: new Types.ObjectId(),
          },
        ],
        createPosted,
      },
    });

    const movementIds =
      await service.reversePostedSalesMovements(
        String(new Types.ObjectId()),
        String(new Types.ObjectId()),
        new Date('2026-09-23T00:00:00.000Z')
      );

    expect(movementIds).toEqual([
      String(reversalMovementId),
    ]);
    expect(createPosted).toHaveBeenCalledWith(
      expect.objectContaining({
        movement_type: 'return',
        quantity: 2,
        total_cost: 200000,
        source_type: 'journal_reversal',
      }),
      undefined
    );
  });
});
