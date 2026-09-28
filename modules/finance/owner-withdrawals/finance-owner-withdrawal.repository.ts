import { Types, type ClientSession } from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FinanceOwnerWithdrawalModel,
  type TFinanceOwnerWithdrawal,
} from './finance-owner-withdrawal.model';
import type {
  FinanceOwnerWithdrawalListQueryDTO,
  FinanceOwnerWithdrawalStatusDTO,
} from './finance-owner-withdrawal.dto';

export type FinanceOwnerWithdrawalPersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  owner_account: Types.ObjectId;
  owner_account_code: string;
  owner_account_name: string;
  payment_account: Types.ObjectId;
  payment_account_code: string;
  payment_account_name: string;
  amount: number;
  transaction_date: Date;
  description: string;
  reference?: string | null;
  status: FinanceOwnerWithdrawalStatusDTO;
  journal_entry?: Types.ObjectId | null;
  idempotency_key: string;
  created_at?: Date;
  updated_at?: Date;
};

export type CreateFinanceOwnerWithdrawalRecord = Omit<
  FinanceOwnerWithdrawalPersistenceRecord,
  '_id' | 'organization' | 'created_at' | 'updated_at'
>;

export class FinanceOwnerWithdrawalRepository extends BaseRepository<TFinanceOwnerWithdrawal> {
  constructor(context: FinanceTenantContext) {
    super(FinanceOwnerWithdrawalModel, context);
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    session?: ClientSession
  ): Promise<FinanceOwnerWithdrawalPersistenceRecord | null> {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      idempotency_key: idempotencyKey,
    });
    if (session) query.session(session);

    return query
      .lean<FinanceOwnerWithdrawalPersistenceRecord | null>()
      .exec();
  }

  async findWithdrawalById(
    id: string,
    session?: ClientSession
  ): Promise<FinanceOwnerWithdrawalPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query = this.model.findOne({
      ...this.getTenantFilter(),
      _id: new Types.ObjectId(id),
    });
    if (session) query.session(session);

    return query
      .lean<FinanceOwnerWithdrawalPersistenceRecord | null>()
      .exec();
  }

  async listRecent(
    filter: FinanceOwnerWithdrawalListQueryDTO,
    session?: ClientSession
  ): Promise<FinanceOwnerWithdrawalPersistenceRecord[]> {
    const query = this.model
      .find(this.getTenantFilter())
      .sort({
        transaction_date: -1,
        created_at: -1,
        _id: -1,
      })
      .limit(filter.limit);
    if (session) query.session(session);

    return query
      .lean<FinanceOwnerWithdrawalPersistenceRecord[]>()
      .exec();
  }

  async createDraft(
    data: CreateFinanceOwnerWithdrawalRecord,
    session?: ClientSession
  ): Promise<FinanceOwnerWithdrawalPersistenceRecord> {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
      status: 'draft',
    });
    const saved = await document.save(
      session ? { session } : undefined
    );

    return saved.toObject() as unknown as FinanceOwnerWithdrawalPersistenceRecord;
  }

  async markPosted(
    id: string,
    journalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceOwnerWithdrawalPersistenceRecord | null> {
    if (
      !Types.ObjectId.isValid(id) ||
      !Types.ObjectId.isValid(journalEntryId)
    ) {
      return null;
    }

    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        _id: new Types.ObjectId(id),
        status: 'draft',
      },
      {
        $set: {
          status: 'posted',
          journal_entry: new Types.ObjectId(journalEntryId),
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );

    return query
      .lean<FinanceOwnerWithdrawalPersistenceRecord | null>()
      .exec();
  }
}
