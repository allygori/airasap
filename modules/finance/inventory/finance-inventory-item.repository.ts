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
  name: string;
  item_type: FinanceInventoryItemTypeDTO;
  unit: string;
  track_quantity: boolean;
  track_value: boolean;
  is_active: boolean;
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
        '_id organization sku name item_type unit track_quantity track_value is_active'
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
}
