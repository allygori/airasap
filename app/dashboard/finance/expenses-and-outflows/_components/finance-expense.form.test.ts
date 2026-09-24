import { FinanceExpenseFormSchema } from './finance-expense-form.schema';

const validExpense = {
  category_account_id: '0123456789abcdef01234567',
  amount: '150000',
  expense_date: '2026-09-24',
  description: 'Internet toko bulan September',
  vendor_name: '',
  reference: '',
  payment_timing: 'paid',
  payment_account_id: '1123456789abcdef01234567',
  notes: '',
  attachment_reference: '',
};

describe('FinanceExpenseFormSchema', () => {
  it('accepts a paid expense with a payment account', () => {
    expect(
      FinanceExpenseFormSchema.safeParse(validExpense)
        .success
    ).toBe(true);
  });

  it('requires a payment account when the expense is paid', () => {
    const result = FinanceExpenseFormSchema.safeParse({
      ...validExpense,
      payment_account_id: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejects impossible dates and non-positive amounts', () => {
    expect(
      FinanceExpenseFormSchema.safeParse({
        ...validExpense,
        expense_date: '2026-02-31',
      }).success
    ).toBe(false);
    expect(
      FinanceExpenseFormSchema.safeParse({
        ...validExpense,
        amount: '0',
      }).success
    ).toBe(false);
  });
});
