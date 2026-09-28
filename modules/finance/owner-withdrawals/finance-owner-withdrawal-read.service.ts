import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
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
  'listRecent'
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
    idempotency_key: record.idempotency_key,
  });

export class FinanceOwnerWithdrawalReadService {
  private readonly repository: FinanceOwnerWithdrawalReadRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      repository?: FinanceOwnerWithdrawalReadRepositoryPort;
    }
  ) {
    assertFinanceTenant(context);
    this.repository =
      dependencies?.repository ??
      new FinanceOwnerWithdrawalRepository(context);
  }

  async list(
    input: FinanceOwnerWithdrawalListQueryDTO | unknown
  ): Promise<FinanceOwnerWithdrawalListResponseDTO> {
    const query =
      FinanceOwnerWithdrawalListQuerySchema.parse(input);
    const records = await this.repository.listRecent(query);

    return FinanceOwnerWithdrawalListResponseSchema.parse({
      withdrawals: records.map(toSummary),
      meta: { limit: query.limit },
    });
  }
}
