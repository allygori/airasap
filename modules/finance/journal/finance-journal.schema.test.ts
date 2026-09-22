import { FinanceOperationalPostingSchema } from './finance-journal.schema';

const validPosting = {
  transaction_date: '2026-09-22T00:00:00.000Z',
  description: 'Penjualan marketplace',
  source_type: 'order',
  source_id: 'order-123',
  source_event: 'completed',
  idempotency_key: 'order:order-123:completed',
  lines: [
    {
      account_id: '507f1f77bcf86cd799439011',
      debit: 10000,
      credit: 0,
    },
    {
      account_id: '507f1f77bcf86cd799439012',
      debit: 0,
      credit: 10000,
    },
  ],
};

describe('FinanceOperationalPostingSchema', () => {
  it('requires a balanced set of lines', () => {
    expect(() =>
      FinanceOperationalPostingSchema.parse({
        ...validPosting,
        lines: [
          validPosting.lines[0],
          { ...validPosting.lines[1], credit: 9000 },
        ],
      })
    ).toThrow();
  });

  it('normalizes the default currency and dates', () => {
    const result =
      FinanceOperationalPostingSchema.parse(validPosting);

    expect(result.currency).toBe('IDR');
    expect(result.transaction_date).toBeInstanceOf(Date);
  });

  it('rejects a line that has both debit and credit', () => {
    expect(() =>
      FinanceOperationalPostingSchema.parse({
        ...validPosting,
        lines: [
          { ...validPosting.lines[0], credit: 1 },
          validPosting.lines[1],
        ],
      })
    ).toThrow();
  });
});
