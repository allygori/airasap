import type { ClientSession } from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import {
  SettlementModel,
  type TSettlement,
} from './settlement.model';
import type { AccountingTenantContext } from '../accounting.types';

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
