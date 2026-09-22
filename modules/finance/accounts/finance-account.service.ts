import type { ClientSession } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import type {
  FinanceAccountDTO,
  FinanceAccountFilterDTO,
  FinanceAccountListResponseDTO,
} from './finance-account.dto';
import {
  FinanceAccountRepository,
  type FinanceAccountPersistenceRecord,
} from './finance-account.repository';
import { FinanceAccountResponseSchema } from './finance-account.schema';
import type { FinanceTenantContext } from '../finance.types';

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
  private readonly repository: FinanceAccountRepository;

  constructor(context: FinanceTenantContext) {
    this.repository = new FinanceAccountRepository(context);
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
