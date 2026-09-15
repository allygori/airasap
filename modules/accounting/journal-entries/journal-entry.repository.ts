import type { ClientSession } from 'mongoose';
import { BaseRepository } from '../../base.repository';
import {
  JournalEntryModel,
  type TJournalEntry,
} from './journal-entry.model';
import type { AccountingTenantContext } from '../accounting.types';

export class JournalEntryRepository extends BaseRepository<TJournalEntry> {
  constructor(context: AccountingTenantContext) {
    super(JournalEntryModel, context);
  }

  async findEntryById(id: string, session?: ClientSession) {
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

  async findByReversalOf(
    journalEntryId: string,
    session?: ClientSession
  ) {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      reversal_of: journalEntryId,
      status: { $in: ['posted', 'reversed'] },
    });
    if (session) query.session(session);
    return query.lean();
  }

  async createEntry(
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
    postedBy: string | undefined,
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
          posted_at: new Date(),
          ...(postedBy ? { posted_by: postedBy } : {}),
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

  async markReversed(id: string, session?: ClientSession) {
    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        _id: id,
        status: 'posted',
      },
      { $set: { status: 'reversed' } },
      {
        new: true,
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );
    return query.lean();
  }
}
