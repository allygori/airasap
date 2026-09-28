import {
  FinanceOwnerWithdrawalInputSchema,
  FinanceOwnerWithdrawalListQuerySchema,
  FinanceOwnerWithdrawalReversalInputSchema,
} from './finance-owner-withdrawal.schema';

const validListQuery = {
  from_date: '2026-01-01',
  to_date: '2026-09-28',
};

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
  it('defaults to the first page and a bounded page size', () => {
    expect(
      FinanceOwnerWithdrawalListQuerySchema.parse(
        validListQuery
      )
    ).toEqual({
      page: 1,
      limit: 25,
      ...validListQuery,
    });
  });

  it('rejects an unbounded page or date range', () => {
    expect(
      FinanceOwnerWithdrawalListQuerySchema.safeParse({
        ...validListQuery,
        limit: 1000,
      }).success
    ).toBe(false);
    expect(
      FinanceOwnerWithdrawalListQuerySchema.safeParse({
        from_date: '2020-01-01',
        to_date: '2026-01-01',
      }).success
    ).toBe(false);
  });

  it('rejects invalid calendar dates and inverted ranges', () => {
    expect(
      FinanceOwnerWithdrawalListQuerySchema.safeParse({
        from_date: '2026-02-30',
        to_date: '2026-03-01',
      }).success
    ).toBe(false);
    expect(
      FinanceOwnerWithdrawalListQuerySchema.safeParse({
        from_date: '2026-09-28',
        to_date: '2026-09-27',
      }).success
    ).toBe(false);
  });
});

describe('FinanceOwnerWithdrawalReversalInputSchema', () => {
  it('requires a valid date and a traceable reason', () => {
    expect(
      FinanceOwnerWithdrawalReversalInputSchema.safeParse({
        effective_date: '2026-09-27T00:00:00.000Z',
        reason: 'Koreksi nominal',
      }).success
    ).toBe(true);
    expect(
      FinanceOwnerWithdrawalReversalInputSchema.safeParse({
        effective_date: '2026-09-27T00:00:00.000Z',
        reason: '  ',
      }).success
    ).toBe(false);
  });
});
