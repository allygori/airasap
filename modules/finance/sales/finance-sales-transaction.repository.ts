import {
  Types,
  type ClientSession,
  type QueryFilter,
} from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FinanceSalesTransactionModel,
  type TFinanceSalesTransaction,
} from './finance-sales-transaction.model';
import type {
  FinanceSalesPostingModeDTO,
  FinanceSalesTransactionStatusDTO,
} from './finance-sales.dto';

export type FinanceSalesTransactionPersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  source_order_id: string;
  source_order_number: string;
  store_id: string | null;
  platform: string;
  source_status: string | null;
  transaction_date: Date | null;
  currency: string;
  sales_amount: number | null;
  posting_mode: FinanceSalesPostingModeDTO;
  status: FinanceSalesTransactionStatusDTO;
  idempotency_key: string;
  blocked_reason: string | null;
  journal_entry_id: Types.ObjectId | null;
  source_lines: TFinanceSalesTransaction['source_lines'];
  intent_source_event: TFinanceSalesTransaction['intent_source_event'];
  intent_transaction_date: Date | null;
  intent_description: string | null;
  intent_lines: TFinanceSalesTransaction['intent_lines'];
  inventory_cogs_deferred_reason: string | null;
  created_at?: Date;
  updated_at?: Date;
};

export type CreateFinanceSalesTransactionRecord = Omit<
  FinanceSalesTransactionPersistenceRecord,
  '_id' | 'organization' | 'created_at' | 'updated_at'
>;

export class FinanceSalesTransactionRepository extends BaseRepository<TFinanceSalesTransaction> {
  constructor(context: FinanceTenantContext) {
    super(FinanceSalesTransactionModel, context);
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    session?: ClientSession
  ): Promise<FinanceSalesTransactionPersistenceRecord | null> {
    const filter: QueryFilter<TFinanceSalesTransaction> = {
      ...this.getTenantFilter(),
      idempotency_key: idempotencyKey,
    };
    const query = this.model.findOne(filter);
    if (session) query.session(session);
    return query
      .lean<FinanceSalesTransactionPersistenceRecord | null>()
      .exec();
  }

  async createTransaction(
    data: CreateFinanceSalesTransactionRecord,
    session?: ClientSession
  ): Promise<FinanceSalesTransactionPersistenceRecord> {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
    });
    const saved = await document.save(
      session ? { session } : undefined
    );
    return saved.toObject() as unknown as FinanceSalesTransactionPersistenceRecord;
  }

  async markBlocked(
    id: string,
    reason: string,
    session?: ClientSession
  ): Promise<FinanceSalesTransactionPersistenceRecord | null> {
    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        _id: id,
        status: { $in: ['pending', 'blocked'] },
      },
      {
        $set: {
          status: 'blocked',
          blocked_reason: reason,
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );
    return query
      .lean<FinanceSalesTransactionPersistenceRecord | null>()
      .exec();
  }

  async markPosted(
    id: string,
    journalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceSalesTransactionPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(journalEntryId))
      return null;

    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        _id: id,
        status: { $in: ['pending', 'blocked'] },
      },
      {
        $set: {
          status: 'posted',
          journal_entry_id: new Types.ObjectId(
            journalEntryId
          ),
          blocked_reason: null,
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );
    return query
      .lean<FinanceSalesTransactionPersistenceRecord | null>()
      .exec();
  }
}
