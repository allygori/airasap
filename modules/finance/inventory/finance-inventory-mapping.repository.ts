import { Types, type ClientSession } from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FinanceInventoryMappingModel,
  type TFinanceInventoryMapping,
} from './finance-inventory-mapping.model';

export type FinanceInventoryMappingCount = {
  _id: Types.ObjectId;
  count: number;
};

export class FinanceInventoryMappingRepository extends BaseRepository<TFinanceInventoryMapping> {
  constructor(context: FinanceTenantContext) {
    super(FinanceInventoryMappingModel, context);
  }

  async countActiveByInventoryItemIds(
    itemIds: string[],
    session?: ClientSession
  ): Promise<FinanceInventoryMappingCount[]> {
    const objectIds = itemIds
      .filter((itemId) => Types.ObjectId.isValid(itemId))
      .map((itemId) => new Types.ObjectId(itemId));
    if (objectIds.length === 0) return [];

    const aggregate =
      this.model.aggregate<FinanceInventoryMappingCount>([
        {
          $match: {
            ...this.getTenantFilter(),
            inventory_item: { $in: objectIds },
            is_active: true,
          },
        },
        {
          $group: {
            _id: '$inventory_item',
            count: { $sum: 1 },
          },
        },
      ]);
    if (session) aggregate.session(session);
    return aggregate.exec();
  }
}
