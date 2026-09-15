import type { ClientSession } from 'mongoose';
import { BaseRepository } from '../../base.repository';
import {
  OpeningBalanceModel,
  type TOpeningBalance,
} from './opening-balance.model';
import type { AccountingTenantContext } from '../accounting.types';

export class OpeningBalanceRepository extends BaseRepository<TOpeningBalance> {
  constructor(context: AccountingTenantContext) {
    super(OpeningBalanceModel, context);
  }

  async findOpeningBalanceById(
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

  async createOpeningBalance(
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
