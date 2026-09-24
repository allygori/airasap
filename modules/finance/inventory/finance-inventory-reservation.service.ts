import type { ClientSession } from 'mongoose';
import { FinanceEntitlementService } from '../finance-entitlement.service';
import { FinanceLifecycleService } from '../finance-lifecycle.service';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type { FinanceSalesProjectionDTO } from '../sales/finance-sales.dto';
import { makeFinanceSalesCogsIdempotencyKey } from '../sales/finance-sales.keys';
import { FinanceInventoryItemRepository } from './finance-inventory-item.repository';
import { FinanceInventoryLocationRepository } from './finance-inventory-location.repository';
import { FinanceInventoryMappingRepository } from './finance-inventory-mapping.repository';
import { FinanceInventoryMovementRepository } from './finance-inventory-movement.repository';
import {
  FinanceInventoryReservationRepository,
  type FinanceInventoryReservationPersistenceRecord,
  type SaveFinanceInventoryReservationRecord,
} from './finance-inventory-reservation.repository';

type LifecyclePort = Pick<
  FinanceLifecycleService,
  'getState'
>;
type MappingPort = Pick<
  FinanceInventoryMappingRepository,
  'findActiveByProductVariant'
>;
type ItemPort = Pick<
  FinanceInventoryItemRepository,
  'findActiveById'
>;
type LocationPort = Pick<
  FinanceInventoryLocationRepository,
  'listActive'
>;
type MovementPort = Pick<
  FinanceInventoryMovementRepository,
  'getPostedBalance' | 'findByIdempotencyKey'
>;
type ReservationPort = Pick<
  FinanceInventoryReservationRepository,
  | 'findBySourceLine'
  | 'saveState'
  | 'aggregateActiveByInventoryItemIds'
>;

export type FinanceInventoryReservationSyncResult = {
  status: 'disabled' | 'ignored' | 'synced' | 'review';
  source_order_id: string;
  active_count: number;
  released_count: number;
  consumed_count: number;
  review_count: number;
  reason: string | null;
};

type ReservationEvent =
  | 'reserve'
  | 'release'
  | 'complete'
  | 'review'
  | 'ignore';

const SHOPEE_RESERVE_STATUSES = new Set([
  'perlu-dikirim',
  'sedang-dikirim',
  'telah-dikirim',
]);

const getEvent = (
  projection: FinanceSalesProjectionDTO
): ReservationEvent => {
  if (projection.platform !== 'shopee') return 'ignore';
  if (
    projection.source_status === 'selesai' &&
    projection.lines.some(
      (line) => line.returned_quantity > 0
    )
  ) {
    return 'review';
  }
  if (
    projection.source_status &&
    SHOPEE_RESERVE_STATUSES.has(projection.source_status)
  ) {
    return 'reserve';
  }
  if (projection.source_status === 'batal')
    return 'release';
  if (projection.source_status === 'selesai')
    return 'complete';
  if (
    projection.source_status === 'pengembalian' ||
    projection.source_status === 'pengembalian-dana'
  ) {
    return 'review';
  }
  return 'ignore';
};

const baseRecord = (
  projection: FinanceSalesProjectionDTO,
  line: FinanceSalesProjectionDTO['lines'][number],
  quantity = line.final_quantity
): Omit<
  SaveFinanceInventoryReservationRecord,
  'inventory_item' | 'location' | 'status' | 'reason'
> => ({
  source_order_id: projection.source_order_id,
  source_line_id: line.source_line_id,
  platform: projection.platform,
  store_id: projection.store_id,
  product_reference_id: line.product_reference_id,
  variation_id: line.variation_id,
  quantity,
  source_status: projection.source_status,
});

export class FinanceInventoryReservationService {
  private readonly lifecycle: LifecyclePort;
  private readonly mappingRepository: MappingPort;
  private readonly itemRepository: ItemPort;
  private readonly locationRepository: LocationPort;
  private readonly movementRepository: MovementPort;
  private readonly reservationRepository: ReservationPort;
  private readonly availabilityChecker: () => Promise<boolean>;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      lifecycle?: LifecyclePort;
      mappingRepository?: MappingPort;
      itemRepository?: ItemPort;
      locationRepository?: LocationPort;
      movementRepository?: MovementPort;
      reservationRepository?: ReservationPort;
      availabilityChecker?: () => Promise<boolean>;
    }
  ) {
    assertFinanceTenant(context);
    this.lifecycle =
      dependencies?.lifecycle ??
      new FinanceLifecycleService(context);
    this.mappingRepository =
      dependencies?.mappingRepository ??
      new FinanceInventoryMappingRepository(context);
    this.itemRepository =
      dependencies?.itemRepository ??
      new FinanceInventoryItemRepository(context);
    this.locationRepository =
      dependencies?.locationRepository ??
      new FinanceInventoryLocationRepository(context);
    this.movementRepository =
      dependencies?.movementRepository ??
      new FinanceInventoryMovementRepository(context);
    this.reservationRepository =
      dependencies?.reservationRepository ??
      new FinanceInventoryReservationRepository(context);
    this.availabilityChecker =
      dependencies?.availabilityChecker ??
      (async () =>
        (
          await new FinanceEntitlementService(
            context
          ).getAvailability()
        ).available);
  }

  async sync(
    projection: FinanceSalesProjectionDTO,
    session?: ClientSession
  ): Promise<FinanceInventoryReservationSyncResult> {
    if (!(await this.availabilityChecker())) {
      return this.result(
        'disabled',
        projection,
        0,
        0,
        0,
        0,
        'Finance tidak tersedia untuk organisasi ini.'
      );
    }
    const finance = await this.lifecycle.getState(session);
    if (finance.status !== 'active') {
      return this.result(
        'disabled',
        projection,
        0,
        0,
        0,
        0,
        'Finance module belum aktif.'
      );
    }

    const event = getEvent(projection);
    if (event === 'ignore') {
      return this.result(
        'ignored',
        projection,
        0,
        0,
        0,
        0,
        'Status order belum memengaruhi stok Finance.'
      );
    }

    const counters = {
      active: 0,
      released: 0,
      consumed: 0,
      review: 0,
    };

    for (const line of projection.lines) {
      if (event === 'reserve' && line.final_quantity <= 0)
        continue;
      const existing =
        await this.reservationRepository.findBySourceLine(
          projection.platform,
          projection.store_id,
          projection.source_order_id,
          line.source_line_id,
          session
        );

      if (event === 'release') {
        await this.release(
          projection,
          line,
          existing,
          session
        );
        if (existing?.status === 'consumed')
          counters.review += 1;
        else counters.released += 1;
        continue;
      }

      if (event === 'review') {
        await this.flagReview(
          projection,
          line,
          existing,
          session
        );
        counters.review += 1;
        continue;
      }

      if (event === 'complete') {
        const consumed = await this.complete(
          projection,
          line,
          existing,
          session
        );
        if (consumed) counters.consumed += 1;
        else counters.review += 1;
        continue;
      }

      const reserved = await this.reserve(
        projection,
        line,
        existing,
        session
      );
      if (reserved.reason) counters.review += 1;
      else if (reserved.status === 'active')
        counters.active += 1;
      else if (reserved.status === 'released')
        counters.released += 1;
      else if (reserved.status === 'consumed')
        counters.consumed += 1;
      else counters.review += 1;
    }

    const review = counters.review > 0;
    return this.result(
      review ? 'review' : 'synced',
      projection,
      counters.active,
      counters.released,
      counters.consumed,
      counters.review,
      review
        ? 'Sebagian line order perlu ditinjau pada inventory Finance.'
        : null
    );
  }

  private async reserve(
    projection: FinanceSalesProjectionDTO,
    line: FinanceSalesProjectionDTO['lines'][number],
    existing: FinanceInventoryReservationPersistenceRecord | null,
    session?: ClientSession
  ) {
    if (
      existing?.status === 'released' ||
      existing?.status === 'consumed'
    ) {
      return existing;
    }
    if (!line.product_reference_id) {
      return this.saveBlocked(
        projection,
        line,
        'Produk order belum terhubung ke katalog.',
        session
      );
    }

    const locations =
      await this.locationRepository.listActive(session);
    if (locations.length !== 1) {
      return this.saveBlocked(
        projection,
        line,
        'Reservasi stok memerlukan tepat satu lokasi inventory aktif.',
        session
      );
    }
    const mapping =
      await this.mappingRepository.findActiveByProductVariant(
        line.product_reference_id,
        line.variation_id ?? undefined,
        session
      );
    if (!mapping) {
      return this.saveBlocked(
        projection,
        line,
        'Produk atau variasi belum dihubungkan ke item stok Finance.',
        session
      );
    }
    const item = await this.itemRepository.findActiveById(
      String(mapping.inventory_item),
      session
    );
    if (!item?.track_quantity) {
      return this.saveBlocked(
        projection,
        line,
        'Item inventory belum aktif atau tidak melacak quantity.',
        session
      );
    }

    const itemId = String(item._id);
    const locationId = String(locations[0]._id);
    const [balance, reservedRecords] = await Promise.all([
      this.movementRepository.getPostedBalance(
        itemId,
        locationId,
        session
      ),
      this.reservationRepository.aggregateActiveByInventoryItemIds(
        [itemId],
        locationId,
        session
      ),
    ]);
    const onHand =
      (balance?.inbound_quantity ?? 0) -
      (balance?.outbound_quantity ?? 0);
    const activeReserved =
      reservedRecords[0]?.quantity ?? 0;
    const ownActiveQuantity =
      existing?.status === 'active' ? existing.quantity : 0;
    const available =
      onHand - activeReserved + ownActiveQuantity;
    const enough = available >= line.final_quantity;

    return this.reservationRepository.saveState(
      {
        ...baseRecord(projection, line),
        inventory_item: item._id,
        location: locations[0]._id,
        status: enough ? 'active' : 'shortage',
        reason: enough
          ? null
          : `Stok tersedia ${available} ${item.unit}; kebutuhan order ${line.final_quantity} ${item.unit}.`,
      },
      session
    );
  }

  private async release(
    projection: FinanceSalesProjectionDTO,
    line: FinanceSalesProjectionDTO['lines'][number],
    existing: FinanceInventoryReservationPersistenceRecord | null,
    session?: ClientSession
  ) {
    if (existing?.status === 'consumed') {
      return this.reservationRepository.saveState(
        {
          ...baseRecord(
            projection,
            line,
            existing.quantity
          ),
          inventory_item: existing.inventory_item,
          location: existing.location,
          status: 'consumed',
          reason:
            'Order dibatalkan setelah stok dikonsumsi; reversal perlu ditinjau.',
        },
        session
      );
    }
    return this.reservationRepository.saveState(
      {
        ...baseRecord(
          projection,
          line,
          existing?.quantity ?? line.final_quantity
        ),
        inventory_item: existing?.inventory_item ?? null,
        location: existing?.location ?? null,
        status: 'released',
        reason: null,
      },
      session
    );
  }

  private async complete(
    projection: FinanceSalesProjectionDTO,
    line: FinanceSalesProjectionDTO['lines'][number],
    existing: FinanceInventoryReservationPersistenceRecord | null,
    session?: ClientSession
  ): Promise<boolean> {
    if (
      existing?.status === 'consumed' &&
      existing.reason
    ) {
      return false;
    }

    const movement =
      await this.movementRepository.findByIdempotencyKey(
        makeFinanceSalesCogsIdempotencyKey({
          platform: projection.platform,
          store_id: projection.store_id,
          source_order_id: projection.source_order_id,
          source_line_id: line.source_line_id,
        }),
        session
      );
    if (movement?.status === 'posted') {
      await this.reservationRepository.saveState(
        {
          ...baseRecord(
            projection,
            line,
            movement.quantity
          ),
          inventory_item: movement.inventory_item,
          location: movement.location,
          status: 'consumed',
          reason: null,
        },
        session
      );
      return true;
    }

    await this.reservationRepository.saveState(
      {
        ...baseRecord(
          projection,
          line,
          existing?.quantity ?? line.final_quantity
        ),
        inventory_item: existing?.inventory_item ?? null,
        location: existing?.location ?? null,
        status:
          existing?.status === 'active'
            ? 'active'
            : (existing?.status ?? 'blocked'),
        reason:
          'Order selesai tetapi movement HPP belum posted; reservasi belum dikonsumsi.',
      },
      session
    );
    return false;
  }

  private flagReview(
    projection: FinanceSalesProjectionDTO,
    line: FinanceSalesProjectionDTO['lines'][number],
    existing: FinanceInventoryReservationPersistenceRecord | null,
    session?: ClientSession
  ) {
    return this.reservationRepository.saveState(
      {
        ...baseRecord(
          projection,
          line,
          existing?.quantity ?? line.final_quantity
        ),
        inventory_item: existing?.inventory_item ?? null,
        location: existing?.location ?? null,
        status: existing?.status ?? 'blocked',
        reason:
          'Status retur/refund memerlukan workflow koreksi sebelum stok diubah.',
      },
      session
    );
  }

  private saveBlocked(
    projection: FinanceSalesProjectionDTO,
    line: FinanceSalesProjectionDTO['lines'][number],
    reason: string,
    session?: ClientSession
  ) {
    return this.reservationRepository.saveState(
      {
        ...baseRecord(projection, line),
        inventory_item: null,
        location: null,
        status: 'blocked',
        reason,
      },
      session
    );
  }

  private result(
    status: FinanceInventoryReservationSyncResult['status'],
    projection: FinanceSalesProjectionDTO,
    active: number,
    released: number,
    consumed: number,
    review: number,
    reason: string | null
  ): FinanceInventoryReservationSyncResult {
    return {
      status,
      source_order_id: projection.source_order_id,
      active_count: active,
      released_count: released,
      consumed_count: consumed,
      review_count: review,
      reason,
    };
  }
}
