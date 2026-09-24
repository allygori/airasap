import { FinanceCashBankTransferFormSchema } from './finance-cash-bank-transfer-form.schema';

const validTransfer = {
  source_account_id: '0123456789abcdef01234567',
  destination_account_id: '1123456789abcdef01234567',
  amount: '500000',
  transaction_date: '2026-09-24',
  reference: '',
  description: '',
};

describe('FinanceCashBankTransferFormSchema', () => {
  it('accepts a valid transfer between different accounts', () => {
    expect(
      FinanceCashBankTransferFormSchema.safeParse(
        validTransfer
      ).success
    ).toBe(true);
  });

  it('rejects identical source and destination accounts', () => {
    expect(
      FinanceCashBankTransferFormSchema.safeParse({
        ...validTransfer,
        destination_account_id:
          validTransfer.source_account_id,
      }).success
    ).toBe(false);
  });

  it('rejects impossible dates and non-positive amounts', () => {
    expect(
      FinanceCashBankTransferFormSchema.safeParse({
        ...validTransfer,
        transaction_date: '2026-02-31',
      }).success
    ).toBe(false);
    expect(
      FinanceCashBankTransferFormSchema.safeParse({
        ...validTransfer,
        amount: '0',
      }).success
    ).toBe(false);
  });
});
