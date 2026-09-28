import {
  Types,
  type ClientSession,
  type QueryFilter,
} from 'mongoose';
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
  reversal_journal_entry?: Types.ObjectId | null;
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

  async list(
    filter: FinanceOwnerWithdrawalListQueryDTO,
    session?: ClientSession
  ): Promise<{
    records: FinanceOwnerWithdrawalPersistenceRecord[];
    total: number;
  }> {
    const from = new Date(
      `${filter.from_date}T00:00:00.000Z`
    );
    const toExclusive = new Date(
      `${filter.to_date}T00:00:00.000Z`
    );
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
    const queryFilter: QueryFilter<TFinanceOwnerWithdrawal> =
      {
        ...this.getTenantFilter(),
        transaction_date: {
          $gte: from,
          $lt: toExclusive,
        },
        ...(filter.owner_account_id
          ? {
              owner_account: new Types.ObjectId(
                filter.owner_account_id
              ),
            }
          : {}),
      };
    const query = this.model
      .find(queryFilter)
      .sort({
        transaction_date: -1,
        created_at: -1,
        _id: -1,
      })
      .skip((filter.page - 1) * filter.limit)
      .limit(filter.limit);
    const countQuery =
      this.model.countDocuments(queryFilter);
    if (session) {
      query.session(session);
      countQuery.session(session);
    }

    const [records, total] = await Promise.all([
      query
        .lean<FinanceOwnerWithdrawalPersistenceRecord[]>()
        .exec(),
      countQuery.exec(),
    ]);
    return { records, total };
  }

  async findByJournalEntry(
    journalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceOwnerWithdrawalPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(journalEntryId))
      return null;

    const query = this.model.findOne({
      ...this.getTenantFilter(),
      journal_entry: new Types.ObjectId(journalEntryId),
    });
    if (session) query.session(session);
    return query
      .lean<FinanceOwnerWithdrawalPersistenceRecord | null>()
      .exec();
  }

  async markReversedByJournalEntry(
    journalEntryId: string,
    reversalJournalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceOwnerWithdrawalPersistenceRecord | null> {
    if (
      !Types.ObjectId.isValid(journalEntryId) ||
      !Types.ObjectId.isValid(reversalJournalEntryId)
    ) {
      return null;
    }

    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        journal_entry: new Types.ObjectId(journalEntryId),
        status: 'posted',
      },
      {
        $set: {
          status: 'reversed',
          reversal_journal_entry: new Types.ObjectId(
            reversalJournalEntryId
          ),
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
