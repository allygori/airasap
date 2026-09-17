import accountSeed from './account.seed.json';
import { AccountingDomainError } from '../accounting.error';
import {
  assertAccountingTenant,
  type AccountingTenantContext,
  toAccountingObjectId,
} from '../accounting.types';
import {
  AccountingAccountRepository,
  type SeedAccountRecord,
} from './account.repository';
import type { ClientSession } from 'mongoose';

type SeedJsonAccount = SeedAccountRecord & {
  parent_code: string | null;
};

type SeedJson = {
  accounts: SeedJsonAccount[];
};

export class AccountingAccountService {
  private readonly repository: AccountingAccountRepository;
  private readonly context: AccountingTenantContext;

  constructor(context: AccountingTenantContext) {
    assertAccountingTenant(context);
    this.context = context;
    this.repository = new AccountingAccountRepository(
      context
    );
  }

  async listActive() {
    return this.repository.findAllActive();
  }

  async findByCode(code: string, session?: ClientSession) {
    return this.repository.findByCode(code, session);
  }

  async seedDefaultAccounts(session?: ClientSession) {
    const seed = accountSeed as SeedJson;
    const accountsByCode = new Map<
      string,
      { _id: unknown }
    >();
    const pending = [...seed.accounts];
    let created = 0;
    let existing = 0;

    while (pending.length > 0) {
      const ready = pending.filter(
        (record) =>
          record.parent_code === null ||
          accountsByCode.has(record.parent_code)
      );

      if (ready.length === 0) {
        throw new AccountingDomainError(
          'Chart of Accounts memiliki parent_code yang tidak dapat di-resolve.',
          'INVALID_ACCOUNT_HIERARCHY'
        );
      }

      for (const record of ready) {
        const parent = record.parent_code
          ? accountsByCode.get(record.parent_code)
          : undefined;

        const before = await this.repository.findByCode(
          record.code,
          session
        );
        const account =
          await this.repository.upsertSeedAccount(
            record,
            parent
              ? toAccountingObjectId(
                  String(parent._id),
                  'parent_account'
                )
              : null,
            session
          );

        if (!account) {
          throw new AccountingDomainError(
            `Gagal menyiapkan akun ${record.code}.`,
            'ACCOUNT_SEED_FAILED'
          );
        }

        accountsByCode.set(record.code, account);
        if (before) existing += 1;
        else created += 1;
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
      organizationId: this.context.organizationId,
      total: seed.accounts.length,
      created,
      existing,
    };
  }
}
