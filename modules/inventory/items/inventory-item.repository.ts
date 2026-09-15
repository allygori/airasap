import type { ClientSession } from 'mongoose';
import { BaseRepository } from '../../base.repository';
import {
  InventoryItemModel,
  type TInventoryItem,
} from './inventory-item.model';
import type { AccountingTenantContext } from '@/modules/accounting/accounting.types';

export class InventoryItemRepository extends BaseRepository<TInventoryItem> {
  constructor(context: AccountingTenantContext) {
    super(InventoryItemModel, context);
  }

  async findItemById(id: string, session?: ClientSession) {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      _id: id,
    });
    if (session) query.session(session);
    return query.lean();
  }
}
