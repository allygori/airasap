import {
  type ClientSession,
  type UpdateQuery,
} from 'mongoose';
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

  async createItem(
    data: Record<string, unknown>,
    session?: ClientSession
  ) {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
    });
    return document.save(session ? { session } : undefined);
  }

  async findActiveBySkus(
    skus: string[],
    session?: ClientSession
  ) {
    const normalizedSkus = [
      ...new Set(
        skus.map((sku) => sku.trim()).filter(Boolean)
      ),
    ];
    if (normalizedSkus.length === 0) return [];

    const query = this.model.find({
      ...this.getTenantFilter(),
      sku: { $in: normalizedSkus },
      is_active: true,
    });
    if (session) query.session(session);
    return query.lean();
  }

  async updateItem(
    id: string,
    data: UpdateQuery<TInventoryItem>
  ) {
    return this.model
      .findOneAndUpdate(
        { ...this.getTenantFilter(), _id: id },
        { $set: data },
        { new: true, runValidators: true }
      )
      .lean();
  }

  async archiveItem(id: string) {
    return this.model
      .findOneAndUpdate(
        { ...this.getTenantFilter(), _id: id },
        { $set: { is_active: false } },
        { new: true, runValidators: true }
      )
      .lean();
  }
}
