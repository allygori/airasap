import { FinanceAccountFilterSchema } from './finance-account.schema';

describe('FinanceAccountFilterSchema', () => {
  it('parses boolean query values without treating false as true', () => {
    expect(
      FinanceAccountFilterSchema.parse({
        is_active: 'false',
        is_postable: 'true',
      })
    ).toMatchObject({
      is_active: false,
      is_postable: true,
      limit: 500,
    });
  });

  it('bounds the account list size', () => {
    expect(() =>
      FinanceAccountFilterSchema.parse({ limit: '501' })
    ).toThrow();
  });
});
