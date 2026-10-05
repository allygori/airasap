import { FinanceEWalletAccountCreateInputSchema } from './finance-e-wallet-account.schema';

describe('FinanceEWalletAccountCreateInputSchema', () => {
  it('requires a provider and exactly four phone digits', () => {
    expect(
      FinanceEWalletAccountCreateInputSchema.safeParse({
        provider: 'DANA',
        account_last4: '0042',
      })
    ).toMatchObject({ success: true });
  });

  it.each(['', '123', '12345', '12a4'])(
    'rejects invalid phone suffix %j',
    (account_last4) => {
      expect(
        FinanceEWalletAccountCreateInputSchema.safeParse({
          provider: 'DANA',
          account_last4,
        }).success
      ).toBe(false);
    }
  );

  it('rejects a missing provider and legacy account name', () => {
    expect(
      FinanceEWalletAccountCreateInputSchema.safeParse({
        account_last4: '1234',
      }).success
    ).toBe(false);
    expect(
      FinanceEWalletAccountCreateInputSchema.safeParse({
        name: 'DANA Toko',
        provider: 'DANA',
        account_last4: '1234',
      }).success
    ).toBe(false);
  });

  it('trims values while preserving leading zeroes', () => {
    expect(
      FinanceEWalletAccountCreateInputSchema.parse({
        provider: ' DANA ',
        account_last4: ' 0042 ',
      })
    ).toEqual({
      provider: 'DANA',
      account_last4: '0042',
    });
  });
});
