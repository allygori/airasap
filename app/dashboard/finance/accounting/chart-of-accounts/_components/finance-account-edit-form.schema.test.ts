import { FinanceAccountEditFormSchema } from './finance-account-edit-form.schema';

describe('FinanceAccountEditFormSchema', () => {
  it('accepts a name with an optional description', () => {
    expect(
      FinanceAccountEditFormSchema.safeParse({
        name: 'Kas Operasional',
        description: 'Untuk transaksi harian.',
      }).success
    ).toBe(true);
  });

  it('requires a non-empty name and enforces description length', () => {
    expect(
      FinanceAccountEditFormSchema.safeParse({
        name: '   ',
        description: 'Catatan',
      }).success
    ).toBe(false);
    expect(
      FinanceAccountEditFormSchema.safeParse({
        name: 'Kas Operasional',
        description: 'x'.repeat(501),
      }).success
    ).toBe(false);
  });
});
