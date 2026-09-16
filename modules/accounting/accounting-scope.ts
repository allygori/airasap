import { Types } from 'mongoose';
import { AccountingDomainError } from './accounting.error';
import { JournalEntryModel } from './journal-entries/journal-entry.model';
import { OrderModel } from '@/modules/orders/order.model';
import { StoreChannelModel } from '@/modules/stores/channels/store-channel.model';
import { StoreModel } from '@/modules/stores/store.model';

export type AccountingScopeQuery = {
  store_id?: string;
  platform?: string;
};

export type AccountingScope = {
  store?: Types.ObjectId;
  platform?: string;
};

export type AccountingScopeOptions = {
  stores: Array<{
    id: string;
    name: string;
    code: string | null;
  }>;
  platforms: string[];
};

export const resolveAccountingScope = async (
  organization: Types.ObjectId,
  query: AccountingScopeQuery
): Promise<AccountingScope> => {
  if (!query.store_id) {
    return {
      ...(query.platform
        ? { platform: query.platform }
        : {}),
    };
  }

  if (!Types.ObjectId.isValid(query.store_id)) {
    throw new AccountingDomainError(
      'store_id harus berupa ObjectId yang valid.',
      'ACCOUNTING_STORE_FILTER_INVALID'
    );
  }

  const store = await StoreModel.findOne({
    organization,
    _id: query.store_id,
    deleted_at: null,
  })
    .select('_id')
    .lean();

  if (!store) {
    throw new AccountingDomainError(
      'Store/workspace tidak ditemukan dalam organization aktif.',
      'ACCOUNTING_STORE_FILTER_NOT_FOUND'
    );
  }

  return {
    store: store._id,
    ...(query.platform ? { platform: query.platform } : {}),
  };
};

export const getJournalDimensionFilter = (
  scope: AccountingScope
) => ({
  ...(scope.store
    ? { 'lines.dimensions.store': String(scope.store) }
    : {}),
  ...(scope.platform
    ? { 'lines.dimensions.platform': scope.platform }
    : {}),
});

export const getAccountingScopeOptions = async (
  organization: Types.ObjectId
): Promise<AccountingScopeOptions> => {
  const [
    stores,
    orderPlatforms,
    channelPlatforms,
    journalPlatforms,
  ] = await Promise.all([
    StoreModel.find({
      organization,
      is_active: true,
      deleted_at: null,
    })
      .select('_id name code')
      .sort({ name: 1 })
      .lean(),
    OrderModel.distinct('platform', { organization }),
    StoreChannelModel.distinct('platform', {
      organization,
      is_active: true,
    }),
    JournalEntryModel.distinct(
      'lines.dimensions.platform',
      {
        organization,
        status: 'posted',
      }
    ),
  ]);

  return {
    stores: stores.map((store) => ({
      id: String(store._id),
      name: store.name,
      code: store.code ?? null,
    })),
    platforms: [
      ...new Set(
        [
          ...orderPlatforms,
          ...channelPlatforms,
          ...journalPlatforms,
        ]
          .map((platform) =>
            typeof platform === 'string'
              ? platform.trim()
              : ''
          )
          .filter(Boolean)
      ),
    ].sort(),
  };
};
