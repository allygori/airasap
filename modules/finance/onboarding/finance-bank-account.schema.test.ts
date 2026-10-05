import { FinanceBankAccountCreateInputSchema } from './finance-bank-account.schema';

describe('FinanceBankAccountCreateInputSchema', () => {
  it('requires a bank name and exactly four account digits', () => {
    expect(
      FinanceBankAccountCreateInputSchema.safeParse({
        institution: 'BCA',
        account_last4: '0012',
      })
    ).toMatchObject({ success: true });
  });

  it.each(['', '123', '12345', '12a4'])(
    'rejects invalid account suffix %j',
    (account_last4) => {
      expect(
        FinanceBankAccountCreateInputSchema.safeParse({
          institution: 'BCA',
          account_last4,
        }).success
      ).toBe(false);
    }
  );

  it('rejects a missing bank name and legacy fields', () => {
    expect(
      FinanceBankAccountCreateInputSchema.safeParse({
        account_last4: '1234',
      }).success
    ).toBe(false);
    expect(
      FinanceBankAccountCreateInputSchema.safeParse({
        institution: 'BCA',
        account_last4: '1234',
        account_holder: 'Toko Contoh',
      }).success
    ).toBe(false);
  });

  it('trims values while preserving leading zeroes', () => {
    expect(
      FinanceBankAccountCreateInputSchema.parse({
        institution: ' BCA ',
        account_last4: ' 0012 ',
      })
    ).toEqual({
      institution: 'BCA',
      account_last4: '0012',
    });
  });
});
