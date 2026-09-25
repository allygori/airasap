import {
  Types,
  type ClientSession,
  type UpdateQuery,
} from 'mongoose';
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

export type UpsertFinanceInventoryMappingRecord = {
  product_id: string;
  variant_id?: string;
  inventory_item_id: string;
  mapping_method?: 'manual_setup' | 'auto_product_setup';
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

  async listActiveForProductIds(
    productIds: string[]
  ): Promise<FinanceInventoryMappingPersistenceRecord[]> {
    const objectIds = productIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) return [];

    return this.model
      .find({
        ...this.getTenantFilter(),
        product: { $in: objectIds },
        is_active: true,
      })
      .select(
        '_id organization product variant_id variant_key inventory_item mapping_method is_active'
      )
      .lean<FinanceInventoryMappingPersistenceRecord[]>()
      .exec();
  }

  async upsertActive(
    data: UpsertFinanceInventoryMappingRecord
  ): Promise<FinanceInventoryMappingPersistenceRecord> {
    const productId = new Types.ObjectId(data.product_id);
    const inventoryItemId = new Types.ObjectId(
      data.inventory_item_id
    );
    const variantKey = data.variant_id ?? '__product__';
    const set: Record<string, unknown> = {
      inventory_item: inventoryItemId,
      mapping_method: data.mapping_method ?? 'manual_setup',
      is_active: true,
      ...(data.variant_id
        ? { variant_id: data.variant_id }
        : {}),
    };
    const update: UpdateQuery<TFinanceInventoryMapping> = {
      $set: set,
      $setOnInsert: {
        organization: new Types.ObjectId(
          this.tenantContext.organizationId
        ),
        product: productId,
        variant_key: variantKey,
      },
    };

    const mapping = await this.model
      .findOneAndUpdate(
        {
          ...this.getTenantFilter(),
          product: productId,
          variant_key: variantKey,
        },
        update,
        {
          upsert: true,
          returnDocument: 'after',
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      )
      .select(
        '_id organization product variant_id variant_key inventory_item mapping_method is_active'
      )
      .lean<FinanceInventoryMappingPersistenceRecord | null>()
      .exec();

    if (!mapping) {
      throw new Error(
        'Finance inventory product mapping could not be saved.'
      );
    }

    return mapping;
  }
}
