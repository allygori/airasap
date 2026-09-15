import type { ClientSession, QueryFilter } from 'mongoose';
import { BaseRepository } from '../../base.repository';
import {
  AccountingAccountModel,
  type TAccountingAccount,
} from './account.model';
import type { AccountingTenantContext } from '../accounting.types';

export type SeedAccountRecord = {
  code: string;
  name: string;
  type: string;
  subtype?: string;
  parent_account?: string | null;
  normal_balance: 'debit' | 'credit';
  is_system: boolean;
  is_postable: boolean;
  is_active: boolean;
  display_order: number;
  description?: string;
};

export class AccountingAccountRepository extends BaseRepository<TAccountingAccount> {
  constructor(context: AccountingTenantContext) {
    super(AccountingAccountModel, context);
  }

  async findByCode(code: string, session?: ClientSession) {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      code,
    });
    if (session) query.session(session);
    return query.lean();
  }

  async findByCodes(
    codes: string[],
    session?: ClientSession
  ) {
    const query = this.model.find({
      ...this.getTenantFilter(),
      code: { $in: codes },
    });
    if (session) query.session(session);
    return query.lean();
  }

  async findByIds(ids: string[], session?: ClientSession) {
    const query = this.model.find({
      ...this.getTenantFilter(),
      _id: { $in: ids },
    });
    if (session) query.session(session);
    return query.lean();
  }

  async upsertSeedAccount(
    record: SeedAccountRecord,
    parentAccount: TAccountingAccount['_id'] | null,
    session?: ClientSession
  ) {
    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        code: record.code,
      },
      {
        $setOnInsert: {
          organization: this.tenantContext.organizationId,
          code: record.code,
          name: record.name,
          type: record.type,
          subtype: record.subtype,
          parent_account: parentAccount,
          normal_balance: record.normal_balance,
          is_system: record.is_system,
          is_postable: record.is_postable,
          is_active: record.is_active,
          display_order: record.display_order,
          description: record.description,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );

    return query.lean();
  }

  async findPostableByIds(
    ids: string[],
    session?: ClientSession
  ) {
    return this.findByIds(ids, session).then((accounts) =>
      accounts.filter(
        (account) =>
          account.is_active && account.is_postable
      )
    );
  }

  async findAllActive(session?: ClientSession) {
    const filter: QueryFilter<TAccountingAccount> = {
      ...this.getTenantFilter(),
      is_active: true,
    };
    const query = this.model.find(filter).sort({
      display_order: 1,
      code: 1,
    });
    if (session) query.session(session);
    return query.lean();
  }
}
