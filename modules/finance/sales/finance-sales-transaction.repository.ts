import {
  Types,
  type ClientSession,
  type QueryFilter,
} from 'mongoose';
import { escapeRegex } from '@/lib/string';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FinanceSalesTransactionModel,
  type TFinanceSalesCogsRetryPlan,
  type TFinanceSalesTransaction,
} from './finance-sales-transaction.model';
import type {
  FinanceSalesTransactionListQueryDTO,
  FinanceSalesPostingModeDTO,
  FinanceSalesTransactionStatusDTO,
  FinanceSalesInventoryCogsStatusDTO,
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
  inventory_cogs_status: FinanceSalesInventoryCogsStatusDTO;
  inventory_cogs_total_cost: number | null;
  inventory_cogs_journal_entry_id?: Types.ObjectId | null;
  inventory_cogs_retry_plan?: TFinanceSalesCogsRetryPlan | null;
  inventory_movement_ids: Types.ObjectId[];
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

  async findTransactionById(
    id: string,
    session?: ClientSession
  ): Promise<FinanceSalesTransactionPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query = this.model.findOne({
      ...this.getTenantFilter(),
      _id: new Types.ObjectId(id),
    });
    if (session) query.session(session);
    return query
      .lean<FinanceSalesTransactionPersistenceRecord | null>()
      .exec();
  }

  async findByJournalEntryId(
    journalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceSalesTransactionPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(journalEntryId))
      return null;

    const query = this.model.findOne({
      ...this.getTenantFilter(),
      journal_entry_id: new Types.ObjectId(journalEntryId),
    });
    if (session) query.session(session);
    return query
      .lean<FinanceSalesTransactionPersistenceRecord | null>()
      .exec();
  }

  async findByCogsRetryJournalEntryId(
    journalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceSalesTransactionPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(journalEntryId))
      return null;

    const query = this.model.findOne({
      ...this.getTenantFilter(),
      inventory_cogs_journal_entry_id: new Types.ObjectId(
        journalEntryId
      ),
    });
    if (session) query.session(session);
    return query
      .lean<FinanceSalesTransactionPersistenceRecord | null>()
      .exec();
  }

  async saveCogsRetryPlan(
    id: string,
    plan: TFinanceSalesCogsRetryPlan,
    session?: ClientSession
  ): Promise<FinanceSalesTransactionPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        _id: new Types.ObjectId(id),
        status: 'posted',
        inventory_cogs_status: { $in: ['deferred', null] },
        $or: [
          { inventory_cogs_retry_plan: null },
          { inventory_cogs_retry_plan: { $exists: false } },
        ],
      },
      { $set: { inventory_cogs_retry_plan: plan } },
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

  async updateDeferredCogsReason(
    id: string,
    reason: string,
    session?: ClientSession
  ): Promise<FinanceSalesTransactionPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        _id: new Types.ObjectId(id),
        status: 'posted',
        inventory_cogs_status: { $in: ['deferred', null] },
      },
      { $set: { inventory_cogs_deferred_reason: reason } },
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

  async clearCogsRetryPlan(
    id: string,
    session?: ClientSession
  ): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;

    await this.model
      .updateOne(
        {
          ...this.getTenantFilter(),
          _id: new Types.ObjectId(id),
          status: 'posted',
          inventory_cogs_status: {
            $in: ['deferred', null],
          },
        },
        { $unset: { inventory_cogs_retry_plan: 1 } },
        session ? { session } : undefined
      )
      .exec();
  }

  async aggregateDeferredCogs(
    startDate: Date,
    endDate: Date
  ): Promise<
    Array<{
      _id: string;
      transaction_count: number;
      related_sales_amount: number;
    }>
  > {
    return this.model
      .aggregate<{
        _id: string;
        transaction_count: number;
        related_sales_amount: number;
      }>([
        {
          $match: {
            ...this.getTenantFilter(),
            status: 'posted',
            inventory_cogs_status: 'deferred',
            transaction_date: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: {
              $ifNull: [
                '$inventory_cogs_deferred_reason',
                'Alasan HPP tertunda belum dicatat.',
              ],
            },
            transaction_count: { $sum: 1 },
            related_sales_amount: {
              $sum: { $ifNull: ['$sales_amount', 0] },
            },
          },
        },
        { $sort: { transaction_count: -1, _id: 1 } },
      ])
      .exec();
  }

  async list(
    filter: FinanceSalesTransactionListQueryDTO,
    session?: ClientSession
  ): Promise<{
    records: FinanceSalesTransactionPersistenceRecord[];
    total: number;
  }> {
    const queryFilter: QueryFilter<TFinanceSalesTransaction> =
      {
        ...this.getTenantFilter(),
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.posting_mode
          ? { posting_mode: filter.posting_mode }
          : {}),
      };

    if (filter.search) {
      const search = new RegExp(
        escapeRegex(filter.search),
        'i'
      );
      queryFilter.$or = [
        { source_order_id: search },
        { source_order_number: search },
        { blocked_reason: search },
      ];
    }

    const query = this.model
      .find(queryFilter)
      .sort({ created_at: -1, _id: -1 })
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
        .lean<FinanceSalesTransactionPersistenceRecord[]>()
        .exec(),
      countQuery.exec(),
    ]);

    return { records, total };
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
    session?: ClientSession,
    cogs?: {
      status: FinanceSalesInventoryCogsStatusDTO;
      reason: string | null;
      total_cost: number | null;
      movement_ids: string[];
    }
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
          ...(cogs
            ? {
                inventory_cogs_status: cogs.status,
                inventory_cogs_deferred_reason: cogs.reason,
                inventory_cogs_total_cost: cogs.total_cost,
                inventory_movement_ids: cogs.movement_ids
                  .filter((movementId) =>
                    Types.ObjectId.isValid(movementId)
                  )
                  .map(
                    (movementId) =>
                      new Types.ObjectId(movementId)
                  ),
              }
            : {}),
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

  async markInventoryCogsPosted(
    id: string,
    journalEntryId: string,
    cogs: {
      total_cost: number;
      movement_ids: string[];
    },
    session?: ClientSession
  ): Promise<FinanceSalesTransactionPersistenceRecord | null> {
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
        status: 'posted',
        inventory_cogs_status: { $in: ['deferred', null] },
      },
      {
        $set: {
          inventory_cogs_status: 'posted',
          inventory_cogs_deferred_reason: null,
          inventory_cogs_total_cost: cogs.total_cost,
          inventory_cogs_journal_entry_id:
            new Types.ObjectId(journalEntryId),
          inventory_movement_ids: cogs.movement_ids
            .filter((movementId) =>
              Types.ObjectId.isValid(movementId)
            )
            .map(
              (movementId) => new Types.ObjectId(movementId)
            ),
        },
        $unset: { inventory_cogs_retry_plan: 1 },
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

  async markReversedByJournalEntry(
    journalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceSalesTransactionPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(journalEntryId))
      return null;

    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        journal_entry_id: new Types.ObjectId(
          journalEntryId
        ),
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
      .lean<FinanceSalesTransactionPersistenceRecord | null>()
      .exec();
  }
}
