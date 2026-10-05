import type { ClientSession } from 'mongoose';
import { FinanceAccountRepository } from '../accounts/finance-account.repository';
import { FinanceJournalRepository } from '../journal/finance-journal.repository';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type {
  FinanceCashBankAccountDTO,
  FinanceCashBankQueryDTO,
  FinanceCashBankResponseDTO,
} from './finance-cash-bank.dto';
import {
  FINANCE_CASH_BANK_SUBTYPE_VALUES,
  type FinanceCashBankSubtype,
} from './finance-cash-bank.constants';
import {
  FinanceCashBankQuerySchema,
  FinanceCashBankResponseSchema,
} from './finance-cash-bank.schema';

type FinanceCashBankAccountPort = Pick<
  FinanceAccountRepository,
  'listPostableBySubtypes'
>;

type FinanceCashBankJournalPort = Pick<
  FinanceJournalRepository,
  'aggregatePostedAccountBalances'
>;

const mapMetadata = (
  metadata:
    | {
        institution?: string;
        account_last4?: string;
        account_holder?: string;
        provider?: string;
      }
    | undefined
) => ({
  institution: metadata?.institution ?? null,
  account_last4: metadata?.account_last4 ?? null,
  account_holder: metadata?.account_holder ?? null,
  provider: metadata?.provider ?? null,
});

const getBalance = (
  normalBalance: 'debit' | 'credit',
  debit: number,
  credit: number
) =>
  normalBalance === 'credit'
    ? credit - debit
    : debit - credit;

const toDateString = (value: Date | null) =>
  value ? value.toISOString() : null;

export class FinanceCashBankReadService {
  private readonly accountRepository: FinanceCashBankAccountPort;
  private readonly journalRepository: FinanceCashBankJournalPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      accountRepository?: FinanceCashBankAccountPort;
      journalRepository?: FinanceCashBankJournalPort;
    }
  ) {
    assertFinanceTenant(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
    this.journalRepository =
      dependencies?.journalRepository ??
      new FinanceJournalRepository(context);
  }

  async list(
    input: FinanceCashBankQueryDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceCashBankResponseDTO> {
    const query = FinanceCashBankQuerySchema.parse(input);
    const accounts =
      await this.accountRepository.listPostableBySubtypes(
        [...FINANCE_CASH_BANK_SUBTYPE_VALUES],
        query,
        session
      );
    const balances =
      await this.journalRepository.aggregatePostedAccountBalances(
        accounts.map((account) => String(account._id)),
        session
      );
    const balanceByAccountId = new Map(
      balances.map((balance) => [
        String(balance._id),
        balance,
      ])
    );

    const mappedAccounts: FinanceCashBankAccountDTO[] =
      accounts.map((account) => {
        const balance = balanceByAccountId.get(
          String(account._id)
        );
        const debitTotal = balance?.debit_total ?? 0;
        const creditTotal = balance?.credit_total ?? 0;
        const openingBalance = getBalance(
          account.normal_balance,
          balance?.opening_debit_total ?? 0,
          balance?.opening_credit_total ?? 0
        );

        return {
          id: String(account._id),
          code: account.code,
          name: account.name,
          is_active: account.is_active,
          subtype:
            account.subtype as FinanceCashBankSubtype,
          normal_balance: account.normal_balance,
          account_metadata: mapMetadata(
            account.account_metadata
          ),
          opening_balance: openingBalance,
          debit_total: debitTotal,
          credit_total: creditTotal,
          current_balance: getBalance(
            account.normal_balance,
            debitTotal,
            creditTotal
          ),
          journal_line_count:
            balance?.journal_line_count ?? 0,
          last_transaction_date: toDateString(
            balance?.last_transaction_date ?? null
          ),
        };
      });
    const totalBalance = mappedAccounts.reduce(
      (sum, account) => sum + account.current_balance,
      0
    );

    return FinanceCashBankResponseSchema.parse({
      accounts: mappedAccounts,
      meta: {
        total_accounts: mappedAccounts.length,
        accounts_with_activity: mappedAccounts.filter(
          (account) => account.journal_line_count > 0
        ).length,
        total_balance: totalBalance,
        limit: query.limit,
      },
    });
  }
}
