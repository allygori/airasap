import { FinanceAccountRepository } from '../accounts/finance-account.repository';
import type { FinanceAccountPersistenceRecord } from '../accounts/finance-account.repository';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import { FinanceJournalRepository } from '../journal/finance-journal.repository';
import type {
  FinanceOwnerWithdrawalListQueryDTO,
  FinanceOwnerWithdrawalListResponseDTO,
  FinanceOwnerWithdrawalSummaryDTO,
} from './finance-owner-withdrawal.dto';
import {
  FinanceOwnerWithdrawalListQuerySchema,
  FinanceOwnerWithdrawalListResponseSchema,
  FinanceOwnerWithdrawalSummarySchema,
} from './finance-owner-withdrawal.schema';
import {
  FinanceOwnerWithdrawalRepository,
  type FinanceOwnerWithdrawalPersistenceRecord,
} from './finance-owner-withdrawal.repository';

type FinanceOwnerWithdrawalReadRepositoryPort = Pick<
  FinanceOwnerWithdrawalRepository,
  'list'
>;

type FinanceOwnerWithdrawalAccountPort = Pick<
  FinanceAccountRepository,
  'list'
>;

type FinanceOwnerWithdrawalJournalReadPort = Pick<
  FinanceJournalRepository,
  'aggregatePostedOwnerDrawingMovements'
>;

const toSummary = (
  record: FinanceOwnerWithdrawalPersistenceRecord
): FinanceOwnerWithdrawalSummaryDTO =>
  FinanceOwnerWithdrawalSummarySchema.parse({
    withdrawal_id: String(record._id),
    owner_account: {
      id: String(record.owner_account),
      code: record.owner_account_code,
      name: record.owner_account_name,
    },
    payment_account: {
      id: String(record.payment_account),
      code: record.payment_account_code,
      name: record.payment_account_name,
    },
    amount: record.amount,
    transaction_date: record.transaction_date.toISOString(),
    description: record.description,
    reference: record.reference ?? null,
    status: record.status,
    journal_entry_id: record.journal_entry
      ? String(record.journal_entry)
      : null,
    reversal_journal_entry_id: record.reversal_journal_entry
      ? String(record.reversal_journal_entry)
      : null,
    idempotency_key: record.idempotency_key,
  });

export class FinanceOwnerWithdrawalReadService {
  private readonly repository: FinanceOwnerWithdrawalReadRepositoryPort;
  private readonly accountRepository: FinanceOwnerWithdrawalAccountPort;
  private readonly journalRepository: FinanceOwnerWithdrawalJournalReadPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      repository?: FinanceOwnerWithdrawalReadRepositoryPort;
      accountRepository?: FinanceOwnerWithdrawalAccountPort;
      journalRepository?: FinanceOwnerWithdrawalJournalReadPort;
    }
  ) {
    assertFinanceTenant(context);
    this.repository =
      dependencies?.repository ??
      new FinanceOwnerWithdrawalRepository(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
    this.journalRepository =
      dependencies?.journalRepository ??
      new FinanceJournalRepository(context);
  }

  async list(
    input: FinanceOwnerWithdrawalListQueryDTO | unknown
  ): Promise<FinanceOwnerWithdrawalListResponseDTO> {
    const query =
      FinanceOwnerWithdrawalListQuerySchema.parse(input);
    const allEquityAccounts =
      await this.accountRepository.list({
        type: 'equity',
        is_postable: true,
        limit: 500,
      });
    const ownerAccounts = allEquityAccounts.filter(
      (account) => account.subtype === 'owner_drawings'
    );
    const ownerAccountIds = ownerAccounts.map((account) =>
      String(account._id)
    );

    if (
      query.owner_account_id &&
      !ownerAccountIds.includes(query.owner_account_id)
    ) {
      throw new FinanceDomainError(
        'Pilih akun prive pemilik yang valid untuk filter.',
        'FINANCE_OWNER_WITHDRAWAL_OWNER_ACCOUNT_INVALID'
      );
    }

    const filteredAccountIds = query.owner_account_id
      ? [query.owner_account_id]
      : ownerAccountIds;
    const [{ records, total }, monthlyMovements] =
      await Promise.all([
        this.repository.list(query),
        this.journalRepository.aggregatePostedOwnerDrawingMovements(
          filteredAccountIds,
          query.from_date,
          query.to_date
        ),
      ]);

    const accountsById = new Map(
      ownerAccounts.map((account) => [
        String(account._id),
        account,
      ])
    );
    const monthlyTotals = monthlyMovements.flatMap(
      (movement) => {
        const account = accountsById.get(
          String(movement._id.account_id)
        );
        if (!account) return [];

        return [
          {
            period: movement._id.period,
            owner_account: toAccountOption(account),
            debit_total: movement.debit_total,
            credit_total: movement.credit_total,
            net_debit:
              movement.debit_total - movement.credit_total,
          },
        ];
      }
    );

    return FinanceOwnerWithdrawalListResponseSchema.parse({
      withdrawals: records.map(toSummary),
      monthly_totals: monthlyTotals,
      summary_range: {
        from_date: query.from_date,
        to_date: query.to_date,
      },
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        total_pages: Math.ceil(total / query.limit),
      },
    });
  }
}

function toAccountOption(
  account: FinanceAccountPersistenceRecord
) {
  return {
    id: String(account._id),
    code: account.code,
    name: account.name,
  };
}
