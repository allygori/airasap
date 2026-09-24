import { FinanceSaleFullReturnFormSchema } from './finance-sale-full-return-form.schema';

describe('FinanceSaleFullReturnFormSchema', () => {
  it('accepts a valid correction date and reason', () => {
    expect(
      FinanceSaleFullReturnFormSchema.safeParse({
        effective_date: '2026-09-24',
        description: 'Seluruh pesanan dikembalikan pembeli',
      }).success
    ).toBe(true);
  });

  it('requires a reason and a real calendar date', () => {
    expect(
      FinanceSaleFullReturnFormSchema.safeParse({
        effective_date: '2026-02-31',
        description: '',
      }).success
    ).toBe(false);
  });
});
