import { createFinanceSubledgerSettlementFormSchema } from './finance-subledger-settlement-form.schema';

const balances = [
  {
    source_key: 'journal-one:item-one',
    source_journal_entry_id: '0123456789abcdef01234567',
    source_item_id: '1123456789abcdef01234567',
    balance_type: 'payable' as const,
    source_type: 'purchase',
    source_id: 'purchase-one',
    source_label: 'Supplier A',
    description: 'Pembelian stok',
    transaction_date: '2026-09-01T00:00:00.000Z',
    due_date: null,
    overdue_status: 'not_configured' as const,
    account: {
      id: '2123456789abcdef01234567',
      code: '2100',
      name: 'Utang Usaha',
    },
    original_amount: 500000,
    settled_amount: 100000,
    outstanding_amount: 400000,
    settlement_status: 'partial' as const,
    last_settlement_date: null,
    currency: 'IDR',
  },
];

const paymentAccounts = [
  {
    id: '3123456789abcdef01234567',
    code: '1001',
    name: 'Kas Utama',
  },
];

const validSettlement = {
  source_key: balances[0].source_key,
  amount: '250000',
  settlement_date: '2026-09-24',
  payment_account_id: paymentAccounts[0].id,
  reference: '',
};

describe('FinanceSubledgerSettlementFormSchema', () => {
  const schema = createFinanceSubledgerSettlementFormSchema(
    {
      balances,
      paymentAccounts,
    }
  );

  it('accepts a partial settlement within the open balance', () => {
    expect(schema.safeParse(validSettlement).success).toBe(
      true
    );
  });

  it('rejects a settlement above the open balance', () => {
    expect(
      schema.safeParse({
        ...validSettlement,
        amount: '400001',
      }).success
    ).toBe(false);
  });

  it('rejects an unavailable payment account or source balance', () => {
    expect(
      schema.safeParse({
        ...validSettlement,
        payment_account_id: '4123456789abcdef01234567',
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        ...validSettlement,
        source_key: 'missing',
      }).success
    ).toBe(false);
  });
});
