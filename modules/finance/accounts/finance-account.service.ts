import type { ClientSession } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import type {
  FinanceAccountDetailsDTO,
  FinanceAccountDTO,
  FinanceAccountFilterDTO,
  FinanceAccountListResponseDTO,
  FinanceAccountUpdateDetailsDTO,
} from './finance-account.dto';
import {
  FinanceAccountRepository,
  type FinanceAccountPersistenceRecord,
  type FinanceAccountSeedRecord,
} from './finance-account.repository';
import {
  FinanceAccountDetailsResponseSchema,
  FinanceAccountResponseSchema,
  FinanceAccountTemplateRecordSchema,
} from './finance-account.schema';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import accountTemplate from './finance-account.seed.json';

type FinanceAccountRepositoryPort = Pick<
  FinanceAccountRepository,
  | 'list'
  | 'findById'
  | 'updateAccountDetails'
  | 'findSelectableById'
  | 'findByCode'
  | 'upsertDefaultAccount'
>;

type FinanceAccountServiceDependencies = {
  repository?: FinanceAccountRepositoryPort;
};

type FinanceAccountTemplateRecord = ReturnType<
  typeof FinanceAccountTemplateRecordSchema.parse
>;

const toSeedAccountRecord = (
  record: FinanceAccountTemplateRecord
): FinanceAccountSeedRecord => ({
  code: record.code,
  name: record.name,
  type: record.type,
  ...(record.subtype ? { subtype: record.subtype } : {}),
  normal_balance: record.normal_balance,
  is_system: record.is_system,
  is_postable: record.is_postable,
  is_active: record.is_active,
  display_order: record.display_order,
  ...(record.description
    ? { description: record.description }
    : {}),
});

const mapAccount = (
  record: FinanceAccountPersistenceRecord,
  depth: number
): FinanceAccountDTO =>
  FinanceAccountResponseSchema.parse({
    id: String(record._id),
    code: record.code,
    name: record.name,
    type: record.type,
    subtype: record.subtype ?? null,
    parent_account_id: record.parent_account
      ? String(record.parent_account)
      : null,
    normal_balance: record.normal_balance,
    is_system: record.is_system,
    is_postable: record.is_postable,
    is_active: record.is_active,
    is_selectable: record.is_active && record.is_postable,
    display_order: record.display_order,
    depth,
    description: record.description ?? null,
  });

const getDepths = (
  accounts: FinanceAccountPersistenceRecord[]
) => {
  const parentById = new Map(
    accounts.map((account) => [
      String(account._id),
      account.parent_account
        ? String(account.parent_account)
        : null,
    ])
  );
  const depthById = new Map<string, number>();

  const resolveDepth = (
    id: string,
    trail: Set<string> = new Set()
  ): number => {
    const cached = depthById.get(id);
    if (cached !== undefined) return cached;

    const parentId = parentById.get(id);
    if (!parentId || trail.has(id)) {
      depthById.set(id, 0);
      return 0;
    }

    const nextTrail = new Set(trail);
    nextTrail.add(id);
    const depth = resolveDepth(parentId, nextTrail) + 1;
    depthById.set(id, depth);
    return depth;
  };

  return new Map(
    accounts.map((account) => {
      const id = String(account._id);
      return [id, resolveDepth(id)] as const;
    })
  );
};

export class FinanceAccountService {
  private readonly repository: FinanceAccountRepositoryPort;
  private readonly context: FinanceTenantContext;

  constructor(
    context: FinanceTenantContext,
    dependencies?: FinanceAccountServiceDependencies
  ) {
    assertFinanceTenant(context);
    this.context = context;
    this.repository =
      dependencies?.repository ??
      new FinanceAccountRepository(context);
  }

  async ensureDefaultAccounts(
    session?: ClientSession
  ): Promise<{
    organization_id: string;
    account_count: number;
  }> {
    const pending =
      FinanceAccountTemplateRecordSchema.array().parse(
        accountTemplate.accounts
      );
    const accountsByCode = new Map<
      string,
      FinanceAccountPersistenceRecord
    >();

    while (pending.length > 0) {
      const ready = pending.filter(
        (record) =>
          record.parent_code === null ||
          accountsByCode.has(record.parent_code)
      );

      if (ready.length === 0) {
        throw new FinanceDomainError(
          'Template Chart of Accounts Finance memiliki hierarki yang tidak valid.',
          'FINANCE_ACCOUNT_TEMPLATE_INVALID'
        );
      }

      for (const record of ready) {
        const parent = record.parent_code
          ? accountsByCode.get(record.parent_code)
          : undefined;
        const account =
          await this.repository.upsertDefaultAccount(
            toSeedAccountRecord(record),
            parent?._id ?? null,
            session
          );

        if (!account) {
          throw new FinanceDomainError(
            `Gagal menyiapkan akun Finance ${record.code}.`,
            'FINANCE_ACCOUNT_SEED_FAILED'
          );
        }

        accountsByCode.set(record.code, account);
      }

      const readyCodes = new Set(
        ready.map((record) => record.code)
      );
      for (
        let index = pending.length - 1;
        index >= 0;
        index -= 1
      ) {
        if (readyCodes.has(pending[index].code)) {
          pending.splice(index, 1);
        }
      }
    }

    return {
      organization_id: this.context.organizationId,
      account_count: accountsByCode.size,
    };
  }

  async ensureDefaultAccountByCode(
    code: string,
    session?: ClientSession
  ): Promise<void> {
    const records =
      FinanceAccountTemplateRecordSchema.array().parse(
        accountTemplate.accounts
      );
    const recordsByCode = new Map(
      records.map((record) => [record.code, record])
    );
    const chain: typeof records = [];
    const visited = new Set<string>();
    let current = recordsByCode.get(code);

    while (current) {
      if (visited.has(current.code)) {
        throw new FinanceDomainError(
          'Template Chart of Accounts Finance memiliki hierarki yang tidak valid.',
          'FINANCE_ACCOUNT_TEMPLATE_INVALID'
        );
      }
      visited.add(current.code);
      chain.unshift(current);
      if (!current.parent_code) break;
      current = recordsByCode.get(current.parent_code);
      if (!current) {
        throw new FinanceDomainError(
          'Template Chart of Accounts Finance memiliki parent akun yang tidak valid.',
          'FINANCE_ACCOUNT_TEMPLATE_INVALID'
        );
      }
    }

    if (chain.length === 0) {
      throw new FinanceDomainError(
        `Akun Finance ${code} tidak ditemukan pada template.`,
        'FINANCE_ACCOUNT_TEMPLATE_INVALID'
      );
    }

    const accountsByCode = new Map<
      string,
      FinanceAccountPersistenceRecord
    >();
    for (const record of chain) {
      const parent = record.parent_code
        ? accountsByCode.get(record.parent_code)
        : undefined;
      const account =
        await this.repository.upsertDefaultAccount(
          toSeedAccountRecord(record),
          parent?._id ?? null,
          session
        );
      if (!account) {
        throw new FinanceDomainError(
          `Gagal menyiapkan akun Finance ${record.code}.`,
          'FINANCE_ACCOUNT_SEED_FAILED'
        );
      }
      accountsByCode.set(record.code, account);
    }
  }

  async list(
    filter: FinanceAccountFilterDTO,
    session?: ClientSession
  ): Promise<FinanceAccountListResponseDTO> {
    const records = await this.repository.list(
      filter,
      session
    );
    const depths = getDepths(records);
    const accounts = records.map((record) =>
      mapAccount(
        record,
        depths.get(String(record._id)) ?? 0
      )
    );

    return {
      accounts,
      meta: {
        total: accounts.length,
        limit: filter.limit,
      },
    };
  }

  async updateDetails(
    accountId: string,
    data: FinanceAccountUpdateDetailsDTO,
    session?: ClientSession
  ): Promise<FinanceAccountDetailsDTO> {
    const account = await this.repository.findById(
      accountId,
      session
    );

    if (!account) {
      throw new FinanceDomainError(
        'Akun tidak ditemukan.',
        'FINANCE_ACCOUNT_NOT_FOUND'
      );
    }

    if (account.is_system) {
      throw new FinanceDomainError(
        'System account tidak dapat diubah.',
        'FINANCE_SYSTEM_ACCOUNT_READ_ONLY'
      );
    }

    const updated =
      await this.repository.updateAccountDetails(
        accountId,
        data,
        session
      );

    if (!updated) {
      throw new FinanceDomainError(
        'Akun tidak dapat diubah.',
        'FINANCE_ACCOUNT_UPDATE_FAILED'
      );
    }

    return FinanceAccountDetailsResponseSchema.parse({
      id: String(updated._id),
      name: updated.name,
      description: updated.description ?? null,
    });
  }

  async requireSelectable(
    accountId: string,
    session?: ClientSession
  ): Promise<FinanceAccountDTO> {
    const record = await this.repository.findSelectableById(
      accountId,
      session
    );

    if (!record) {
      throw new FinanceDomainError(
        'Akun tidak ditemukan, tidak aktif, atau tidak dapat digunakan untuk posting.',
        'FINANCE_ACCOUNT_NOT_SELECTABLE'
      );
    }

    return mapAccount(record, 0);
  }
}
