import {
  Types,
  type ClientSession,
  type QueryFilter,
} from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FinanceExpenseModel,
  type TFinanceExpense,
} from './finance-expense.model';
import type {
  FinanceExpenseListQueryDTO,
  FinanceExpenseStatusDTO,
} from './finance-expense.dto';

export type FinanceExpensePersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  category_account: Types.ObjectId;
  category_account_code: string;
  category_account_name: string;
  amount: number;
  expense_date: Date;
  description: string;
  vendor_name?: string | null;
  reference?: string | null;
  payment_timing: 'paid' | 'payable';
  payment_account?: Types.ObjectId | null;
  payment_account_code?: string | null;
  payment_account_name?: string | null;
  offset_account?: Types.ObjectId | null;
  offset_account_code?: string | null;
  offset_account_name?: string | null;
  notes?: string | null;
  attachment_reference?: string | null;
  status: FinanceExpenseStatusDTO;
  journal_entry?: Types.ObjectId | null;
  idempotency_key: string;
  created_at?: Date;
  updated_at?: Date;
};

export type CreateFinanceExpenseRecord = Omit<
  FinanceExpensePersistenceRecord,
  '_id' | 'organization' | 'created_at' | 'updated_at'
>;

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class FinanceExpenseRepository extends BaseRepository<TFinanceExpense> {
  constructor(context: FinanceTenantContext) {
    super(FinanceExpenseModel, context);
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    session?: ClientSession
  ): Promise<FinanceExpensePersistenceRecord | null> {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      idempotency_key: idempotencyKey,
    });
    if (session) query.session(session);

    return query
      .lean<FinanceExpensePersistenceRecord | null>()
      .exec();
  }

  async findExpenseById(
    id: string,
    session?: ClientSession
  ): Promise<FinanceExpensePersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query = this.model.findOne({
      ...this.getTenantFilter(),
      _id: new Types.ObjectId(id),
    });
    if (session) query.session(session);

    return query
      .lean<FinanceExpensePersistenceRecord | null>()
      .exec();
  }

  async list(
    filter: FinanceExpenseListQueryDTO,
    session?: ClientSession
  ): Promise<{
    records: FinanceExpensePersistenceRecord[];
    total: number;
  }> {
    const queryFilter: QueryFilter<TFinanceExpense> = {
      ...this.getTenantFilter(),
      ...(filter.status ? { status: filter.status } : {}),
    };

    if (filter.search) {
      const search = new RegExp(
        escapeRegex(filter.search),
        'i'
      );
      queryFilter.$or = [
        { category_account_code: search },
        { category_account_name: search },
        { description: search },
        { vendor_name: search },
        { reference: search },
        { notes: search },
      ];
    }

    const query = this.model
      .find(queryFilter)
      .sort({ expense_date: -1, created_at: -1, _id: -1 })
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
        .lean<FinanceExpensePersistenceRecord[]>()
        .exec(),
      countQuery.exec(),
    ]);
    return { records, total };
  }

  async createDraft(
    data: CreateFinanceExpenseRecord,
    session?: ClientSession
  ): Promise<FinanceExpensePersistenceRecord> {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
      status: 'draft',
    });
    const saved = await document.save(
      session ? { session } : undefined
    );
    return saved.toObject() as unknown as FinanceExpensePersistenceRecord;
  }

  async markPosted(
    id: string,
    journalEntryId: string,
    offsetAccountId: string,
    offsetAccountCode: string,
    offsetAccountName: string,
    session?: ClientSession
  ): Promise<FinanceExpensePersistenceRecord | null> {
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
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );

    return query
      .lean<FinanceExpensePersistenceRecord | null>()
      .exec();
  }
}
