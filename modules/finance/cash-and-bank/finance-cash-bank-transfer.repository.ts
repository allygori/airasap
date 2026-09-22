import { Types, type ClientSession } from 'mongoose';
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
