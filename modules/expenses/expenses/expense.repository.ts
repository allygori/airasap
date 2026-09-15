import type { ClientSession } from 'mongoose';
import { BaseRepository } from '../../base.repository';
import {
  ExpenseModel,
  type TExpense,
} from './expense.model';
import type { AccountingTenantContext } from '@/modules/accounting/accounting.types';

export class ExpenseRepository extends BaseRepository<TExpense> {
  constructor(context: AccountingTenantContext) {
    super(ExpenseModel, context);
  }

  async findExpenseById(
    id: string,
    session?: ClientSession
  ) {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      _id: id,
    });
    if (session) query.session(session);
    return query.lean();
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    session?: ClientSession
  ) {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      idempotency_key: idempotencyKey,
    });
    if (session) query.session(session);
    return query.lean();
  }

  async createExpense(
    data: Record<string, unknown>,
    session?: ClientSession
  ) {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
    });
    return document.save(session ? { session } : undefined);
  }

  async markPosted(
    id: string,
    journalEntryId: string,
    session?: ClientSession
  ) {
    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        _id: id,
        status: 'draft',
      },
      {
        $set: {
          status: 'posted',
          journal_entry: journalEntryId,
        },
      },
      {
        new: true,
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );
    return query.lean();
  }
}
