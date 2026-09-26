import {
  Types,
  type ClientSession,
  type QueryFilter,
} from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FinanceInventoryItemModel,
  type TFinanceInventoryItem,
} from './finance-inventory-item.model';
import type { FinanceInventoryItemTypeDTO } from './finance-inventory.dto';

export type FinanceInventoryItemPersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  sku: string;
  source_key?: string;
  name: string;
  item_type: FinanceInventoryItemTypeDTO;
  unit: string;
  track_quantity: boolean;
  track_value: boolean;
  is_active: boolean;
  inventory_account?: Types.ObjectId;
  cogs_account?: Types.ObjectId;
};

export type CreateFinanceInventoryItemRecord = {
  sku: string;
  name: string;
  item_type: FinanceInventoryItemTypeDTO;
  unit: string;
  track_quantity: boolean;
  track_value: boolean;
  source_key?: string;
};

type FinanceInventoryItemListFilter = {
  page: number;
  limit: number;
  search?: string;
  item_type?: FinanceInventoryItemTypeDTO;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class FinanceInventoryItemRepository extends BaseRepository<TFinanceInventoryItem> {
  constructor(context: FinanceTenantContext) {
    super(FinanceInventoryItemModel, context);
  }

  async listActive(
    filter: FinanceInventoryItemListFilter,
    session?: ClientSession
  ): Promise<{
    records: FinanceInventoryItemPersistenceRecord[];
    total: number;
  }> {
    const queryFilter: QueryFilter<TFinanceInventoryItem> =
      {
        ...this.getTenantFilter(),
        is_active: true,
        ...(filter.item_type
          ? { item_type: filter.item_type }
          : {}),
      };

    if (filter.search) {
      const search = new RegExp(
        escapeRegex(filter.search),
        'i'
      );
      queryFilter.$or = [{ sku: search }, { name: search }];
    }

    const query = this.model
      .find(queryFilter)
      .select(
        '_id organization sku source_key name item_type unit track_quantity track_value inventory_account cogs_account is_active'
      )
      .sort({ sku: 1, _id: 1 })
      .skip((filter.page - 1) * filter.limit)
      .limit(filter.limit);
    const countQuery =
      this.model.countDocuments(queryFilter);

    if (session) {
      query.session(session);
      countQuery.session(session);
    }

    const [records, total] = await Promise.all([
      query
        .lean<FinanceInventoryItemPersistenceRecord[]>()
        .exec(),
      countQuery.exec(),
    ]);

    return { records, total };
  }

  async findActiveById(
    id: string,
    session?: ClientSession
  ): Promise<FinanceInventoryItemPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query = this.model
      .findOne({
        ...this.getTenantFilter(),
        _id: new Types.ObjectId(id),
        is_active: true,
      })
      .select(
        '_id organization sku source_key name item_type unit track_quantity track_value inventory_account cogs_account is_active'
      );
    if (session) query.session(session);

    return query
      .lean<FinanceInventoryItemPersistenceRecord | null>()
      .exec();
  }

  async findBySku(
    sku: string
  ): Promise<FinanceInventoryItemPersistenceRecord | null> {
    return this.model
      .findOne({
        ...this.getTenantFilter(),
        sku: sku.trim(),
      })
      .select(
        '_id organization sku source_key name item_type unit track_quantity track_value inventory_account cogs_account is_active'
      )
      .lean<FinanceInventoryItemPersistenceRecord | null>()
      .exec();
  }

  async findBySourceKey(
    sourceKey: string
  ): Promise<FinanceInventoryItemPersistenceRecord | null> {
    return this.model
      .findOne({
        ...this.getTenantFilter(),
        source_key: sourceKey,
      })
      .select(
        '_id organization sku source_key name item_type unit track_quantity track_value inventory_account cogs_account is_active'
      )
      .lean<FinanceInventoryItemPersistenceRecord | null>()
      .exec();
  }

  async findActiveByIds(
    ids: string[]
  ): Promise<FinanceInventoryItemPersistenceRecord[]> {
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) return [];

    return this.model
      .find({
        ...this.getTenantFilter(),
        _id: { $in: objectIds },
        is_active: true,
      })
      .select(
        '_id organization sku source_key name item_type unit track_quantity track_value inventory_account cogs_account is_active'
      )
      .lean<FinanceInventoryItemPersistenceRecord[]>()
      .exec();
  }

  async findByIds(
    ids: string[]
  ): Promise<FinanceInventoryItemPersistenceRecord[]> {
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) return [];

    return this.model
      .find({
        ...this.getTenantFilter(),
        _id: { $in: objectIds },
      })
      .select(
        '_id organization sku source_key name item_type unit track_quantity track_value inventory_account cogs_account is_active'
      )
      .lean<FinanceInventoryItemPersistenceRecord[]>()
      .exec();
  }

  async createInventoryItem(
    data: CreateFinanceInventoryItemRecord
  ): Promise<FinanceInventoryItemPersistenceRecord> {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
      is_active: true,
    });
    const saved = await document.save();
    return saved.toObject() as unknown as FinanceInventoryItemPersistenceRecord;
  }

  async ensureInventoryItemFromProduct(
    data: CreateFinanceInventoryItemRecord & {
      source_key: string;
    }
  ): Promise<FinanceInventoryItemPersistenceRecord> {
    const existing = await this.findBySourceKey(
      data.source_key
    );
    if (existing) return existing;

    try {
      return await this.createInventoryItem(data);
    } catch (error: unknown) {
      if (
        typeof error !== 'object' ||
        error === null ||
        !('code' in error) ||
        error.code !== 11000
      ) {
        throw error;
      }

      // A repeated source key means a previous attempt created this item but
      // may have stopped before writing its mapping. A SKU collision from a
      // different source is rethrown for the setup service to review.
      const createdByRetry = await this.findBySourceKey(
        data.source_key
      );
      if (createdByRetry) return createdByRetry;
      throw error;
    }
  }
}
