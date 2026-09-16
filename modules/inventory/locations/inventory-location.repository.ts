import type { ClientSession } from 'mongoose';
import { BaseRepository } from '../../base.repository';
import {
  InventoryLocationModel,
  type TInventoryLocation,
} from './inventory-location.model';
import type { AccountingTenantContext } from '@/modules/accounting/accounting.types';

export class InventoryLocationRepository extends BaseRepository<TInventoryLocation> {
  constructor(context: AccountingTenantContext) {
    super(InventoryLocationModel, context);
  }

  async ensureDefaultLocation() {
    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        code: 'MAIN',
      },
      {
        $set: {
          is_active: true,
        },
        $setOnInsert: {
          organization: this.tenantContext.organizationId,
          code: 'MAIN',
          name: 'Gudang Utama',
          type: 'warehouse',
          description:
            'Lokasi inventory default untuk operasional toko.',
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return query.lean();
  }

  async findLocationById(
    id: string,
    session?: ClientSession
  ) {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      _id: id,
    });
    if (session) query.session(session);
    return query.lean();
  }

  async findAllActive(session?: ClientSession) {
    const query = this.model.find({
      ...this.getTenantFilter(),
      is_active: true,
    });
    if (session) query.session(session);
    return query.lean();
  }
}
