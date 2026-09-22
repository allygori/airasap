import { FinanceOpeningBalanceDraftInputSchema } from './finance-opening-balance.schema';

const accountId = '507f1f77bcf86cd799439011';

describe('FinanceOpeningBalanceDraftInputSchema', () => {
  it('requires owner capital details when balances are entered', () => {
    const result =
      FinanceOpeningBalanceDraftInputSchema.safeParse({
        cut_off_date: '2026-09-20',
        mode: 'entered',
        cash_bank_lines: [],
        inventory_lines: [],
        payable_lines: [],
        receivable_lines: [],
      });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) =>
            issue.path.join('.') ===
            'owner_capital_account_id'
        )
      ).toBe(true);
    }
  });

  it('rejects a zero-mode draft that contains a balance', () => {
    const result =
      FinanceOpeningBalanceDraftInputSchema.safeParse({
        cut_off_date: '2026-09-20',
        mode: 'zero',
        cash_bank_lines: [
          { account_id: accountId, amount: 100_000 },
        ],
        owner_capital_amount: 0,
      });

    expect(result.success).toBe(false);
  });

  it('requires unit cost for positive quantity inventory', () => {
    const result =
      FinanceOpeningBalanceDraftInputSchema.safeParse({
        cut_off_date: '2026-09-20',
        mode: 'entered',
        inventory_lines: [
          {
            inventory_item_id: accountId,
            location_id: accountId,
            quantity: 2,
          },
        ],
        owner_capital_account_id: accountId,
        owner_capital_amount: 0,
      });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.path.join('.').includes('unit_cost')
        )
      ).toBe(true);
    }
  });
});
