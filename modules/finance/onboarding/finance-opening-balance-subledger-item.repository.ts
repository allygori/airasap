import { Types, type ClientSession } from 'mongoose';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FinanceOpeningBalanceSubledgerItemModel,
  type TFinanceOpeningBalanceSubledgerItem,
} from './finance-opening-balance-subledger-item.model';

export type FinanceOpeningBalanceSubledgerItemPersistenceRecord =
  {
    _id: Types.ObjectId;
    organization: Types.ObjectId;
    opening_balance_draft: Types.ObjectId;
    journal_entry: Types.ObjectId;
    balance_type: 'receivable' | 'payable';
    account_id: Types.ObjectId;
    source_id: string;
    source_label: string;
    description: string;
    transaction_date: Date;
    currency: string;
    amount: number;
    counterparty?: string;
    reference?: string;
    status: 'posted';
  };

export type CreateFinanceOpeningBalanceSubledgerItem = Omit<
  FinanceOpeningBalanceSubledgerItemPersistenceRecord,
  '_id' | 'organization'
>;

export class FinanceOpeningBalanceSubledgerItemRepository extends BaseRepository<TFinanceOpeningBalanceSubledgerItem> {
  constructor(context: FinanceTenantContext) {
    super(FinanceOpeningBalanceSubledgerItemModel, context);
  }

  async createMany(
    records: CreateFinanceOpeningBalanceSubledgerItem[],
    session?: ClientSession
  ): Promise<void> {
    if (records.length === 0) return;
    const documents = records.map((record) => ({
      ...record,
      organization: this.tenantContext.organizationId,
    }));
    await this.model.insertMany(documents, {
      ...(session ? { session } : {}),
      ordered: true,
    });
  }

  async listPosted(
    balanceType: 'receivable' | 'payable',
    accountIds: string[],
    search?: string,
    session?: ClientSession
  ): Promise<
    FinanceOpeningBalanceSubledgerItemPersistenceRecord[]
  > {
    const objectIds = accountIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) return [];

    const filter: Record<string, unknown> = {
      ...this.getTenantFilter(),
      balance_type: balanceType,
      account_id: { $in: objectIds },
      status: 'posted',
    };
    if (search) {
      const escaped = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );
      const pattern = new RegExp(escaped, 'i');
      filter.$or = [
        { source_id: pattern },
        { source_label: pattern },
        { description: pattern },
        { counterparty: pattern },
        { reference: pattern },
      ];
    }

    const query = this.model
      .find(filter)
      .sort({ transaction_date: -1, _id: -1 })
      .limit(1000);
    if (session) query.session(session);
    return query
      .lean<
        FinanceOpeningBalanceSubledgerItemPersistenceRecord[]
      >()
      .exec();
  }

  async findPostedById(
    id: string,
    balanceType: 'receivable' | 'payable',
    accountIds: string[],
    session?: ClientSession
  ): Promise<FinanceOpeningBalanceSubledgerItemPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const objectIds = accountIds
      .filter((accountId) =>
        Types.ObjectId.isValid(accountId)
      )
      .map((accountId) => new Types.ObjectId(accountId));
    if (objectIds.length === 0) return null;

    const query = this.model.findOne({
      ...this.getTenantFilter(),
      _id: new Types.ObjectId(id),
      balance_type: balanceType,
      account_id: { $in: objectIds },
      status: 'posted',
    });
    if (session) query.session(session);
    return query
      .lean<FinanceOpeningBalanceSubledgerItemPersistenceRecord | null>()
      .exec();
  }
}
