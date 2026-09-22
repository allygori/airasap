import {
  Types,
  type ClientSession,
  type QueryFilter,
} from 'mongoose';
import {
  FinanceAccountModel,
  type TFinanceAccount,
} from './finance-account.model';
import { assertFinanceTenant } from '../finance.types';
import type { FinanceTenantContext } from '../finance.types';
import type { FinanceAccountFilterDTO } from './finance-account.dto';

export type FinanceAccountPersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  code: string;
  name: string;
  type: string;
  subtype?: string;
  parent_account?: Types.ObjectId | null;
  normal_balance: 'debit' | 'credit';
  is_system: boolean;
  is_postable: boolean;
  is_active: boolean;
  display_order: number;
  description?: string;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Compatibility boundary for the existing accounting_accounts collection.
 * Finance owns the query contract; the old model remains only as a temporary
 * persistence adapter until the legacy accounting module is removed.
 */
export class FinanceAccountRepository {
  private readonly organizationId: Types.ObjectId;

  constructor(context: FinanceTenantContext) {
    assertFinanceTenant(context);
    this.organizationId = new Types.ObjectId(
      context.organizationId
    );
  }

  async list(
    filter: FinanceAccountFilterDTO,
    session?: ClientSession
  ): Promise<FinanceAccountPersistenceRecord[]> {
    const queryFilter: QueryFilter<TFinanceAccount> = {
      organization: this.organizationId,
      ...(filter.type ? { type: filter.type } : {}),
      ...(filter.is_active === undefined
        ? {}
        : { is_active: filter.is_active }),
      ...(filter.is_postable === undefined
        ? {}
        : { is_postable: filter.is_postable }),
    };

    if (filter.search) {
      const search = new RegExp(
        escapeRegex(filter.search),
        'i'
      );
      queryFilter.$or = [
        { code: search },
        { name: search },
      ];
    }

    const query = FinanceAccountModel.find(queryFilter)
      .sort({ display_order: 1, code: 1 })
      .limit(filter.limit);

    if (session) query.session(session);

    return query
      .lean<FinanceAccountPersistenceRecord[]>()
      .exec();
  }

  async findSelectableById(
    accountId: string,
    session?: ClientSession
  ): Promise<FinanceAccountPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(accountId)) return null;

    const query = FinanceAccountModel.findOne({
      organization: this.organizationId,
      _id: new Types.ObjectId(accountId),
      is_active: true,
      is_postable: true,
    });

    if (session) query.session(session);

    return query
      .lean<FinanceAccountPersistenceRecord | null>()
      .exec();
  }
}
