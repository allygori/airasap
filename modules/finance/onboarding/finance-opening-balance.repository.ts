import { Types, type ClientSession } from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FinanceOpeningBalanceDraftModel,
  type TFinanceOpeningBalanceDraft,
} from './finance-opening-balance.model';
import type {
  FinanceOpeningBalanceMode,
  FinanceOpeningBalanceStatus,
} from './finance-opening-balance.constants';

export type FinanceOpeningBalanceDraftPersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  onboarding_version: number;
  status: FinanceOpeningBalanceStatus;
  cut_off_date: Date;
  mode: FinanceOpeningBalanceMode;
  description: string;
  cash_bank_lines: Array<{
    account_id: Types.ObjectId;
    amount: number;
  }>;
  inventory_lines: Array<{
    inventory_item_id: Types.ObjectId;
    location_id: Types.ObjectId;
    quantity: number;
    unit_cost?: number;
  }>;
  payable_lines: Array<{
    account_id: Types.ObjectId;
    amount: number;
    counterparty?: string;
    reference?: string;
  }>;
  receivable_lines: Array<{
    account_id: Types.ObjectId;
    amount: number;
    counterparty?: string;
    reference?: string;
  }>;
  owner_capital_account_id?: Types.ObjectId;
  owner_capital_amount?: number;
  created_at?: Date;
  updated_at?: Date;
};

export type CreateFinanceOpeningBalanceDraftRecord = Omit<
  FinanceOpeningBalanceDraftPersistenceRecord,
  '_id' | 'organization'
>;

export class FinanceOpeningBalanceDraftRepository extends BaseRepository<TFinanceOpeningBalanceDraft> {
  constructor(context: FinanceTenantContext) {
    super(FinanceOpeningBalanceDraftModel, context);
  }

  async findCurrent(
    onboardingVersion: number,
    session?: ClientSession
  ): Promise<FinanceOpeningBalanceDraftPersistenceRecord | null> {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      onboarding_version: onboardingVersion,
    });
    if (session) query.session(session);

    return query
      .lean<FinanceOpeningBalanceDraftPersistenceRecord | null>()
      .exec();
  }

  async createDraft(
    data: CreateFinanceOpeningBalanceDraftRecord,
    session?: ClientSession
  ): Promise<FinanceOpeningBalanceDraftPersistenceRecord> {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
    });
    const saved = await document.save(
      session ? { session } : undefined
    );
    return saved.toObject() as unknown as FinanceOpeningBalanceDraftPersistenceRecord;
  }

  async updateDraft(
    id: string,
    data: Partial<CreateFinanceOpeningBalanceDraftRecord>,
    session?: ClientSession
  ): Promise<FinanceOpeningBalanceDraftPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        _id: new Types.ObjectId(id),
        status: 'draft',
      },
      { $set: data },
      {
        returnDocument: 'after',
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );
    return query
      .lean<FinanceOpeningBalanceDraftPersistenceRecord | null>()
      .exec();
  }
}
