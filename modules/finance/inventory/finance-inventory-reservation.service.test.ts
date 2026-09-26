import { Types } from 'mongoose';
import type { FinanceLifecycleService } from '../finance-lifecycle.service';
import { FinanceSalesProjectionService } from '../sales/finance-sales.service';
import type { FinanceInventoryItemRepository } from './finance-inventory-item.repository';
import type { FinanceInventoryLocationRepository } from './finance-inventory-location.repository';
import type { FinanceInventoryMappingRepository } from './finance-inventory-mapping.repository';
import type { FinanceInventoryMovementRepository } from './finance-inventory-movement.repository';
import type {
  FinanceInventoryReservationPersistenceRecord,
  FinanceInventoryReservationRepository,
  SaveFinanceInventoryReservationRecord,
} from './finance-inventory-reservation.repository';
import { FinanceInventoryReservationService } from './finance-inventory-reservation.service';

const organizationId = '507f1f77bcf86cd799439010';
const productId = '507f1f77bcf86cd799439011';
const itemId = new Types.ObjectId();
const locationId = new Types.ObjectId();

const projection = (status: string) =>
  new FinanceSalesProjectionService({
    organizationId,
  }).projectOrder({
    source_order_id: 'ORDER-1',
    source_order_number: 'ORDER-1',
    organization_id: organizationId,
    store_id: '507f1f77bcf86cd799439012',
    platform: 'shopee',
    status,
    placed_at: '2026-09-24T00:00:00.000Z',
    total_gross_sales: 100000,
    items: [
      {
        product_reference_id: productId,
        variation_id: 'VAR-1',
        quantity: 2,
        final_quantity: 2,
        subtotal: 100000,
      },
    ],
  });

const makeService = (options?: {
  financeStatus?: 'active' | 'not_started';
  onHand?: number;
  postedMovement?: boolean;
}) => {
  let current: FinanceInventoryReservationPersistenceRecord | null =
    null;
  let saveCount = 0;

  const reservationRepository = {
    findBySourceLine: async () => current,
    saveState: async (
      data: SaveFinanceInventoryReservationRecord
    ) => {
      saveCount += 1;
      current = {
        ...data,
        _id: current?._id ?? new Types.ObjectId(),
        organization: new Types.ObjectId(organizationId),
      };
      return current;
    },
    aggregateActiveByInventoryItemIds: async () =>
      current?.status === 'active'
        ? [{ _id: itemId, quantity: current.quantity }]
        : [],
  } satisfies Pick<
    FinanceInventoryReservationRepository,
    | 'findBySourceLine'
    | 'saveState'
    | 'aggregateActiveByInventoryItemIds'
  >;

  const service = new FinanceInventoryReservationService(
    { organizationId },
    {
      availabilityChecker: async () => true,
      lifecycle: {
        getState: async () => ({
          status: options?.financeStatus ?? 'active',
          onboarding_version: 1,
          calendar_timezone: 'Asia/Jakarta',
        }),
      } satisfies Pick<FinanceLifecycleService, 'getState'>,
      mappingRepository: {
        findActiveByProductVariant: async () => ({
          _id: new Types.ObjectId(),
          organization: new Types.ObjectId(organizationId),
          product: new Types.ObjectId(productId),
          variant_id: 'VAR-1',
          variant_key: 'VAR-1',
          inventory_item: itemId,
          mapping_method: 'manual_setup',
          is_active: true,
        }),
      } satisfies Pick<
        FinanceInventoryMappingRepository,
        'findActiveByProductVariant'
      >,
      itemRepository: {
        findActiveById: async () => ({
          _id: itemId,
          organization: new Types.ObjectId(organizationId),
          sku: 'SKU-1',
          name: 'Produk 1',
          item_type: 'merchandise',
          unit: 'pcs',
          track_quantity: true,
          track_value: true,
          is_active: true,
        }),
      } satisfies Pick<
        FinanceInventoryItemRepository,
        'findActiveById'
      >,
      locationRepository: {
        listActive: async () => [
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
      } satisfies Pick<
        FinanceInventoryLocationRepository,
        'listActive'
      >,
      movementRepository: {
        getPostedBalance: async () => ({
          _id: itemId,
          inbound_quantity: options?.onHand ?? 10,
          outbound_quantity: 0,
          inbound_value: 1000000,
          outbound_value: 0,
          location_count: 1,
          unresolved_movement_count: 0,
          missing_cost_movement_count: 0,
        }),
        findByIdempotencyKey: async () =>
          options?.postedMovement
            ? {
                _id: new Types.ObjectId(),
                organization: new Types.ObjectId(
                  organizationId
                ),
                inventory_item: itemId,
                location: locationId,
                movement_type: 'sale',
                quantity: 2,
                occurred_at: new Date(),
                status: 'posted',
              }
            : null,
      } satisfies Pick<
        FinanceInventoryMovementRepository,
        'getPostedBalance' | 'findByIdempotencyKey'
      >,
      reservationRepository,
    }
  );

  return {
    service,
    getCurrent: () => current,
    getSaveCount: () => saveCount,
  };
};

describe('FinanceInventoryReservationService', () => {
  it('does not write reservations when Finance is inactive', async () => {
    const state = makeService({
      financeStatus: 'not_started',
    });

    const result = await state.service.sync(
      projection('perlu-dikirim')
    );

    expect(result.status).toBe('disabled');
    expect(state.getSaveCount()).toBe(0);
  });

  it('reserves an eligible Shopee order once and keeps retries stable', async () => {
    const state = makeService();

    await state.service.sync(projection('perlu-dikirim'));
    const result = await state.service.sync(
      projection('sedang-dikirim')
    );

    expect(result).toMatchObject({
      status: 'synced',
      active_count: 1,
    });
    expect(state.getCurrent()).toMatchObject({
      status: 'active',
      quantity: 2,
      inventory_item: itemId,
      location: locationId,
    });
  });

  it('records a visible shortage without creating negative sellable stock', async () => {
    const state = makeService({ onHand: 1 });

    const result = await state.service.sync(
      projection('perlu-dikirim')
    );

    expect(result.status).toBe('review');
    expect(state.getCurrent()).toMatchObject({
      status: 'shortage',
    });
  });

  it('releases an active reservation when the order is cancelled', async () => {
    const state = makeService();
    await state.service.sync(projection('perlu-dikirim'));

    const result = await state.service.sync(
      projection('batal')
    );

    expect(result).toMatchObject({
      status: 'synced',
      released_count: 1,
    });
    expect(state.getCurrent()?.status).toBe('released');
  });

  it('consumes a reservation only after the sales movement is posted', async () => {
    const waiting = makeService();
    await waiting.service.sync(projection('perlu-dikirim'));
    const waitingResult = await waiting.service.sync(
      projection('selesai')
    );

    expect(waitingResult.status).toBe('review');
    expect(waiting.getCurrent()?.status).toBe('active');

    const posted = makeService({ postedMovement: true });
    await posted.service.sync(projection('perlu-dikirim'));
    const postedResult = await posted.service.sync(
      projection('selesai')
    );

    expect(postedResult).toMatchObject({
      status: 'synced',
      consumed_count: 1,
    });
    expect(posted.getCurrent()?.status).toBe('consumed');
  });
});
