import { Types } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type {
  FinanceExpenseDetailResponseDTO,
  FinanceExpenseListQueryDTO,
  FinanceExpenseListResponseDTO,
  FinanceExpenseSummaryDTO,
} from './finance-expense.dto';
import {
  FinanceExpenseDetailResponseSchema,
  FinanceExpenseListQuerySchema,
  FinanceExpenseListResponseSchema,
  FinanceExpenseSummarySchema,
} from './finance-expense.schema';
import {
  FinanceExpenseRepository,
  type FinanceExpensePersistenceRecord,
} from './finance-expense.repository';

type FinanceExpenseReadRepositoryPort = Pick<
  FinanceExpenseRepository,
  'list' | 'findExpenseById'
>;

const mapSummary = (
  record: FinanceExpensePersistenceRecord
): FinanceExpenseSummaryDTO =>
  FinanceExpenseSummarySchema.parse({
    expense_id: String(record._id),
    category_account: {
      id: String(record.category_account),
      code: record.category_account_code,
      name: record.category_account_name,
    },
    amount: record.amount,
    expense_date: record.expense_date.toISOString(),
    description: record.description,
    vendor_name: record.vendor_name ?? null,
    reference: record.reference ?? null,
    payment_timing: record.payment_timing,
    payment_account:
      record.payment_account &&
      record.payment_account_code &&
      record.payment_account_name
        ? {
            id: String(record.payment_account),
            code: record.payment_account_code,
            name: record.payment_account_name,
          }
        : null,
    offset_account:
      record.offset_account &&
      record.offset_account_code &&
      record.offset_account_name
        ? {
            id: String(record.offset_account),
            code: record.offset_account_code,
            name: record.offset_account_name,
          }
        : null,
    notes: record.notes ?? null,
    attachment_reference:
      record.attachment_reference ?? null,
    status: record.status,
    journal_entry_id: record.journal_entry
      ? String(record.journal_entry)
      : null,
    idempotency_key: record.idempotency_key,
  });

export class FinanceExpenseReadService {
  private readonly repository: FinanceExpenseReadRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      repository?: FinanceExpenseReadRepositoryPort;
    }
  ) {
    assertFinanceTenant(context);
    this.repository =
      dependencies?.repository ??
      new FinanceExpenseRepository(context);
  }

  async list(
    input: FinanceExpenseListQueryDTO | unknown
  ): Promise<FinanceExpenseListResponseDTO> {
    const query =
      FinanceExpenseListQuerySchema.parse(input);
    const result = await this.repository.list(query);

    return FinanceExpenseListResponseSchema.parse({
      expenses: result.records.map(mapSummary),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / query.limit),
      },
    });
  }

  async get(
    expenseId: string
  ): Promise<FinanceExpenseDetailResponseDTO> {
    if (!Types.ObjectId.isValid(expenseId)) {
      throw new FinanceDomainError(
        'Expense Finance tidak ditemukan.',
        'FINANCE_EXPENSE_NOT_FOUND'
      );
    }

    const record =
      await this.repository.findExpenseById(expenseId);
    if (!record) {
      throw new FinanceDomainError(
        'Expense Finance tidak ditemukan.',
        'FINANCE_EXPENSE_NOT_FOUND'
      );
    }

    return FinanceExpenseDetailResponseSchema.parse({
      expense: mapSummary(record),
    });
  }
}
