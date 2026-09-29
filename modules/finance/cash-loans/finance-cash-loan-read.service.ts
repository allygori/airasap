import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type {
  FinanceCashLoanListQueryDTO,
  FinanceCashLoanListResponseDTO,
  FinanceCashLoanSummaryDTO,
} from './finance-cash-loan.dto';
import {
  FinanceCashLoanBalanceSchema as FinanceCashLoanBalanceContract,
  FinanceCashLoanListQuerySchema,
  FinanceCashLoanListResponseSchema,
  FinanceCashLoanSummarySchema,
} from './finance-cash-loan.schema';
import {
  FinanceCashLoanRepository,
  type FinanceCashLoanPersistenceRecord,
} from './finance-cash-loan.repository';

type FinanceCashLoanReadRepositoryPort = Pick<
  FinanceCashLoanRepository,
  'list' | 'getPostedBalancesByLender'
>;

const mapAccount = (
  id: FinanceCashLoanPersistenceRecord['owner_account'],
  code: string | null,
  name: string | null
) =>
  id && code && name
    ? { id: String(id), code, name }
    : null;

const toSummary = (
  record: FinanceCashLoanPersistenceRecord
): FinanceCashLoanSummaryDTO =>
  FinanceCashLoanSummarySchema.parse({
    loan_id: String(record._id),
    event_type: record.event_type,
    lender: {
      key: record.lender_key,
      type: record.lender_type,
      name: record.lender_name,
      owner_account: mapAccount(
        record.owner_account,
        record.owner_account_code,
        record.owner_account_name
      ),
    },
    liability_account: {
      code: record.liability_account_code,
      name: record.liability_account_name,
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

export class FinanceCashLoanReadService {
  private readonly repository: FinanceCashLoanReadRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      repository?: FinanceCashLoanReadRepositoryPort;
    }
  ) {
    assertFinanceTenant(context);
    this.repository =
      dependencies?.repository ??
      new FinanceCashLoanRepository(context);
  }

  async list(
    input: FinanceCashLoanListQueryDTO | unknown
  ): Promise<FinanceCashLoanListResponseDTO> {
    const query =
      FinanceCashLoanListQuerySchema.parse(input);
    const [{ records, total }, postedBalances] =
      await Promise.all([
        this.repository.list(query),
        this.repository.getPostedBalancesByLender(),
      ]);

    const balances = postedBalances.map((balance) =>
      FinanceCashLoanBalanceContract.parse({
        lender: {
          key: balance._id,
          type: balance.lender_type,
          name: balance.lender_name,
          owner_account: mapAccount(
            balance.owner_account,
            balance.owner_account_code,
            balance.owner_account_name
          ),
        },
        received_total: balance.received_total,
        repayment_total: balance.repayment_total,
        outstanding_amount: Math.max(
          0,
          balance.received_total - balance.repayment_total
        ),
      })
    );

    return FinanceCashLoanListResponseSchema.parse({
      loans: records.map(toSummary),
      balances,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        total_pages: Math.ceil(total / query.limit),
      },
    });
  }
}
