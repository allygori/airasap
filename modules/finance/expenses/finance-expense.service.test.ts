import { Types } from 'mongoose';
import type { FinanceAccountPersistenceRecord } from '../accounts/finance-account.repository';
import type { FinanceJournalService } from '../journal/finance-journal.service';
import { FinanceDomainError } from '../finance.error';
import type {
  FinanceExpensePersistenceRecord,
  FinanceExpenseRepository,
} from './finance-expense.repository';
import { FinanceExpenseService } from './finance-expense.service';

const organizationId = '507f1f77bcf86cd799439010';
const categoryAccountId = new Types.ObjectId();
const paymentAccountId = new Types.ObjectId();
const payableAccountId = new Types.ObjectId();
const expenseId = new Types.ObjectId();
const journalId = new Types.ObjectId();

const makeAccount = (
  id: Types.ObjectId,
  code: string,
  name: string,
  type: string,
  subtype: string
): FinanceAccountPersistenceRecord => ({
  _id: id,
  organization: new Types.ObjectId(organizationId),
  code,
  name,
  type,
  subtype,
  parent_account: null,
  normal_balance: type === 'liability' ? 'credit' : 'debit',
  is_system: false,
  is_postable: true,
  is_active: true,
  display_order: 1,
});

const categoryAccount = makeAccount(
  categoryAccountId,
  '6100',
  'Beban Operasional',
  'expense',
  'operating_expense'
);
const paymentAccount = makeAccount(
  paymentAccountId,
  '1120',
  'Bank Operasional',
  'asset',
  'bank'
);
const payableAccount = makeAccount(
  payableAccountId,
  '2100',
  'Utang Usaha',
  'liability',
  'accounts_payable'
);

const makeJournalResult = () => ({
  journal_entry: {
    id: String(journalId),
    entry_number: 'FIN-EXPENSE-1',
    transaction_date: '2026-09-22T00:00:00.000Z',
    posting_date: '2026-09-22T00:00:00.000Z',
    period: '2026-09',
    currency: 'IDR',
    description: 'Internet toko bulan September',
    source_type: 'expense',
    source_id: String(expenseId),
    source_event: 'expense_posted',
    idempotency_key: `finance-expense-journal:${String(expenseId)}`,
    status: 'posted' as const,
    posted_at: '2026-09-22T00:00:00.000Z',
    posted_by: null,
    reversal_of: null,
    lines: [],
  },
  replayed: false,
});

const makeDependencies = () => {
  let current: FinanceExpensePersistenceRecord | null =
    null;
  const journalService: Pick<
    FinanceJournalService,
    'postOperational'
  > = {
    postOperational: jest.fn(async () =>
      makeJournalResult()
    ),
  };
  const expenseRepository: Pick<
    FinanceExpenseRepository,
    | 'findByIdempotencyKey'
    | 'findExpenseById'
    | 'createDraft'
    | 'markPosted'
  > = {
    findByIdempotencyKey: async () => current,
    findExpenseById: async () => current,
    createDraft: async (data) => {
      current = {
        ...data,
        _id: expenseId,
        organization: new Types.ObjectId(organizationId),
      };
      return current;
    },
    markPosted: async (
      _id,
      journalEntryId,
      offsetAccountId,
      offsetAccountCode,
      offsetAccountName
    ) => {
      if (!current) return null;
      current = {
        ...current,
        status: 'posted',
        journal_entry: new Types.ObjectId(journalEntryId),
        offset_account: new Types.ObjectId(offsetAccountId),
        offset_account_code: offsetAccountCode,
        offset_account_name: offsetAccountName,
      };
      return current;
    },
  };
  const accountRepository = {
    findSelectableById: async (id: string) => {
      if (id === String(categoryAccountId))
        return categoryAccount;
      if (id === String(paymentAccountId))
        return paymentAccount;
      return null;
    },
    findSelectableBySubtype: async (subtype: string) =>
      subtype === 'accounts_payable'
        ? payableAccount
        : null,
    findSelectableByCode: async (code: string) =>
      code === '2100' ? payableAccount : null,
  };

  return {
    accountRepository,
    journalService,
    expenseRepository,
    getCurrent: () => current,
  };
};

const input = {
  category_account_id: String(categoryAccountId),
  amount: 150000,
  expense_date: '2026-09-22T00:00:00.000Z',
  description: 'Internet toko bulan September',
  vendor_name: 'Penyedia internet',
  payment_timing: 'paid' as const,
  payment_account_id: String(paymentAccountId),
  idempotency_key: 'expense-key-1',
};

describe('FinanceExpenseService', () => {
  it('keeps draft side-effect free and posts a balanced paid expense journal', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceExpenseService(
      { organizationId },
      dependencies
    );

    const draft = await service.createDraft(input);

    expect(draft).toMatchObject({
      status: 'draft',
      amount: 150000,
      journal_entry_id: null,
    });
    expect(
      dependencies.journalService.postOperational
    ).not.toHaveBeenCalled();

    const posted = await service.post(draft.expense_id);

    expect(posted).toMatchObject({
      status: 'posted',
      journal_entry_id: String(journalId),
      offset_account: {
        code: '1120',
        name: 'Bank Operasional',
      },
    });
    expect(
      dependencies.journalService.postOperational
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        source_type: 'expense',
        lines: [
          expect.objectContaining({
            account_id: String(categoryAccountId),
            debit: 150000,
            credit: 0,
          }),
          expect.objectContaining({
            account_id: String(paymentAccountId),
            debit: 0,
            credit: 150000,
          }),
        ],
      }),
      undefined
    );
  });

  it('credits Utang Usaha when the expense is payable', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceExpenseService(
      { organizationId },
      dependencies
    );

    const draft = await service.createDraft({
      ...input,
      payment_timing: 'payable',
      payment_account_id: undefined,
      idempotency_key: 'expense-key-payable',
    });
    const posted = await service.post(draft.expense_id);

    expect(posted.offset_account).toMatchObject({
      code: '2100',
      name: 'Utang Usaha',
    });
    expect(
      dependencies.journalService.postOperational
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        lines: expect.arrayContaining([
          expect.objectContaining({
            account_id: String(payableAccountId),
            credit: 150000,
          }),
        ]),
      }),
      undefined
    );
  });

  it('replays an identical draft request without creating a duplicate', async () => {
    const dependencies = makeDependencies();
    const service = new FinanceExpenseService(
      { organizationId },
      dependencies
    );

    await service.createDraft(input);
    const replay = await service.createDraft(input);

    expect(replay.replayed).toBe(true);
    expect(dependencies.getCurrent()?.status).toBe('draft');
  });

  it('rejects an account that is not an expense category', async () => {
    const dependencies = makeDependencies();
    dependencies.accountRepository.findSelectableById =
      async () => paymentAccount;
    const service = new FinanceExpenseService(
      { organizationId },
      dependencies
    );

    await expect(
      service.createDraft(input)
    ).rejects.toMatchObject<Partial<FinanceDomainError>>({
      code: 'FINANCE_EXPENSE_CATEGORY_ACCOUNT_INVALID',
    });
  });
});
