import {
  Types,
  type ClientSession,
  type QueryFilter,
} from 'mongoose';
import { escapeRegex } from '@/lib/string';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FinanceCashBankTransferModel,
  type TFinanceCashBankTransfer,
} from './finance-cash-bank-transfer.model';
import type { FinanceCashBankTransferStatusDTO } from './finance-cash-bank-transfer.dto';

export type FinanceCashBankTransferPersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  source_account: Types.ObjectId;
  source_account_code: string;
  source_account_name: string;
  destination_account: Types.ObjectId;
  destination_account_code: string;
  destination_account_name: string;
  amount: number;
  transaction_date: Date;
  reference: string | null;
  description: string;
  idempotency_key: string;
  status: FinanceCashBankTransferStatusDTO;
  journal_entry?: Types.ObjectId | null;
  reversal_journal_entry?: Types.ObjectId | null;
  created_at?: Date;
  updated_at?: Date;
};

export type CreateFinanceCashBankTransferRecord = Omit<
  FinanceCashBankTransferPersistenceRecord,
  '_id' | 'organization' | 'created_at' | 'updated_at'
>;

export class FinanceCashBankTransferRepository extends BaseRepository<TFinanceCashBankTransfer> {
  constructor(context: FinanceTenantContext) {
    super(FinanceCashBankTransferModel, context);
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    session?: ClientSession
  ): Promise<FinanceCashBankTransferPersistenceRecord | null> {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      idempotency_key: idempotencyKey,
    });
    if (session) query.session(session);

    return query
      .lean<FinanceCashBankTransferPersistenceRecord | null>()
      .exec();
  }

  async findByTransferId(
    id: string,
    session?: ClientSession
  ): Promise<FinanceCashBankTransferPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query = this.model.findOne({
      ...this.getTenantFilter(),
      _id: new Types.ObjectId(id),
    });
    if (session) query.session(session);

    return query
      .lean<FinanceCashBankTransferPersistenceRecord | null>()
      .exec();
  }

  async list(
    filter: {
      page: number;
      limit: number;
      status?: FinanceCashBankTransferStatusDTO;
      source_account_id?: string;
      search?: string;
    },
    session?: ClientSession
  ): Promise<{
    records: FinanceCashBankTransferPersistenceRecord[];
    total: number;
  }> {
    const queryFilter: QueryFilter<TFinanceCashBankTransfer> =
      {
        ...this.getTenantFilter(),
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.source_account_id
          ? {
              source_account: new Types.ObjectId(
                filter.source_account_id
              ),
            }
          : {}),
        ...(filter.search
          ? {
              $or: [
                {
                  source_account_code: new RegExp(
                    escapeRegex(filter.search),
                    'i'
                  ),
                },
                {
                  source_account_name: new RegExp(
                    escapeRegex(filter.search),
                    'i'
                  ),
                },
                {
                  destination_account_code: new RegExp(
                    escapeRegex(filter.search),
                    'i'
                  ),
                },
                {
                  destination_account_name: new RegExp(
                    escapeRegex(filter.search),
                    'i'
                  ),
                },
                {
                  reference: new RegExp(
                    escapeRegex(filter.search),
                    'i'
                  ),
                },
                {
                  description: new RegExp(
                    escapeRegex(filter.search),
                    'i'
                  ),
                },
              ],
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
        .lean<FinanceCashBankTransferPersistenceRecord[]>()
        .exec(),
      countQuery.exec(),
    ]);
    return { records, total };
  }

  async createPending(
    data: CreateFinanceCashBankTransferRecord,
    session?: ClientSession
  ): Promise<FinanceCashBankTransferPersistenceRecord> {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
      status: 'pending',
    });
    const saved = await document.save(
      session ? { session } : undefined
    );
    return saved.toObject() as unknown as FinanceCashBankTransferPersistenceRecord;
  }

  async markPosted(
    id: string,
    journalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceCashBankTransferPersistenceRecord | null> {
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
          reversal_journal_entry: null,
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );
    return query
      .lean<FinanceCashBankTransferPersistenceRecord | null>()
      .exec();
  }

  async markReversedByJournalEntry(
    journalEntryId: string,
    reversalJournalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceCashBankTransferPersistenceRecord | null> {
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
      .lean<FinanceCashBankTransferPersistenceRecord | null>()
      .exec();
  }
}
