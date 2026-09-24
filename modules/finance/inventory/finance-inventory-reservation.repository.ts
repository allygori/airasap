import { Types, type ClientSession } from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import type { FinanceInventoryReservationStatus } from './finance-inventory.constants';
import {
  FinanceInventoryReservationModel,
  type TFinanceInventoryReservation,
} from './finance-inventory-reservation.model';

export type FinanceInventoryReservationPersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  source_order_id: string;
  source_line_id: string;
  platform: string;
  store_id: string | null;
  product_reference_id: string | null;
  variation_id: string | null;
  inventory_item: Types.ObjectId | null;
  location: Types.ObjectId | null;
  quantity: number;
  status: FinanceInventoryReservationStatus;
  source_status: string | null;
  reason: string | null;
};

export type SaveFinanceInventoryReservationRecord = Omit<
  FinanceInventoryReservationPersistenceRecord,
  '_id' | 'organization'
>;

export type FinanceInventoryReservedQuantityRecord = {
  _id: Types.ObjectId;
  quantity: number;
};

export type FinanceInventoryReservationIssueCountRecord = {
  _id: Types.ObjectId;
  count: number;
};

export class FinanceInventoryReservationRepository extends BaseRepository<TFinanceInventoryReservation> {
  constructor(context: FinanceTenantContext) {
    super(FinanceInventoryReservationModel, context);
  }

  findBySourceLine(
    platform: string,
    storeId: string | null,
    sourceOrderId: string,
    sourceLineId: string,
    session?: ClientSession
  ): Promise<FinanceInventoryReservationPersistenceRecord | null> {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      platform,
      store_id: storeId,
      source_order_id: sourceOrderId,
      source_line_id: sourceLineId,
    });
    if (session) query.session(session);
    return query
      .lean<FinanceInventoryReservationPersistenceRecord | null>()
      .exec();
  }

  async saveState(
    data: SaveFinanceInventoryReservationRecord,
    session?: ClientSession
  ): Promise<FinanceInventoryReservationPersistenceRecord> {
    const record = await this.model
      .findOneAndUpdate(
        {
          ...this.getTenantFilter(),
          platform: data.platform,
          store_id: data.store_id,
          source_order_id: data.source_order_id,
          source_line_id: data.source_line_id,
        },
        {
          $set: data,
          $setOnInsert: {
            organization: new Types.ObjectId(
              this.tenantContext.organizationId
            ),
          },
        },
        {
          upsert: true,
          returnDocument: 'after',
          runValidators: true,
          setDefaultsOnInsert: true,
          ...(session ? { session } : {}),
        }
      )
      .lean<FinanceInventoryReservationPersistenceRecord | null>()
      .exec();

    if (!record) {
      throw new Error(
        'Finance inventory reservation could not be saved.'
      );
    }
    return record;
  }

  async aggregateActiveByInventoryItemIds(
    itemIds: string[],
    locationId?: string,
    session?: ClientSession
  ): Promise<FinanceInventoryReservedQuantityRecord[]> {
    const objectIds = itemIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) return [];

    const aggregate =
      this.model.aggregate<FinanceInventoryReservedQuantityRecord>(
        [
          {
            $match: {
              ...this.getTenantFilter(),
              inventory_item: { $in: objectIds },
              status: 'active',
              ...(locationId &&
              Types.ObjectId.isValid(locationId)
                ? {
                    location: new Types.ObjectId(
                      locationId
                    ),
                  }
                : {}),
            },
          },
          {
            $group: {
              _id: '$inventory_item',
              quantity: { $sum: '$quantity' },
            },
          },
        ]
      );
    if (session) aggregate.session(session);
    return aggregate.exec();
  }

  async countIssuesByInventoryItemIds(
    itemIds: string[],
    session?: ClientSession
  ): Promise<
    FinanceInventoryReservationIssueCountRecord[]
  > {
    const objectIds = itemIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) return [];

    const aggregate =
      this.model.aggregate<FinanceInventoryReservationIssueCountRecord>(
        [
          {
            $match: {
              ...this.getTenantFilter(),
              inventory_item: { $in: objectIds },
              $or: [
                {
                  status: { $in: ['shortage', 'blocked'] },
                },
                { reason: { $nin: [null, ''] } },
              ],
            },
          },
          {
            $group: {
              _id: '$inventory_item',
              count: { $sum: 1 },
            },
          },
        ]
      );
    if (session) aggregate.session(session);
    return aggregate.exec();
  }
}
