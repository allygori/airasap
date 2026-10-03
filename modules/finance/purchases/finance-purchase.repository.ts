import {
  Types,
  type ClientSession,
  type QueryFilter,
} from 'mongoose';
import { escapeRegex } from '@/lib/string';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FinancePurchaseModel,
  type TFinancePurchase,
  type TFinancePurchaseLine,
} from './finance-purchase.model';
import type {
  FinancePurchaseListQueryDTO,
  FinancePurchaseStatusDTO,
} from './finance-purchase.dto';

export type FinancePurchasePersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  supplier?: Types.ObjectId | null;
  supplier_name_snapshot?: string | null;
  supplier_document_reference?: string | null;
  transaction_date: Date;
  payment_timing: 'paid' | 'payable';
  payment_account?: Types.ObjectId | null;
  payment_account_code?: string | null;
  payment_account_name?: string | null;
  offset_account?: Types.ObjectId | null;
  offset_account_code?: string | null;
  offset_account_name?: string | null;
  lines: TFinancePurchaseLine[];
  inventory_movements: Types.ObjectId[];
  total_amount: number;
  notes?: string | null;
  status: FinancePurchaseStatusDTO;
  journal_entry?: Types.ObjectId | null;
  idempotency_key: string;
  created_at?: Date;
  updated_at?: Date;
};

export type CreateFinancePurchaseRecord = Omit<
  FinancePurchasePersistenceRecord,
  '_id' | 'organization' | 'created_at' | 'updated_at'
>;

export class FinancePurchaseRepository extends BaseRepository<TFinancePurchase> {
  constructor(context: FinanceTenantContext) {
    super(FinancePurchaseModel, context);
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    session?: ClientSession
  ): Promise<FinancePurchasePersistenceRecord | null> {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      idempotency_key: idempotencyKey,
    });
    if (session) query.session(session);

    return query
      .lean<FinancePurchasePersistenceRecord | null>()
      .exec();
  }

  async findPurchaseById(
    id: string,
    session?: ClientSession
  ): Promise<FinancePurchasePersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query = this.model.findOne({
      ...this.getTenantFilter(),
      _id: new Types.ObjectId(id),
    });
    if (session) query.session(session);

    return query
      .lean<FinancePurchasePersistenceRecord | null>()
      .exec();
  }

  async list(
    filter: FinancePurchaseListQueryDTO,
    session?: ClientSession
  ): Promise<{
    records: FinancePurchasePersistenceRecord[];
    total: number;
  }> {
    const queryFilter: QueryFilter<TFinancePurchase> = {
      ...this.getTenantFilter(),
      ...(filter.status ? { status: filter.status } : {}),
    };

    if (filter.search) {
      const search = new RegExp(
        escapeRegex(filter.search),
        'i'
      );
      queryFilter.$or = [
        { supplier_name_snapshot: search },
        { supplier_document_reference: search },
        { notes: search },
        { idempotency_key: search },
      ];
    }

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
        .lean<FinancePurchasePersistenceRecord[]>()
        .exec(),
      countQuery.exec(),
    ]);
    return { records, total };
  }

  async createDraft(
    data: CreateFinancePurchaseRecord,
    session?: ClientSession
  ): Promise<FinancePurchasePersistenceRecord> {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
      status: 'draft',
    });
    const saved = await document.save(
      session ? { session } : undefined
    );
    return saved.toObject() as unknown as FinancePurchasePersistenceRecord;
  }

  async markPosted(
    id: string,
    journalEntryId: string,
    offsetAccountId: string,
    offsetAccountCode: string,
    offsetAccountName: string,
    inventoryMovementIds: string[],
    session?: ClientSession
  ): Promise<FinancePurchasePersistenceRecord | null> {
    if (
      !Types.ObjectId.isValid(id) ||
      !Types.ObjectId.isValid(journalEntryId) ||
      !Types.ObjectId.isValid(offsetAccountId)
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
          offset_account: new Types.ObjectId(
            offsetAccountId
          ),
          offset_account_code: offsetAccountCode,
          offset_account_name: offsetAccountName,
          inventory_movements: inventoryMovementIds.map(
            (movementId) => new Types.ObjectId(movementId)
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
      .lean<FinancePurchasePersistenceRecord | null>()
      .exec();
  }
}
