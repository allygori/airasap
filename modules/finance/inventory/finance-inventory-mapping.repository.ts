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

export type FinanceInventoryMappingPersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  product: Types.ObjectId;
  variant_id?: string;
  variant_key: string;
  inventory_item: Types.ObjectId;
  mapping_method: string;
  is_active: boolean;
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

  async findActiveByProductVariant(
    productId: string,
    variantId?: string,
    session?: ClientSession
  ): Promise<FinanceInventoryMappingPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(productId)) return null;

    const exactQuery = this.model.findOne({
      ...this.getTenantFilter(),
      product: new Types.ObjectId(productId),
      ...(variantId
        ? { variant_key: variantId }
        : { variant_key: '__product__' }),
      is_active: true,
    });
    if (session) exactQuery.session(session);
    const exact = await exactQuery
      .lean<FinanceInventoryMappingPersistenceRecord | null>()
      .exec();
    if (exact || !variantId) return exact;

    const fallbackQuery = this.model.findOne({
      ...this.getTenantFilter(),
      product: new Types.ObjectId(productId),
      variant_key: '__product__',
      is_active: true,
    });
    if (session) fallbackQuery.session(session);
    return fallbackQuery
      .lean<FinanceInventoryMappingPersistenceRecord | null>()
      .exec();
  }
}
