import {
  Types,
  type ClientSession,
  type PipelineStage,
} from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import {
  FinanceJournalEntryModel,
  type TFinanceJournalEntry,
} from '../journal/finance-journal.model';
import type { FinanceTenantContext } from '../finance.types';
import {
  FinanceSettlementModel,
  type TFinanceSettlement,
} from './finance-settlement.model';
import type {
  FinanceSettlementStatusDTO,
  FinanceSubledgerListQueryDTO,
  FinanceSubledgerTypeDTO,
} from './finance-subledger.dto';

export type FinanceSourceJournalPersistenceRecord = {
  _id: Types.ObjectId;
  source_type: string;
  source_id: string;
  description: string;
  transaction_date: Date;
  currency: string;
  lines: TFinanceJournalEntry['lines'];
};

export type FinanceSettlementPersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  balance_type: FinanceSubledgerTypeDTO;
  source_journal_entry: Types.ObjectId;
  source_type: string;
  source_id: string;
  source_description: string;
  amount: number;
  settlement_date: Date;
  payment_account: Types.ObjectId;
  payment_account_code: string;
  payment_account_name: string;
  reference?: string | null;
  description: string;
  status: FinanceSettlementStatusDTO;
  journal_entry?: Types.ObjectId | null;
  idempotency_key: string;
  created_at?: Date;
  updated_at?: Date;
};

export type CreateFinanceSettlementRecord = Omit<
  FinanceSettlementPersistenceRecord,
  '_id' | 'organization' | 'created_at' | 'updated_at'
>;

export type FinanceSourceBalanceAggregate = {
  source_journal_entry: Types.ObjectId;
  source_type: string;
  source_id: string;
  description: string;
  transaction_date: Date;
  currency: string;
  account_id: Types.ObjectId;
  original_amount: number;
};

export type FinanceSettlementTotal = {
  _id: Types.ObjectId;
  settled_amount: number;
  last_settlement_date: Date | null;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class FinanceSubledgerRepository extends BaseRepository<TFinanceSettlement> {
  private readonly organizationId: Types.ObjectId;

  constructor(context: FinanceTenantContext) {
    super(FinanceSettlementModel, context);
    this.organizationId = new Types.ObjectId(
      context.organizationId
    );
  }

  async listSourceBalances(
    input: FinanceSubledgerListQueryDTO,
    accountIds: string[],
    session?: ClientSession
  ): Promise<FinanceSourceBalanceAggregate[]> {
    const objectIds = accountIds
      .filter((accountId) =>
        Types.ObjectId.isValid(accountId)
      )
      .map((accountId) => new Types.ObjectId(accountId));
    if (objectIds.length === 0) return [];

    const sourceTypes =
      input.balance_type === 'receivable'
        ? ['order']
        : ['purchase', 'expense'];
    const balanceExpression =
      input.balance_type === 'receivable'
        ? { $subtract: ['$lines.debit', '$lines.credit'] }
        : { $subtract: ['$lines.credit', '$lines.debit'] };
    const pipeline: PipelineStage[] = [
      {
        $match: {
          organization: this.organizationId,
          status: 'posted',
          source_type: { $in: sourceTypes },
        },
      },
      { $unwind: '$lines' },
      {
        $match: {
          'lines.account_id': { $in: objectIds },
        },
      },
      {
        $group: {
          _id: '$_id',
          source_journal_entry: { $first: '$_id' },
          source_type: { $first: '$source_type' },
          source_id: { $first: '$source_id' },
          description: { $first: '$description' },
          transaction_date: { $first: '$transaction_date' },
          currency: { $first: '$currency' },
          account_id: { $first: '$lines.account_id' },
          original_amount: { $sum: balanceExpression },
        },
      },
      { $match: { original_amount: { $gt: 0 } } },
      {
        $sort: {
          transaction_date: -1,
          _id: -1,
        },
      },
      { $limit: 1000 },
    ];
    if (input.search) {
      const search = new RegExp(
        escapeRegex(input.search),
        'i'
      );
      pipeline.splice(5, 0, {
        $match: {
          $or: [
            { source_id: search },
            { source_type: search },
            { description: search },
          ],
        },
      });
    }

    const aggregate =
      FinanceJournalEntryModel.aggregate<FinanceSourceBalanceAggregate>(
        pipeline
      );
    if (session) aggregate.session(session);
    return aggregate.exec();
  }

  async findSourceJournal(
    sourceJournalEntryId: string,
    balanceType: FinanceSubledgerTypeDTO,
    accountIds: string[],
    session?: ClientSession
  ): Promise<FinanceSourceJournalPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(sourceJournalEntryId))
      return null;
    const objectIds = accountIds
      .filter((accountId) =>
        Types.ObjectId.isValid(accountId)
      )
      .map((accountId) => new Types.ObjectId(accountId));
    if (objectIds.length === 0) return null;
    const sourceTypes =
      balanceType === 'receivable'
        ? ['order']
        : ['purchase', 'expense'];
    const query = FinanceJournalEntryModel.findOne({
      organization: this.organizationId,
      _id: new Types.ObjectId(sourceJournalEntryId),
      status: 'posted',
      source_type: { $in: sourceTypes },
      lines: {
        $elemMatch: { account_id: { $in: objectIds } },
      },
    });
    if (session) query.session(session);
    return query
      .lean<FinanceSourceJournalPersistenceRecord | null>()
      .exec();
  }

  async listSettlementTotals(
    sourceJournalEntryIds: string[],
    balanceType: FinanceSubledgerTypeDTO,
    session?: ClientSession
  ): Promise<FinanceSettlementTotal[]> {
    const objectIds = sourceJournalEntryIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) return [];
    const aggregate =
      FinanceSettlementModel.aggregate<FinanceSettlementTotal>(
        [
          {
            $match: {
              organization: this.organizationId,
              balance_type: balanceType,
              status: 'posted',
              source_journal_entry: { $in: objectIds },
            },
          },
          {
            $group: {
              _id: '$source_journal_entry',
              settled_amount: { $sum: '$amount' },
              last_settlement_date: {
                $max: '$settlement_date',
              },
            },
          },
        ]
      );
    if (session) aggregate.session(session);
    return aggregate.exec();
  }

  async sumSettledAmount(
    sourceJournalEntryId: string,
    balanceType: FinanceSubledgerTypeDTO,
    session?: ClientSession
  ): Promise<number> {
    const totals = await this.listSettlementTotals(
      [sourceJournalEntryId],
      balanceType,
      session
    );
    return totals[0]?.settled_amount ?? 0;
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    session?: ClientSession
  ): Promise<FinanceSettlementPersistenceRecord | null> {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      idempotency_key: idempotencyKey,
    });
    if (session) query.session(session);
    return query
      .lean<FinanceSettlementPersistenceRecord | null>()
      .exec();
  }

  async createPending(
    data: CreateFinanceSettlementRecord,
    session?: ClientSession
  ): Promise<FinanceSettlementPersistenceRecord> {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
      status: 'pending',
    });
    const saved = await document.save(
      session ? { session } : undefined
    );
    return saved.toObject() as unknown as FinanceSettlementPersistenceRecord;
  }

  async markPosted(
    id: string,
    journalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceSettlementPersistenceRecord | null> {
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
        status: 'pending',
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
      .lean<FinanceSettlementPersistenceRecord | null>()
      .exec();
  }
}
