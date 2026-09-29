import {
  Types,
  type ClientSession,
  type QueryFilter,
} from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FinanceCashLoanModel,
  type TFinanceCashLoan,
} from './finance-cash-loan.model';
import type {
  FinanceCashLoanEventType,
  FinanceCashLoanLenderType,
  FinanceCashLoanStatus,
} from './finance-cash-loan.constants';
import type { FinanceCashLoanListQueryDTO } from './finance-cash-loan.dto';

export type FinanceCashLoanPersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  event_type: FinanceCashLoanEventType;
  lender_key: string;
  lender_type: FinanceCashLoanLenderType;
  lender_name: string;
  owner_account: Types.ObjectId | null;
  owner_account_code: string | null;
  owner_account_name: string | null;
  liability_account_code: string;
  liability_account_name: string;
  payment_account: Types.ObjectId;
  payment_account_code: string;
  payment_account_name: string;
  amount: number;
  transaction_date: Date;
  description: string;
  reference?: string | null;
  status: FinanceCashLoanStatus;
  journal_entry?: Types.ObjectId | null;
  reversal_journal_entry?: Types.ObjectId | null;
  idempotency_key: string;
  created_at?: Date;
  updated_at?: Date;
};

export type CreateFinanceCashLoanRecord = Omit<
  FinanceCashLoanPersistenceRecord,
  '_id' | 'organization' | 'created_at' | 'updated_at'
>;

export type FinanceCashLoanBalanceRecord = {
  _id: string;
  lender_type: FinanceCashLoanLenderType;
  lender_name: string;
  owner_account: Types.ObjectId | null;
  owner_account_code: string | null;
  owner_account_name: string | null;
  liability_account_code: string;
  liability_account_name: string;
  received_total: number;
  repayment_total: number;
};

export class FinanceCashLoanRepository extends BaseRepository<TFinanceCashLoan> {
  constructor(context: FinanceTenantContext) {
    super(FinanceCashLoanModel, context);
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    session?: ClientSession
  ): Promise<FinanceCashLoanPersistenceRecord | null> {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      idempotency_key: idempotencyKey,
    });
    if (session) query.session(session);
    return query
      .lean<FinanceCashLoanPersistenceRecord | null>()
      .exec();
  }

  async findLoanById(
    id: string,
    session?: ClientSession
  ): Promise<FinanceCashLoanPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      _id: new Types.ObjectId(id),
    });
    if (session) query.session(session);
    return query
      .lean<FinanceCashLoanPersistenceRecord | null>()
      .exec();
  }

  async list(
    filter: FinanceCashLoanListQueryDTO,
    session?: ClientSession
  ): Promise<{
    records: FinanceCashLoanPersistenceRecord[];
    total: number;
  }> {
    const queryFilter: QueryFilter<TFinanceCashLoan> = {
      ...this.getTenantFilter(),
      ...(filter.lender_key
        ? { lender_key: filter.lender_key }
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
        .lean<FinanceCashLoanPersistenceRecord[]>()
        .exec(),
      countQuery.exec(),
    ]);
    return { records, total };
  }

  async getPostedBalancesByLender(
    session?: ClientSession
  ): Promise<FinanceCashLoanBalanceRecord[]> {
    const pipeline = [
      {
        $match: {
          organization: new Types.ObjectId(
            this.tenantContext.organizationId
          ),
          status: 'posted',
        },
      },
      {
        $group: {
          _id: '$lender_key',
          lender_type: { $first: '$lender_type' },
          lender_name: { $first: '$lender_name' },
          owner_account: { $first: '$owner_account' },
          owner_account_code: {
            $first: '$owner_account_code',
          },
          owner_account_name: {
            $first: '$owner_account_name',
          },
          liability_account_code: {
            $first: '$liability_account_code',
          },
          liability_account_name: {
            $first: '$liability_account_name',
          },
          received_total: {
            $sum: {
              $cond: [
                { $eq: ['$event_type', 'received'] },
                '$amount',
                0,
              ],
            },
          },
          repayment_total: {
            $sum: {
              $cond: [
                { $eq: ['$event_type', 'repayment'] },
                '$amount',
                0,
              ],
            },
          },
        },
      },
    ];
    const aggregate =
      this.model.aggregate<FinanceCashLoanBalanceRecord>(
        pipeline
      );
    if (session) aggregate.session(session);
    return aggregate.exec();
  }

  async findByJournalEntry(
    journalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceCashLoanPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(journalEntryId))
      return null;
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      journal_entry: new Types.ObjectId(journalEntryId),
    });
    if (session) query.session(session);
    return query
      .lean<FinanceCashLoanPersistenceRecord | null>()
      .exec();
  }

  async createDraft(
    data: CreateFinanceCashLoanRecord,
    session?: ClientSession
  ): Promise<FinanceCashLoanPersistenceRecord> {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
      status: 'draft',
    });
    const saved = await document.save(
      session ? { session } : undefined
    );
    return saved.toObject() as unknown as FinanceCashLoanPersistenceRecord;
  }

  async markPosted(
    id: string,
    journalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceCashLoanPersistenceRecord | null> {
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
      .lean<FinanceCashLoanPersistenceRecord | null>()
      .exec();
  }

  async markReversedByJournalEntry(
    journalEntryId: string,
    reversalJournalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceCashLoanPersistenceRecord | null> {
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
      .lean<FinanceCashLoanPersistenceRecord | null>()
      .exec();
  }
}
