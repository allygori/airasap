import type { ClientSession, QueryFilter } from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import {
  FinancePeriodModel,
  type TFinancePeriod,
} from './finance-period.model';
import type { FinanceTenantContext } from '../finance.types';

export type FinancePeriodPersistenceRecord = {
  _id: TFinancePeriod['_id'];
  organization: TFinancePeriod['organization'];
  period_key: string;
  start_date: Date;
  end_date: Date;
  status: TFinancePeriod['status'];
  closed_at?: Date;
  closed_by?: TFinancePeriod['closed_by'];
};

export class FinancePeriodRepository extends BaseRepository<TFinancePeriod> {
  constructor(context: FinanceTenantContext) {
    super(FinancePeriodModel, context);
  }

  async findByPeriodKey(
    periodKey: string,
    session?: ClientSession
  ): Promise<FinancePeriodPersistenceRecord | null> {
    const filter: QueryFilter<TFinancePeriod> = {
      ...this.getTenantFilter(),
      period_key: periodKey,
    };
    const query = this.model.findOne(filter);
    if (session) query.session(session);
    return query
      .lean<FinancePeriodPersistenceRecord | null>()
      .exec();
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
  ): Promise<FinancePeriodPersistenceRecord> {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
    });
    const saved = await document.save(
      session ? { session } : undefined
    );
    return saved.toObject() as unknown as FinancePeriodPersistenceRecord;
  }

  async closePeriod(
    periodKey: string,
    closedBy: string | undefined,
    session?: ClientSession
  ): Promise<FinancePeriodPersistenceRecord | null> {
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
        returnDocument: 'after',
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );
    return query
      .lean<FinancePeriodPersistenceRecord | null>()
      .exec();
  }
}
