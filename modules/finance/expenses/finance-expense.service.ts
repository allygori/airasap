import { Types, type ClientSession } from 'mongoose';
import { FinanceAccountRepository } from '../accounts/finance-account.repository';
import { FINANCE_CASH_BANK_SUBTYPE_VALUES } from '../cash-and-bank/finance-cash-bank.constants';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import { FinanceJournalService } from '../journal/finance-journal.service';
import type { FinanceOperationalPostingDTO } from '../journal/finance-journal.dto';
import type {
  FinanceExpenseInputDTO,
  FinanceExpenseResponseDTO,
} from './finance-expense.dto';
import {
  FinanceExpenseInputSchema,
  FinanceExpenseResponseSchema,
} from './finance-expense.schema';
import {
  FinanceExpenseRepository,
  type CreateFinanceExpenseRecord,
  type FinanceExpensePersistenceRecord,
} from './finance-expense.repository';

type FinanceExpenseAccountPort = Pick<
  FinanceAccountRepository,
  | 'findSelectableById'
  | 'findSelectableBySubtype'
  | 'findSelectableByCode'
>;

type FinanceExpenseJournalPort = Pick<
  FinanceJournalService,
  'postOperational'
>;

type FinanceExpenseRepositoryPort = Pick<
  FinanceExpenseRepository,
  | 'findByIdempotencyKey'
  | 'findExpenseById'
  | 'createDraft'
  | 'markPosted'
>;

const eligiblePaymentSubtypes = new Set<string>(
  FINANCE_CASH_BANK_SUBTYPE_VALUES
);

const getIdempotencyKey = (input: FinanceExpenseInputDTO) =>
  input.idempotency_key ??
  `finance-expense:${new Types.ObjectId().toHexString()}`;

const isDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  if (!('code' in error)) return false;
  return (error as { code?: unknown }).code === 11000;
};

const mapAccount = (
  id: Types.ObjectId | null | undefined,
  code: string | null | undefined,
  name: string | null | undefined
) =>
  id && code && name
    ? { id: String(id), code, name }
    : null;

const toResponse = (
  record: FinanceExpensePersistenceRecord,
  replayed: boolean
): FinanceExpenseResponseDTO =>
  FinanceExpenseResponseSchema.parse({
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
    payment_account: mapAccount(
      record.payment_account,
      record.payment_account_code,
      record.payment_account_name
    ),
    offset_account: mapAccount(
      record.offset_account,
      record.offset_account_code,
      record.offset_account_name
    ),
    notes: record.notes ?? null,
    attachment_reference:
      record.attachment_reference ?? null,
    status: record.status,
    journal_entry_id: record.journal_entry
      ? String(record.journal_entry)
      : null,
    idempotency_key: record.idempotency_key,
    replayed,
  });

const assertSameRequest = (
  existing: FinanceExpensePersistenceRecord,
  input: FinanceExpenseInputDTO,
  idempotencyKey: string
) => {
  const sameRequest =
    existing.category_account.toString() ===
      input.category_account_id &&
    existing.amount === input.amount &&
    existing.expense_date.getTime() ===
      input.expense_date.getTime() &&
    existing.description === input.description &&
    (existing.vendor_name ?? null) ===
      (input.vendor_name ?? null) &&
    (existing.reference ?? null) ===
      (input.reference ?? null) &&
    existing.payment_timing === input.payment_timing &&
    String(existing.payment_account ?? '') ===
      (input.payment_account_id ?? '') &&
    (existing.notes ?? null) === (input.notes ?? null) &&
    (existing.attachment_reference ?? null) ===
      (input.attachment_reference ?? null) &&
    existing.idempotency_key === idempotencyKey;

  if (!sameRequest) {
    throw new FinanceDomainError(
      'Idempotency key sudah digunakan untuk expense dengan data berbeda.',
      'FINANCE_EXPENSE_IDEMPOTENCY_CONFLICT'
    );
  }
};

export class FinanceExpenseService {
  private readonly accountRepository: FinanceExpenseAccountPort;
  private readonly journalService: FinanceExpenseJournalPort;
  private readonly expenseRepository: FinanceExpenseRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      accountRepository?: FinanceExpenseAccountPort;
      journalService?: FinanceExpenseJournalPort;
      expenseRepository?: FinanceExpenseRepositoryPort;
    }
  ) {
    assertFinanceTenant(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
    this.journalService =
      dependencies?.journalService ??
      new FinanceJournalService(context);
    this.expenseRepository =
      dependencies?.expenseRepository ??
      new FinanceExpenseRepository(context);
  }

  async createDraft(
    input: FinanceExpenseInputDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceExpenseResponseDTO> {
    const data = FinanceExpenseInputSchema.parse(input);
    const idempotencyKey = getIdempotencyKey(data);
    const existing =
      await this.expenseRepository.findByIdempotencyKey(
        idempotencyKey,
        session
      );
    if (existing) {
      assertSameRequest(existing, data, idempotencyKey);
      return toResponse(existing, true);
    }

    const categoryAccount =
      await this.resolveExpenseAccount(
        data.category_account_id,
        session
      );
    const paymentAccount =
      data.payment_timing === 'paid'
        ? await this.resolvePaymentAccount(
            data.payment_account_id!,
            session
          )
        : null;

    const created = await this.createExpense(
      {
        category_account: categoryAccount._id,
        category_account_code: categoryAccount.code,
        category_account_name: categoryAccount.name,
        amount: data.amount,
        expense_date: data.expense_date,
        description: data.description,
        vendor_name: data.vendor_name ?? null,
        reference: data.reference ?? null,
        payment_timing: data.payment_timing,
        payment_account: paymentAccount?._id ?? null,
        payment_account_code: paymentAccount?.code ?? null,
        payment_account_name: paymentAccount?.name ?? null,
        offset_account: null,
        offset_account_code: null,
        offset_account_name: null,
        notes: data.notes ?? null,
        attachment_reference:
          data.attachment_reference ?? null,
        status: 'draft',
        journal_entry: null,
        idempotency_key: idempotencyKey,
      },
      session
    );

    return toResponse(created, false);
  }

  async post(
    expenseId: string,
    session?: ClientSession
  ): Promise<FinanceExpenseResponseDTO> {
    const expense =
      await this.expenseRepository.findExpenseById(
        expenseId,
        session
      );
    if (!expense) {
      throw new FinanceDomainError(
        'Expense Finance tidak ditemukan.',
        'FINANCE_EXPENSE_NOT_FOUND'
      );
    }
    if (expense.status === 'posted') {
      return toResponse(expense, true);
    }

    const categoryAccount =
      await this.resolveExpenseAccount(
        String(expense.category_account),
        session
      );
    const offsetAccount =
      expense.payment_timing === 'paid'
        ? await this.resolvePaymentAccount(
            String(expense.payment_account ?? ''),
            session
          )
        : await this.resolvePayableAccount(session);

    const journalLines: FinanceOperationalPostingDTO['lines'] =
      [
        {
          account_id: String(categoryAccount._id),
          debit: expense.amount,
          credit: 0,
          description: expense.description,
        },
        {
          account_id: String(offsetAccount._id),
          debit: 0,
          credit: expense.amount,
          description:
            expense.payment_timing === 'payable'
              ? 'Utang expense'
              : 'Pembayaran expense',
        },
      ];
    const journalResult =
      await this.journalService.postOperational(
        {
          transaction_date: expense.expense_date,
          posting_date: expense.expense_date,
          currency: 'IDR',
          description: expense.description,
          source_type: 'expense',
          source_id: String(expense._id),
          source_event: 'expense_posted',
          idempotency_key: `finance-expense-journal:${String(
            expense._id
          )}`,
          lines: journalLines,
        },
        session
      );

    const posted = await this.expenseRepository.markPosted(
      String(expense._id),
      journalResult.journal_entry.id,
      String(offsetAccount._id),
      offsetAccount.code,
      offsetAccount.name,
      session
    );
    if (!posted) {
      const latest =
        await this.expenseRepository.findExpenseById(
          String(expense._id),
          session
        );
      if (latest?.status === 'posted') {
        return toResponse(latest, true);
      }

      throw new FinanceDomainError(
        'Journal expense berhasil dibuat tetapi expense gagal ditandai posted.',
        'FINANCE_EXPENSE_FINALIZATION_FAILED'
      );
    }

    return toResponse(posted, journalResult.replayed);
  }

  private async createExpense(
    data: CreateFinanceExpenseRecord,
    session?: ClientSession
  ): Promise<FinanceExpensePersistenceRecord> {
    try {
      return await this.expenseRepository.createDraft(
        data,
        session
      );
    } catch (error: unknown) {
      if (!isDuplicateKeyError(error)) throw error;
      const existing =
        await this.expenseRepository.findByIdempotencyKey(
          data.idempotency_key,
          session
        );
      if (existing) {
        if (
          existing.category_account.toString() ===
            data.category_account.toString() &&
          existing.amount === data.amount &&
          existing.expense_date.getTime() ===
            data.expense_date.getTime() &&
          existing.payment_timing === data.payment_timing &&
          String(existing.payment_account ?? '') ===
            String(data.payment_account ?? '')
        ) {
          return existing;
        }

        throw new FinanceDomainError(
          'Idempotency key sudah digunakan untuk expense dengan data berbeda.',
          'FINANCE_EXPENSE_IDEMPOTENCY_CONFLICT'
        );
      }
      throw new FinanceDomainError(
        'Expense Finance gagal dibuat karena konflik data.',
        'FINANCE_EXPENSE_IDEMPOTENCY_CONFLICT'
      );
    }
  }

  private async resolveExpenseAccount(
    accountId: string,
    session?: ClientSession
  ) {
    const account =
      await this.accountRepository.findSelectableById(
        accountId,
        session
      );
    if (
      !account ||
      !['expense', 'other_expense'].includes(account.type)
    ) {
      throw new FinanceDomainError(
        'Kategori expense harus berupa akun Expense atau Other Expense yang aktif dan postable.',
        'FINANCE_EXPENSE_CATEGORY_ACCOUNT_INVALID'
      );
    }
    return account;
  }

  private async resolvePaymentAccount(
    accountId: string,
    session?: ClientSession
  ) {
    const account =
      await this.accountRepository.findSelectableById(
        accountId,
        session
      );
    if (
      !account ||
      account.type !== 'asset' ||
      !eligiblePaymentSubtypes.has(account.subtype ?? '')
    ) {
      throw new FinanceDomainError(
        'Akun pembayaran expense harus berupa Kas, Bank, E-wallet, atau Saldo Marketplace yang aktif dan postable.',
        'FINANCE_EXPENSE_PAYMENT_ACCOUNT_INVALID'
      );
    }
    return account;
  }

  private async resolvePayableAccount(
    session?: ClientSession
  ) {
    const account =
      (await this.accountRepository.findSelectableBySubtype(
        'accounts_payable',
        session
      )) ??
      (await this.accountRepository.findSelectableByCode(
        '2100',
        session
      ));
    if (!account || account.type !== 'liability') {
      throw new FinanceDomainError(
        'Akun Utang Usaha aktif dan postable belum tersedia.',
        'FINANCE_EXPENSE_PAYABLE_ACCOUNT_MISSING'
      );
    }
    return account;
  }
}
