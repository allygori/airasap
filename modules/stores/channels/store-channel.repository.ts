import {
  type ClientSession,
  type PopulateOptions,
  type UpdateQuery,
} from 'mongoose';
import type { QueryOptions } from '@/lib/api/query-builder';
import { BaseRepository } from '@/modules/base.repository';
import type { AccountingTenantContext } from '@/modules/accounting/accounting.types';
import {
  StoreChannelModel,
  type TStoreChannel,
} from './store-channel.model';

export class StoreChannelRepository extends BaseRepository<TStoreChannel> {
  constructor(context: AccountingTenantContext) {
    super(StoreChannelModel, context);
  }

  private getPopulateOptions(): PopulateOptions[] {
    return [
      {
        path: 'store',
        select: 'name code timezone is_active',
        match: {
          organization: this.tenantContext.organizationId,
        },
        options: {
          organizationId: this.tenantContext.organizationId,
        },
      },
    ];
  }

  getWithPagination(
    query: QueryOptions,
    options?: {
      store?: string;
      platform?: string;
      is_active?: boolean;
    }
  ) {
    return this.findWithQueryOptions(query, {
      searchFields: [
        'platform',
        'name',
        'external_account_id',
      ],
      baseFilter: {
        ...(options?.store ? { store: options.store } : {}),
        ...(options?.platform
          ? { platform: options.platform }
          : {}),
        ...(options?.is_active === undefined
          ? {}
          : { is_active: options.is_active }),
      },
      populate: this.getPopulateOptions(),
    });
  }

  findConnectionById(id: string, session?: ClientSession) {
    const query = this.model
      .findOne({ ...this.getTenantFilter(), _id: id })
      .populate(this.getPopulateOptions());
    if (session) query.session(session);
    return query.lean();
  }

  findActiveForStorePlatform(
    storeId: string,
    platform: string,
    session?: ClientSession
  ) {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      store: storeId,
      platform,
      is_active: true,
    });
    if (session) query.session(session);
    return query.lean();
  }

  createConnection(data: UpdateQuery<TStoreChannel>) {
    return this.model.create({
      ...data,
      ...this.getTenantFields(),
    });
  }

  updateConnection(
    id: string,
    data: UpdateQuery<TStoreChannel>
  ) {
    return this.model
      .findOneAndUpdate(
        { ...this.getTenantFilter(), _id: id },
        { $set: data },
        { new: true, runValidators: true }
      )
      .lean();
  }

  archiveConnection(id: string) {
    return this.model
      .findOneAndUpdate(
        { ...this.getTenantFilter(), _id: id },
        { $set: { is_active: false } },
        { new: true, runValidators: true }
      )
      .lean();
  }
}
