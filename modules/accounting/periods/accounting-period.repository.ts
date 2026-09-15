import type { ClientSession } from 'mongoose';
import { BaseRepository } from '../../base.repository';
import {
  AccountingPeriodModel,
  type TAccountingPeriod,
} from './accounting-period.model';
import type { AccountingTenantContext } from '../accounting.types';

export class AccountingPeriodRepository extends BaseRepository<TAccountingPeriod> {
  constructor(context: AccountingTenantContext) {
    super(AccountingPeriodModel, context);
  }

  async findByPeriodKey(
    periodKey: string,
    session?: ClientSession
  ) {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      period_key: periodKey,
    });
    if (session) query.session(session);
    return query.lean();
  }

  async findOpenContainingDate(
    periodKey: string,
    date: Date,
    session?: ClientSession
  ) {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      period_key: periodKey,
      status: 'open',
      start_date: { $lte: date },
      end_date: { $gte: date },
    });
    if (session) query.session(session);
    return query.lean();
  }

  async createPeriod(
    data: {
      period_key: string;
      start_date: Date;
      end_date: Date;
      status: 'open' | 'closed';
      closed_at?: Date;
      closed_by?: string;
    },
    session?: ClientSession
  ) {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
    });
    return document.save(session ? { session } : undefined);
  }

  async closePeriod(
    periodKey: string,
    closedBy: string | undefined,
    session?: ClientSession
  ) {
    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        period_key: periodKey,
        status: 'open',
      },
      {
        $set: {
          status: 'closed',
          closed_at: new Date(),
          ...(closedBy ? { closed_by: closedBy } : {}),
        },
      },
      {
        new: true,
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );
    return query.lean();
  }
}
