import { Types } from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FinanceMarketplaceReleaseModel,
  type TFinanceMarketplaceRelease,
} from './finance-marketplace-release.model';
import type { FinanceMarketplaceReleaseFeeLineDTO } from './finance-marketplace-release.schema';

export type FinanceMarketplaceReleasePersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  source_order_reference: Types.ObjectId;
  source_order_id: string;
  source_order_number: string;
  store_id: Types.ObjectId | null;
  platform: string;
  settlement_reference: string;
  released_at: Date | null;
  expected_gross_amount: number | null;
  fee_amount: number | null;
  refund_amount: number | null;
  released_amount: number | null;
  reconciliation_difference: number | null;
  fee_lines: FinanceMarketplaceReleaseFeeLineDTO[];
  status: 'pending' | 'blocked' | 'posted';
  blocked_reason: string | null;
  journal_entry_id: Types.ObjectId | null;
  idempotency_key: string;
  source_file_id: Types.ObjectId | null;
};

export type FinanceMarketplaceReleaseSnapshot = Omit<
  FinanceMarketplaceReleasePersistenceRecord,
  | '_id'
  | 'organization'
  | 'status'
  | 'blocked_reason'
  | 'journal_entry_id'
>;

export class FinanceMarketplaceReleaseRepository extends BaseRepository<TFinanceMarketplaceRelease> {
  constructor(context: FinanceTenantContext) {
    super(FinanceMarketplaceReleaseModel, context);
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    return this.model
      .findOne({
        ...this.getTenantFilter(),
        idempotency_key: idempotencyKey,
      })
      .lean<FinanceMarketplaceReleasePersistenceRecord | null>()
      .exec();
  }

  async saveBlocked(
    snapshot: FinanceMarketplaceReleaseSnapshot,
    reason: string
  ) {
    try {
      const record = await this.model
        .findOneAndUpdate(
          {
            ...this.getTenantFilter(),
            idempotency_key: snapshot.idempotency_key,
            status: { $ne: 'posted' },
          },
          {
            $set: {
              ...snapshot,
              status: 'blocked',
              blocked_reason: reason,
            },
          },
          { new: true, upsert: true, runValidators: true }
        )
        .lean<FinanceMarketplaceReleasePersistenceRecord | null>()
        .exec();
      if (record) return record;
    } catch (error: unknown) {
      if (!isDuplicateKeyError(error)) throw error;
    }

    return this.findByIdempotencyKey(
      snapshot.idempotency_key
    );
  }

  async savePending(
    snapshot: FinanceMarketplaceReleaseSnapshot
  ) {
    try {
      const record = await this.model
        .findOneAndUpdate(
          {
            ...this.getTenantFilter(),
            idempotency_key: snapshot.idempotency_key,
            status: { $ne: 'posted' },
          },
          {
            $set: {
              ...snapshot,
              status: 'pending',
              blocked_reason: null,
            },
          },
          { new: true, upsert: true, runValidators: true }
        )
        .lean<FinanceMarketplaceReleasePersistenceRecord | null>()
        .exec();
      if (record) return record;
    } catch (error: unknown) {
      if (!isDuplicateKeyError(error)) throw error;
    }

    return this.findByIdempotencyKey(
      snapshot.idempotency_key
    );
  }

  async markPosted(
    idempotencyKey: string,
    journalEntryId: string
  ) {
    if (!Types.ObjectId.isValid(journalEntryId))
      return null;

    const record = await this.model
      .findOneAndUpdate(
        {
          ...this.getTenantFilter(),
          idempotency_key: idempotencyKey,
          status: { $ne: 'posted' },
        },
        {
          $set: {
            status: 'posted',
            blocked_reason: null,
            journal_entry_id: new Types.ObjectId(
              journalEntryId
            ),
          },
        },
        { new: true, runValidators: true }
      )
      .lean<FinanceMarketplaceReleasePersistenceRecord | null>()
      .exec();

    return (
      record ?? this.findByIdempotencyKey(idempotencyKey)
    );
  }
}

const isDuplicateKeyError = (error: unknown) =>
  Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 11000
  );
