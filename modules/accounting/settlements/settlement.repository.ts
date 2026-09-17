import { Types, type ClientSession } from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import {
  SettlementModel,
  type TSettlement,
} from './settlement.model';
import type { AccountingTenantContext } from '../accounting.types';
import type { OrderPlatform } from '@/constant/order-platform';

export type SettlementReconciliationFilter = {
  status?: 'draft' | 'posted' | 'blocked' | 'voided';
  settlement_stage?: 'funds_released' | 'payout_received';
  platform?: OrderPlatform;
  source_file?: string;
};

export class SettlementRepository extends BaseRepository<TSettlement> {
  constructor(context: AccountingTenantContext) {
    super(SettlementModel, context);
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    session?: ClientSession
  ) {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      idempotency_key: idempotencyKey,
    });
    if (session) query.session(session);
    return query.lean();
  }

  async findSettlementById(
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

  async getPostedPayoutTotal(
    sourceSettlementId: string,
    session?: ClientSession
  ) {
    const sourceSettlement = new Types.ObjectId(
      sourceSettlementId
    );
    const aggregate = this.model.aggregate<{
      total: number;
    }>([
      {
        $match: {
          organization: new Types.ObjectId(
            this.tenantContext.organizationId
          ),
          source_settlement: sourceSettlement,
          settlement_stage: 'payout_received',
          status: 'posted',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$net_amount' },
        },
      },
    ]);
    if (session) aggregate.session(session);
    const [result] = await aggregate;
    return result?.total ?? 0;
  }

  async findReconciliationPage(
    filter: SettlementReconciliationFilter,
    page: number,
    limit: number
  ) {
    const scopedFilter = {
      ...this.getTenantFilter(),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.settlement_stage
        ? { settlement_stage: filter.settlement_stage }
        : {}),
      ...(filter.platform
        ? { platform: filter.platform }
        : {}),
      ...(filter.source_file
        ? {
            source_file: new Types.ObjectId(
              filter.source_file
            ),
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.model
        .find(scopedFilter)
        .sort({ settled_at: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.model.countDocuments(scopedFilter),
    ]);

    const aggregate = this.model.aggregate<{
      _id: {
        settlement_stage: string;
        status: string;
        reconciliation_status: string;
        platform: string;
        source_file?: Types.ObjectId;
      };
      count: number;
      gross_amount: number;
      fee_amount: number;
      net_amount: number;
      reconciliation_difference: number;
    }>([
      {
        $match: {
          organization: new Types.ObjectId(
            this.tenantContext.organizationId
          ),
          ...(filter.status
            ? { status: filter.status }
            : {}),
          ...(filter.settlement_stage
            ? { settlement_stage: filter.settlement_stage }
            : {}),
          ...(filter.platform
            ? { platform: filter.platform }
            : {}),
          ...(filter.source_file
            ? {
                source_file: new Types.ObjectId(
                  filter.source_file
                ),
              }
            : {}),
        },
      },
      {
        $group: {
          _id: {
            settlement_stage: '$settlement_stage',
            status: '$status',
            reconciliation_status: '$reconciliation_status',
            platform: '$platform',
            source_file: '$source_file',
          },
          count: { $sum: 1 },
          gross_amount: { $sum: '$gross_amount' },
          fee_amount: { $sum: '$fee_amount' },
          net_amount: { $sum: '$net_amount' },
          reconciliation_difference: {
            $sum: '$reconciliation_difference',
          },
        },
      },
      {
        $sort: {
          '_id.source_file': 1,
          '_id.platform': 1,
          '_id.settlement_stage': 1,
        },
      },
    ]);
    const summary = await aggregate;

    return {
      rows,
      total,
      page,
      limit,
      summary,
    };
  }

  async createSettlement(
    data: Record<string, unknown>,
    session?: ClientSession
  ) {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
    });
    return document.save(session ? { session } : undefined);
  }

  async markPosted(
    id: string,
    journalEntryId: string,
    session?: ClientSession
  ) {
    return this.model
      .findOneAndUpdate(
        {
          ...this.getTenantFilter(),
          _id: id,
          status: 'draft',
        },
        {
          $set: {
            status: 'posted',
            journal_entry: journalEntryId,
          },
        },
        {
          new: true,
          runValidators: true,
          ...(session ? { session } : {}),
        }
      )
      .lean();
  }

  async updateForRetry(
    id: string,
    data: Record<string, unknown>,
    session?: ClientSession
  ) {
    return this.model
      .findOneAndUpdate(
        {
          ...this.getTenantFilter(),
          _id: id,
          status: 'draft',
        },
        {
          $set: data,
          $unset: { blocked_reason: 1 },
        },
        {
          new: true,
          runValidators: true,
          ...(session ? { session } : {}),
        }
      )
      .lean();
  }

  async markBlocked(
    id: string,
    reason: string,
    difference: number,
    session?: ClientSession
  ) {
    return this.model
      .findOneAndUpdate(
        {
          ...this.getTenantFilter(),
          _id: id,
          status: { $in: ['draft', 'blocked'] },
        },
        {
          $set: {
            status: 'blocked',
            blocked_reason: reason,
            reconciliation_status: 'exception',
            reconciliation_difference: difference,
          },
        },
        {
          new: true,
          runValidators: true,
          ...(session ? { session } : {}),
        }
      )
      .lean();
  }

  async resetForRetry(id: string, session?: ClientSession) {
    return this.model
      .findOneAndUpdate(
        {
          ...this.getTenantFilter(),
          _id: id,
          status: 'blocked',
        },
        {
          $set: { status: 'draft' },
          $unset: { blocked_reason: 1 },
        },
        {
          new: true,
          runValidators: true,
          ...(session ? { session } : {}),
        }
      )
      .lean();
  }
}
