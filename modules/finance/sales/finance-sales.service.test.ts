import { FinanceDomainError } from '../finance.error';
import { FinanceSalesProjectionService } from './finance-sales.service';

const organizationId = '507f1f77bcf86cd799439010';
const otherOrganizationId = '507f1f77bcf86cd799439013';

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
      product_reference_id: '507f1f77bcf86cd799439012',
      product_id: 'SKU-001',
      variation_id: 'VAR-001',
      product_name: 'Produk satu',
      child_sku: 'SKU-001-RED',
      quantity: 2,
      returned_quantity: 1,
      subtotal: 125000,
      product_cost: 40000,
      total_product_cost: 40000,
    },
  ],
};

describe('FinanceSalesProjectionService', () => {
  it('projects the Finance-owned sales contract without posting a journal', () => {
    const service = new FinanceSalesProjectionService({
      organizationId,
    });

    const result = service.projectOrder(sourceOrder);

    expect(result).toMatchObject({
      source_order_id: sourceOrder.source_order_id,
      source_order_number: 'SP-1001',
      source_status: 'selesai',
      sales_amount: 125000,
      readiness: 'ready',
      issues: [],
    });
    expect(result.lines[0]).toMatchObject({
      source_line_id: `${sourceOrder.source_order_id}:0`,
      product_reference_id: '507f1f77bcf86cd799439012',
      final_quantity: 1,
      total_product_cost: 40000,
    });
  });

  it('keeps an incomplete source visible without choosing posting rules', () => {
    const service = new FinanceSalesProjectionService({
      organizationId,
    });

    const result = service.projectOrder({
      ...sourceOrder,
      store_id: undefined,
      completed_at: undefined,
      total_gross_sales: undefined,
      items: [],
    });

    expect(result.readiness).toBe('incomplete');
    expect(
      result.issues.map((issue) => issue.code)
    ).toEqual([
      'MISSING_STORE',
      'MISSING_ITEMS',
      'MISSING_SALES_AMOUNT',
      'MISSING_TRANSACTION_DATE',
    ]);
  });

  it('rejects a source order from another organization', () => {
    const service = new FinanceSalesProjectionService({
      organizationId,
    });

    expect(() =>
      service.projectOrder({
        ...sourceOrder,
        organization_id: otherOrganizationId,
      })
    ).toThrow(
      expect.objectContaining({
        code: 'FINANCE_SALES_SOURCE_TENANT_CONFLICT',
      }) satisfies Partial<FinanceDomainError>
    );
  });
});
