import {
  Types,
  type ClientSession,
  type PipelineStage,
  type QueryFilter,
} from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FINANCE_INVENTORY_INBOUND_MOVEMENT_TYPES,
  FINANCE_INVENTORY_OUTBOUND_MOVEMENT_TYPES,
} from './finance-inventory.constants';
import {
  FinanceInventoryMovementModel,
  type TFinanceInventoryMovement,
} from './finance-inventory-movement.model';

export type FinanceInventoryBalancePersistenceRecord = {
  _id: Types.ObjectId;
  inbound_quantity: number;
  outbound_quantity: number;
  inbound_value: number;
  outbound_value: number;
  location_count: number;
  unresolved_movement_count: number;
  missing_cost_movement_count: number;
};

export class FinanceInventoryMovementRepository extends BaseRepository<TFinanceInventoryMovement> {
  constructor(context: FinanceTenantContext) {
    super(FinanceInventoryMovementModel, context);
  }

  async aggregatePostedBalances(
    itemIds: string[],
    locationId?: string,
    session?: ClientSession
  ): Promise<FinanceInventoryBalancePersistenceRecord[]> {
    const objectIds = itemIds
      .filter((itemId) => Types.ObjectId.isValid(itemId))
      .map((itemId) => new Types.ObjectId(itemId));
    if (objectIds.length === 0) return [];

    const baseFilter: QueryFilter<TFinanceInventoryMovement> =
      {
        ...this.getTenantFilter(),
        inventory_item: { $in: objectIds },
        status: 'posted',
        ...(locationId && Types.ObjectId.isValid(locationId)
          ? { location: new Types.ObjectId(locationId) }
          : {}),
      };

    const inboundTypes = [
      ...FINANCE_INVENTORY_INBOUND_MOVEMENT_TYPES,
    ];
    const outboundTypes = [
      ...FINANCE_INVENTORY_OUTBOUND_MOVEMENT_TYPES,
    ];
    const knownTypes = [...inboundTypes, ...outboundTypes];

    const pipeline: PipelineStage[] = [
      { $match: baseFilter },
      {
        $group: {
          _id: '$inventory_item',
          inbound_quantity: {
            $sum: {
              $cond: [
                { $in: ['$movement_type', inboundTypes] },
                '$quantity',
                0,
              ],
            },
          },
          outbound_quantity: {
            $sum: {
              $cond: [
                { $in: ['$movement_type', outboundTypes] },
                '$quantity',
                0,
              ],
            },
          },
          inbound_value: {
            $sum: {
              $cond: [
                { $in: ['$movement_type', inboundTypes] },
                { $ifNull: ['$total_cost', 0] },
                0,
              ],
            },
          },
          outbound_value: {
            $sum: {
              $cond: [
                { $in: ['$movement_type', outboundTypes] },
                { $ifNull: ['$total_cost', 0] },
                0,
              ],
            },
          },
          locations: { $addToSet: '$location' },
          unresolved_movement_count: {
            $sum: {
              $cond: [
                {
                  $not: [
                    { $in: ['$movement_type', knownTypes] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          missing_cost_movement_count: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$movement_type', knownTypes] },
                    {
                      $eq: [
                        { $ifNull: ['$total_cost', null] },
                        null,
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          inbound_quantity: 1,
          outbound_quantity: 1,
          inbound_value: 1,
          outbound_value: 1,
          location_count: { $size: '$locations' },
          unresolved_movement_count: 1,
          missing_cost_movement_count: 1,
        },
      },
    ];

    const aggregate =
      this.model.aggregate<FinanceInventoryBalancePersistenceRecord>(
        pipeline
      );
    if (session) aggregate.session(session);
    return aggregate.exec();
  }
}
