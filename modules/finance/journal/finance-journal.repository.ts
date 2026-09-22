import type { ClientSession, QueryFilter } from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import {
  FinanceJournalEntryModel,
  type TFinanceJournalEntry,
} from './finance-journal.model';
import type { FinanceTenantContext } from '../finance.types';

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
