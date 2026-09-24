import {
  Types,
  type ClientSession,
  type QueryFilter,
} from 'mongoose';
import {
  FinanceAccountModel,
  type TFinanceAccount,
} from './finance-account.model';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type { FinanceAccountFilterDTO } from './finance-account.dto';
import type {
  FinanceAccountType,
  FinanceNormalBalance,
} from './finance-account.constants';

export type FinanceAccountSeedRecord = {
  code: string;
  name: string;
  type: FinanceAccountType;
  subtype?: string;
  normal_balance: FinanceNormalBalance;
  is_system: boolean;
  is_postable: boolean;
  is_active: boolean;
  display_order: number;
  description?: string;
};

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
  account_metadata?: {
    institution?: string;
    account_last4?: string;
    account_holder?: string;
    provider?: string;
  };
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isDuplicateKeyError = (
  error: unknown
): error is { code: number } =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 11000;

export class FinanceAccountRepository {
  private readonly organizationId: Types.ObjectId;

  constructor(context: FinanceTenantContext) {
    assertFinanceTenant(context);
    this.organizationId = new Types.ObjectId(
      context.organizationId
    );
  }

  async findByCode(
    code: string,
    session?: ClientSession
  ): Promise<FinanceAccountPersistenceRecord | null> {
    const query = FinanceAccountModel.findOne({
      organization: this.organizationId,
      code,
    });

    if (session) query.session(session);

    return query
      .lean<FinanceAccountPersistenceRecord | null>()
      .exec();
  }

  async findById(
    accountId: string,
    session?: ClientSession
  ): Promise<FinanceAccountPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(accountId)) return null;

    const query = FinanceAccountModel.findOne({
      organization: this.organizationId,
      _id: new Types.ObjectId(accountId),
    });

    if (session) query.session(session);

    return query
      .lean<FinanceAccountPersistenceRecord | null>()
      .exec();
  }

  async updateAccountDetails(
    accountId: string,
    data: { name: string; description: string | null },
    session?: ClientSession
  ): Promise<FinanceAccountPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(accountId)) return null;

    const query = FinanceAccountModel.findOneAndUpdate(
      {
        organization: this.organizationId,
        _id: new Types.ObjectId(accountId),
        is_system: false,
      },
      { $set: data },
      {
        returnDocument: 'after',
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );

    return query
      .lean<FinanceAccountPersistenceRecord | null>()
      .exec();
  }

  async upsertDefaultAccount(
    record: FinanceAccountSeedRecord,
    parentAccount: Types.ObjectId | null,
    session?: ClientSession
  ): Promise<FinanceAccountPersistenceRecord | null> {
    try {
      const query = FinanceAccountModel.findOneAndUpdate(
        {
          organization: this.organizationId,
          code: record.code,
        },
        {
          $setOnInsert: {
            ...record,
            organization: this.organizationId,
            parent_account: parentAccount,
          },
        },
        {
          upsert: true,
          returnDocument: 'after',
          runValidators: true,
          ...(session ? { session } : {}),
        }
      );

      return await query
        .lean<FinanceAccountPersistenceRecord | null>()
        .exec();
    } catch (error: unknown) {
      if (!isDuplicateKeyError(error)) throw error;
      return this.findByCode(record.code, session);
    }
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

  async findSelectableByIds(
    accountIds: string[],
    session?: ClientSession
  ): Promise<FinanceAccountPersistenceRecord[]> {
    const objectIds = accountIds
      .filter((accountId) =>
        Types.ObjectId.isValid(accountId)
      )
      .map((accountId) => new Types.ObjectId(accountId));

    if (objectIds.length === 0) return [];

    const query = FinanceAccountModel.find({
      organization: this.organizationId,
      _id: { $in: objectIds },
      is_active: true,
      is_postable: true,
    });

    if (session) query.session(session);

    return query
      .lean<FinanceAccountPersistenceRecord[]>()
      .exec();
  }

  async findSelectableByCode(
    code: string,
    session?: ClientSession
  ): Promise<FinanceAccountPersistenceRecord | null> {
    const query = FinanceAccountModel.findOne({
      organization: this.organizationId,
      code,
      is_active: true,
      is_postable: true,
    });

    if (session) query.session(session);

    return query
      .lean<FinanceAccountPersistenceRecord | null>()
      .exec();
  }

  async findSelectableBySubtype(
    subtype: string,
    session?: ClientSession
  ): Promise<FinanceAccountPersistenceRecord | null> {
    const query = FinanceAccountModel.findOne({
      organization: this.organizationId,
      subtype,
      is_active: true,
      is_postable: true,
    }).sort({ display_order: 1, code: 1 });

    if (session) query.session(session);

    return query
      .lean<FinanceAccountPersistenceRecord | null>()
      .exec();
  }

  async findByIds(
    accountIds: string[],
    session?: ClientSession
  ): Promise<FinanceAccountPersistenceRecord[]> {
    const objectIds = accountIds
      .filter((accountId) =>
        Types.ObjectId.isValid(accountId)
      )
      .map((accountId) => new Types.ObjectId(accountId));

    if (objectIds.length === 0) return [];

    const query = FinanceAccountModel.find({
      organization: this.organizationId,
      _id: { $in: objectIds },
    });

    if (session) query.session(session);

    return query
      .lean<FinanceAccountPersistenceRecord[]>()
      .exec();
  }

  async listPostableBySubtypes(
    subtypes: string[],
    filter: { search?: string; limit: number },
    session?: ClientSession
  ): Promise<FinanceAccountPersistenceRecord[]> {
    if (subtypes.length === 0) return [];

    const queryFilter: QueryFilter<TFinanceAccount> = {
      organization: this.organizationId,
      type: 'asset',
      is_active: true,
      is_postable: true,
      subtype: { $in: subtypes },
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
}
