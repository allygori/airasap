import { Types, type ClientSession } from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FinanceInventoryLocationModel,
  type TFinanceInventoryLocation,
} from './finance-inventory-location.model';

export type FinanceInventoryLocationPersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  code: string;
  name: string;
  is_active: boolean;
};

export class FinanceInventoryLocationRepository extends BaseRepository<TFinanceInventoryLocation> {
  constructor(context: FinanceTenantContext) {
    super(FinanceInventoryLocationModel, context);
  }

  async findActiveById(
    id: string,
    session?: ClientSession
  ): Promise<FinanceInventoryLocationPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query = this.model
      .findOne({
        ...this.getTenantFilter(),
        _id: new Types.ObjectId(id),
        is_active: true,
      })
      .select('_id organization code name is_active');
    if (session) query.session(session);

    return query
      .lean<FinanceInventoryLocationPersistenceRecord | null>()
      .exec();
  }

  async listActive(
    session?: ClientSession
  ): Promise<FinanceInventoryLocationPersistenceRecord[]> {
    const query = this.model
      .find({
        ...this.getTenantFilter(),
        is_active: true,
      })
      .select('_id organization code name is_active')
      .sort({ code: 1, _id: 1 });
    if (session) query.session(session);

    return query
      .lean<FinanceInventoryLocationPersistenceRecord[]>()
      .exec();
  }
}
