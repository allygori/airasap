import type { ClientSession } from 'mongoose';
import { CreateExpenseSchema } from './expense.schema';
import { ExpenseRepository } from './expense.repository';
import { AccountingAccountRepository } from '@/modules/accounting/accounts/account.repository';
import { JournalEntryService } from '@/modules/accounting/journal-entries/journal-entry.service';
import { StoreRepository } from '@/modules/stores/store.repository';
import { AccountingDomainError } from '@/modules/accounting/accounting.error';
import {
  assertAccountingTenant,
  getPeriodKeyFromDate,
  parseAccountingDate,
  toAccountingObjectId,
  validateSourceReference,
  type AccountingTenantContext,
} from '@/modules/accounting/accounting.types';
import { createAuditLog } from '@/modules/accounting/audit/audit-log.model';

const DEFAULT_EXPENSE_LIABILITY_ACCOUNT = '2100';

export class ExpenseService {
  private readonly repository: ExpenseRepository;
  private readonly accountRepository: AccountingAccountRepository;
  private readonly journalService: JournalEntryService;
  private readonly storeRepository: StoreRepository;
  private readonly context: AccountingTenantContext;

  constructor(context: AccountingTenantContext) {
    assertAccountingTenant(context);
    this.context = context;
    this.repository = new ExpenseRepository(context);
    this.accountRepository =
      new AccountingAccountRepository(context);
    this.journalService = new JournalEntryService(context);
    this.storeRepository = new StoreRepository({
      organizationId: context.organizationId,
    });
  }

  async createDraft(
    input: unknown,
    session?: ClientSession
  ) {
    const data = CreateExpenseSchema.parse(input);
    if (data.status !== 'draft') {
      throw new AccountingDomainError(
        'Expense baru harus dibuat sebagai draft.',
        'EXPENSE_MUST_START_AS_DRAFT'
      );
    }

    validateSourceReference(data);
    if (data.dimensions?.store) {
      const store = await this.storeRepository.findById(
        data.dimensions.store
      );
      if (!store) {
        throw new AccountingDomainError(
          'Store/workspace expense tidak ditemukan dalam organization aktif.',
          'EXPENSE_STORE_NOT_FOUND'
        );
      }
    }

    if (data.idempotency_key) {
      const existing =
        await this.repository.findByIdempotencyKey(
          data.idempotency_key,
          session
        );
      if (existing) return existing;
    }

    return this.repository.createExpense(
      {
        expense_account: data.expense_account,
        payment_account: data.payment_account,
        amount: data.amount,
        currency: data.currency,
        expense_date: parseAccountingDate(
          data.expense_date,
          'expense_date'
        ),
        description: data.description,
        vendor_name: data.vendor_name,
        source_type: data.source_type,
        source_id: data.source_id,
        idempotency_key: data.idempotency_key,
        dimensions: data.dimensions,
        attachment: data.attachment,
        status: 'draft',
      },
      session
    );
  }

  async post(
    expenseId: string,
    postedBy?: string,
    session?: ClientSession
  ) {
    const expense = await this.repository.findExpenseById(
      expenseId,
      session
    );
    if (!expense) {
      throw new AccountingDomainError(
        'Expense tidak ditemukan.',
        'EXPENSE_NOT_FOUND'
      );
    }

    if (
      expense.status === 'posted' &&
      expense.journal_entry
    ) {
      return expense;
    }
    if (expense.status === 'posted') {
      throw new AccountingDomainError(
        'Expense sudah posted tetapi journal_entry tidak tersedia.',
        'EXPENSE_JOURNAL_REFERENCE_MISSING'
      );
    }
    if (expense.status === 'voided') {
      throw new AccountingDomainError(
        'Expense voided tidak dapat diposting.',
        'EXPENSE_ALREADY_VOIDED'
      );
    }

    const actorId = postedBy
      ? toAccountingObjectId(postedBy, 'postedBy')
      : undefined;
    const expenseAccount = await this.getExpenseAccount(
      String(expense.expense_account),
      session
    );
    const paymentAccount = expense.payment_account
      ? await this.getPaymentAccount(
          String(expense.payment_account),
          session
        )
      : await this.accountRepository.findByCode(
          DEFAULT_EXPENSE_LIABILITY_ACCOUNT,
          session
        );

    if (!paymentAccount) {
      throw new AccountingDomainError(
        `Akun offset expense ${DEFAULT_EXPENSE_LIABILITY_ACCOUNT} tidak ditemukan.`,
        'DEFAULT_EXPENSE_LIABILITY_ACCOUNT_NOT_FOUND'
      );
    }

    const expenseDate = parseAccountingDate(
      expense.expense_date,
      'expense_date'
    );
    const journalEntry = await this.journalService.postNew(
      {
        entry_number: `EXP-${String(expense._id)}`,
        transaction_date: expenseDate.toISOString(),
        posting_date: expenseDate.toISOString(),
        period: getPeriodKeyFromDate(expenseDate),
        currency: expense.currency,
        description: expense.description,
        source_type: 'expense',
        source_id: String(expense._id),
        source_event: 'expense_posted',
        idempotency_key: `expense:${String(expense._id)}`,
        status: 'draft',
        lines: [
          {
            account: String(expenseAccount._id),
            debit: expense.amount,
            credit: 0,
            description: expense.description,
            dimensions: expense.dimensions,
          },
          {
            account: String(paymentAccount._id),
            debit: 0,
            credit: expense.amount,
            description: expense.vendor_name
              ? `Offset: ${expense.vendor_name}`
              : 'Offset expense',
            dimensions: expense.dimensions,
          },
        ],
      },
      postedBy,
      session
    );

    const posted = await this.repository.markPosted(
      expenseId,
      String(journalEntry._id),
      session
    );
    if (!posted) {
      const latest = await this.repository.findExpenseById(
        expenseId,
        session
      );
      if (latest?.status === 'posted') return latest;

      throw new AccountingDomainError(
        'Journal expense berhasil diposting tetapi dokumen expense gagal diperbarui.',
        'EXPENSE_FINALIZATION_FAILED'
      );
    }

    await createAuditLog(
      this.context,
      {
        action: 'expense.posted',
        entity_type: 'expense',
        entity_id: toAccountingObjectId(
          String(posted._id),
          'expense'
        ),
        ...(actorId ? { actor_id: actorId } : {}),
        metadata: {
          journal_entry_id: String(journalEntry._id),
          expense_account: String(expenseAccount._id),
          payment_account: String(paymentAccount._id),
        },
      },
      session
    );

    return posted;
  }

  async record(
    input: unknown,
    postedBy?: string,
    session?: ClientSession
  ) {
    const draft = await this.createDraft(input, session);
    return this.post(String(draft._id), postedBy, session);
  }

  private async getExpenseAccount(
    accountId: string,
    session?: ClientSession
  ) {
    const [account] =
      await this.accountRepository.findByIds(
        [accountId],
        session
      );
    if (!account) {
      throw new AccountingDomainError(
        'Expense account tidak ditemukan pada organization aktif.',
        'EXPENSE_ACCOUNT_NOT_FOUND'
      );
    }
    if (
      !account.is_active ||
      !account.is_postable ||
      !['expense', 'other_expense'].includes(account.type)
    ) {
      throw new AccountingDomainError(
        `Account ${account.code} bukan expense account yang dapat diposting.`,
        'INVALID_EXPENSE_ACCOUNT'
      );
    }

    return account;
  }

  private async getPaymentAccount(
    accountId: string,
    session?: ClientSession
  ) {
    const [account] =
      await this.accountRepository.findByIds(
        [accountId],
        session
      );
    if (!account) {
      throw new AccountingDomainError(
        'Payment account tidak ditemukan pada organization aktif.',
        'PAYMENT_ACCOUNT_NOT_FOUND'
      );
    }
    if (
      !account.is_active ||
      !account.is_postable ||
      !['asset', 'liability', 'equity'].includes(
        account.type
      )
    ) {
      throw new AccountingDomainError(
        `Account ${account.code} tidak valid sebagai offset expense.`,
        'INVALID_PAYMENT_ACCOUNT'
      );
    }

    return account;
  }
}
