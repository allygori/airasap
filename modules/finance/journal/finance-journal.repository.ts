import {
  Types,
  type ClientSession,
  type PipelineStage,
  type QueryFilter,
} from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import {
  FinanceJournalEntryModel,
  type TFinanceJournalEntry,
} from './finance-journal.model';
import type { FinanceTenantContext } from '../finance.types';

type FinanceJournalListFilter = {
  page: number;
  limit: number;
  period?: string;
  status?: 'posted' | 'reversed';
  source_type?: string;
  search?: string;
};

export type FinanceLedgerPersistenceRow = {
  _id: TFinanceJournalEntry['_id'];
  entry_number: string;
  transaction_date: Date;
  posting_date: Date;
  description: string;
  source_type: string;
  line_index: number;
  lines: TFinanceJournalEntry['lines'][number];
};

export type FinanceAccountBalancePersistenceRecord = {
  _id: Types.ObjectId;
  debit_total: number;
  credit_total: number;
  opening_debit_total: number;
  opening_credit_total: number;
  journal_line_count: number;
  last_transaction_date: Date | null;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export type FinanceJournalPersistenceRecord = {
  _id: TFinanceJournalEntry['_id'];
  organization: TFinanceJournalEntry['organization'];
  entry_number: string;
  transaction_date: Date;
  posting_date: Date;
  period: string;
  currency: string;
  description: string;
  source_type: string;
  source_id: string;
  source_event: string;
  idempotency_key: string;
  idempotency_hash: string;
  status: TFinanceJournalEntry['status'];
  posted_at: Date;
  posted_by?: TFinanceJournalEntry['posted_by'];
  reversal_of?: TFinanceJournalEntry['reversal_of'];
  lines: TFinanceJournalEntry['lines'];
};

export type CreateFinanceJournalRecord = Omit<
  FinanceJournalPersistenceRecord,
  '_id' | 'organization'
>;

export class FinanceJournalRepository extends BaseRepository<TFinanceJournalEntry> {
  constructor(context: FinanceTenantContext) {
    super(FinanceJournalEntryModel, context);
  }

  // Aggregation pipelines do not cast tenant IDs like Mongoose queries do.
  protected override getTenantFilter(): QueryFilter<TFinanceJournalEntry> {
    return {
      organization: new Types.ObjectId(
        this.tenantContext.organizationId
      ),
    } as QueryFilter<TFinanceJournalEntry>;
  }

  async hasAnyEntries(
    session?: ClientSession
  ): Promise<boolean> {
    const query = this.model.exists(this.getTenantFilter());
    if (session) query.session(session);
    return Boolean(await query.exec());
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    session?: ClientSession
  ): Promise<FinanceJournalPersistenceRecord | null> {
    const filter: QueryFilter<TFinanceJournalEntry> = {
      ...this.getTenantFilter(),
      idempotency_key: idempotencyKey,
    };
    const query = this.model.findOne(filter);
    if (session) query.session(session);
    return query
      .lean<FinanceJournalPersistenceRecord | null>()
      .exec();
  }

  async list(
    filter: FinanceJournalListFilter,
    session?: ClientSession
  ): Promise<{
    records: FinanceJournalPersistenceRecord[];
    total: number;
  }> {
    const queryFilter: QueryFilter<TFinanceJournalEntry> = {
      ...this.getTenantFilter(),
      ...(filter.period ? { period: filter.period } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.source_type
        ? { source_type: filter.source_type }
        : {}),
    };

    if (filter.search) {
      const search = new RegExp(
        escapeRegex(filter.search),
        'i'
      );
      queryFilter.$or = [
        { entry_number: search },
        { description: search },
        { source_id: search },
      ];
    }

    const query = this.model
      .find(queryFilter)
      .sort({
        transaction_date: -1,
        posting_date: -1,
        entry_number: -1,
      })
      .skip((filter.page - 1) * filter.limit)
      .limit(filter.limit);
    if (session) query.session(session);

    const countQuery =
      this.model.countDocuments(queryFilter);
    if (session) countQuery.session(session);

    const [records, total] = await Promise.all([
      query
        .lean<FinanceJournalPersistenceRecord[]>()
        .exec(),
      countQuery.exec(),
    ]);

    return { records, total };
  }

  async createPosted(
    data: CreateFinanceJournalRecord,
    session?: ClientSession
  ): Promise<FinanceJournalPersistenceRecord> {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
    });
    const saved = await document.save(
      session ? { session } : undefined
    );
    return saved.toObject() as unknown as FinanceJournalPersistenceRecord;
  }

  async findEntryById(
    id: string,
    session?: ClientSession
  ): Promise<FinanceJournalPersistenceRecord | null> {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      _id: id,
    });
    if (session) query.session(session);
    return query
      .lean<FinanceJournalPersistenceRecord | null>()
      .exec();
  }

  async findLedgerLines(
    accountId: string,
    period: string | undefined,
    maxRows: number,
    session?: ClientSession
  ): Promise<{
    rows: FinanceLedgerPersistenceRow[];
    total: number;
  }> {
    const accountObjectId = new Types.ObjectId(accountId);
    const baseMatch = {
      ...this.getTenantFilter(),
      status: 'posted',
      ...(period ? { period } : {}),
    };
    const unwind = {
      $unwind: {
        path: '$lines',
        includeArrayIndex: 'line_index',
      },
    } as const;
    const accountMatch = {
      $match: { 'lines.account_id': accountObjectId },
    } as const;

    const dataAggregate =
      this.model.aggregate<FinanceLedgerPersistenceRow>([
        { $match: baseMatch },
        unwind,
        accountMatch,
        {
          $project: {
            entry_number: 1,
            transaction_date: 1,
            posting_date: 1,
            description: 1,
            source_type: 1,
            line_index: 1,
            lines: 1,
          },
        },
        {
          $sort: {
            transaction_date: 1,
            posting_date: 1,
            entry_number: 1,
            _id: 1,
          },
        },
        { $limit: maxRows },
      ]);
    const countAggregate = this.model.aggregate<{
      total: number;
    }>([
      { $match: baseMatch },
      unwind,
      accountMatch,
      { $count: 'total' },
    ]);
    if (session) {
      dataAggregate.session(session);
      countAggregate.session(session);
    }

    const [rows, countRows] = await Promise.all([
      dataAggregate.exec(),
      countAggregate.exec(),
    ]);

    return { rows, total: countRows[0]?.total ?? 0 };
  }

  async aggregatePostedAccountBalances(
    accountIds: string[],
    session?: ClientSession
  ): Promise<FinanceAccountBalancePersistenceRecord[]> {
    const objectIds = accountIds
      .filter((accountId) =>
        Types.ObjectId.isValid(accountId)
      )
      .map((accountId) => new Types.ObjectId(accountId));
    if (objectIds.length === 0) return [];

    const pipeline: PipelineStage[] = [
      {
        $match: {
          ...this.getTenantFilter(),
          status: 'posted',
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
          _id: '$lines.account_id',
          debit_total: { $sum: '$lines.debit' },
          credit_total: { $sum: '$lines.credit' },
          opening_debit_total: {
            $sum: {
              $cond: [
                {
                  $eq: ['$source_type', 'opening_balance'],
                },
                '$lines.debit',
                0,
              ],
            },
          },
          opening_credit_total: {
            $sum: {
              $cond: [
                {
                  $eq: ['$source_type', 'opening_balance'],
                },
                '$lines.credit',
                0,
              ],
            },
          },
          journal_line_count: { $sum: 1 },
          last_transaction_date: {
            $max: '$transaction_date',
          },
        },
      },
    ];

    const aggregate =
      this.model.aggregate<FinanceAccountBalancePersistenceRecord>(
        pipeline
      );
    if (session) aggregate.session(session);
    return aggregate.exec();
  }

  async findByReversalOf(
    journalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceJournalPersistenceRecord | null> {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      reversal_of: journalEntryId,
    });
    if (session) query.session(session);
    return query
      .lean<FinanceJournalPersistenceRecord | null>()
      .exec();
  }

  async markReversed(
    id: string,
    session?: ClientSession
  ): Promise<FinanceJournalPersistenceRecord | null> {
    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        _id: id,
        status: 'posted',
      },
      { $set: { status: 'reversed' } },
      {
        returnDocument: 'after',
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );
    return query
      .lean<FinanceJournalPersistenceRecord | null>()
      .exec();
  }
}
