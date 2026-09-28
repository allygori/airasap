import {
  FinanceOwnerWithdrawalInputSchema,
  FinanceOwnerWithdrawalListQuerySchema,
} from './finance-owner-withdrawal.schema';

const validInput = {
  owner_account_id: '507f1f77bcf86cd799439011',
  payment_account_id: '507f1f77bcf86cd799439012',
  amount: 250000,
  transaction_date: '2026-09-26T00:00:00.000Z',
};

describe('FinanceOwnerWithdrawalInputSchema', () => {
  it('accepts a valid, optional-description owner withdrawal', () => {
    expect(
      FinanceOwnerWithdrawalInputSchema.parse(validInput)
    ).toMatchObject({
      ...validInput,
      transaction_date: new Date(
        validInput.transaction_date
      ),
    });
  });

  it.each([0, -1, 1.5, Number.NaN])(
    'rejects invalid amount %s',
    (amount) => {
      expect(
        FinanceOwnerWithdrawalInputSchema.safeParse({
          ...validInput,
          amount,
        }).success
      ).toBe(false);
    }
  );

  it('rejects unknown fields so clients cannot provide tenant or journal data', () => {
    expect(
      FinanceOwnerWithdrawalInputSchema.safeParse({
        ...validInput,
        organization_id: '507f1f77bcf86cd799439099',
        journal_entry_id: '507f1f77bcf86cd799439098',
      }).success
    ).toBe(false);
  });
});

describe('FinanceOwnerWithdrawalListQuerySchema', () => {
  it('defaults to a bounded recent-list size', () => {
    expect(
      FinanceOwnerWithdrawalListQuerySchema.parse({})
    ).toEqual({
      limit: 25,
    });
  });

  it('rejects an unbounded list request', () => {
    expect(
      FinanceOwnerWithdrawalListQuerySchema.safeParse({
        limit: 1000,
      }).success
    ).toBe(false);
  });
});
