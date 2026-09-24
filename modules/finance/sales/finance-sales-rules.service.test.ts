import { FinanceSalesProjectionService } from './finance-sales.service';
import { FinanceSalesPostingRulesService } from './finance-sales-rules.service';

const organizationId = '507f1f77bcf86cd799439010';

const sourceOrder = {
  source_order_id: '507f1f77bcf86cd799439099',
  source_order_number: 'SP-1001',
  organization_id: organizationId,
  store_id: '507f1f77bcf86cd799439011',
  platform: 'shopee' as const,
  status: 'selesai',
  completed_at: '2026-09-22T00:00:00.000Z',
  total_gross_sales: 125000,
  items: [
    {
      product_id: 'SKU-001',
      quantity: 1,
      subtotal: 125000,
    },
  ],
};

const getProjection = (overrides = {}) =>
  new FinanceSalesProjectionService({
    organizationId,
  }).projectOrder({
    ...sourceOrder,
    ...overrides,
  });

describe('FinanceSalesPostingRulesService', () => {
  it('creates a balanced sales intent for a completed order', () => {
    const result =
      new FinanceSalesPostingRulesService().evaluate(
        getProjection()
      );

    expect(result).toMatchObject({
      decision: 'eligible',
      event: 'completed_order',
      reason_code: null,
    });
    expect(result.intent).toMatchObject({
      source_event: 'completed_order',
      idempotency_key:
        'finance-sales:completed:shopee:507f1f77bcf86cd799439011:507f1f77bcf86cd799439099',
      inventory_cogs: { status: 'deferred' },
    });
    expect(result.intent?.lines).toEqual([
      {
        account_role: 'marketplace_receivable',
        debit: 125000,
        credit: 0,
      },
      {
        account_role: 'sales_revenue',
        debit: 0,
        credit: 125000,
      },
    ]);
  });

  it('does not treat an in-progress order as a sales posting event', () => {
    const result =
      new FinanceSalesPostingRulesService().evaluate(
        getProjection({ status: 'sedang-dikirim' })
      );

    expect(result).toMatchObject({
      decision: 'not_eligible',
      event: null,
      reason_code: 'ORDER_STATUS_NOT_ELIGIBLE',
      intent: null,
    });
  });

  it('blocks a completed order when its Finance projection is incomplete', () => {
    const result =
      new FinanceSalesPostingRulesService().evaluate(
        getProjection({ store_id: undefined })
      );

    expect(result).toMatchObject({
      decision: 'blocked',
      event: 'completed_order',
      reason_code: 'PROJECTION_INCOMPLETE',
      intent: null,
    });
  });

  it('blocks a completed order with returned quantity until refund rules exist', () => {
    const result =
      new FinanceSalesPostingRulesService().evaluate(
        getProjection({
          items: [
            {
              product_id: 'SKU-001',
              quantity: 1,
              returned_quantity: 1,
              subtotal: 125000,
            },
          ],
        })
      );

    expect(result).toMatchObject({
      decision: 'blocked',
      event: 'completed_order',
      reason_code: 'RETURN_REFUND_UNSUPPORTED',
      intent: null,
    });
  });
});
