import type {
  FinanceSalesOrderSourceDTO,
  FinanceSalesProjectionDTO,
} from './finance-sales.dto';
import { FinanceSalesProjectionSchema } from './finance-sales.schema';

const toNullableNumber = (value: number | undefined) =>
  value ?? null;

const getFinalQuantity = (
  item: FinanceSalesOrderSourceDTO['items'][number]
) =>
  item.final_quantity ??
  Math.max(
    (item.quantity ?? 0) - (item.returned_quantity ?? 0),
    0
  );

const getSalesAmount = (
  source: FinanceSalesOrderSourceDTO
) =>
  source.total_gross_sales ??
  source.order_subtotal ??
  (source.items.length > 0
    ? source.items.reduce(
        (sum, item) => sum + (item.subtotal ?? 0),
        0
      )
    : undefined);

export const projectFinanceSalesOrder = (
  source: FinanceSalesOrderSourceDTO
): FinanceSalesProjectionDTO => {
  const salesAmount = getSalesAmount(source);
  const transactionDate =
    source.platform === 'shopee'
      ? source.completed_at
      : (source.completed_at ?? source.placed_at);
  const issues = [] as FinanceSalesProjectionDTO['issues'];

  if (!source.store_id) {
    issues.push({
      code: 'MISSING_STORE',
      message:
        'Order belum memiliki store_id untuk dimensi Finance.',
    });
  }

  if (source.items.length === 0) {
    issues.push({
      code: 'MISSING_ITEMS',
      message: 'Order belum memiliki line item.',
    });
  }

  if (salesAmount === undefined) {
    issues.push({
      code: 'MISSING_SALES_AMOUNT',
      message:
        'Order belum memiliki nilai sales yang dapat diproyeksikan.',
    });
  }

  if (!transactionDate) {
    issues.push({
      code: 'MISSING_TRANSACTION_DATE',
      message:
        source.platform === 'shopee'
          ? 'Order Shopee belum memiliki completed_at untuk tanggal jurnal penjualan.'
          : 'Order belum memiliki completed_at atau placed_at.',
    });
  }

  return FinanceSalesProjectionSchema.parse({
    source_order_id: source.source_order_id,
    source_order_number: source.source_order_number,
    organization_id: source.organization_id,
    store_id: source.store_id ?? null,
    platform: source.platform,
    source_status: source.status ?? null,
    currency: source.currency,
    transaction_date:
      transactionDate?.toISOString() ?? null,
    released_funds_at:
      source.released_funds_at?.toISOString() ?? null,
    total_payment: toNullableNumber(source.total_payment),
    sales_amount: toNullableNumber(salesAmount),
    released_amount: toNullableNumber(
      source.released_funds
    ),
    lines: source.items.map((item, index) => ({
      source_line_id: `${source.source_order_id}:${index}`,
      product_reference_id:
        item.product_reference_id ?? null,
      product_id: item.product_id ?? null,
      variation_id: item.variation_id ?? null,
      product_name: item.product_name ?? null,
      variation_name: item.variation_name ?? null,
      parent_sku: item.parent_sku ?? null,
      child_sku: item.child_sku ?? null,
      quantity: item.quantity ?? 0,
      returned_quantity: item.returned_quantity ?? 0,
      final_quantity: getFinalQuantity(item),
      subtotal: toNullableNumber(item.subtotal),
      gross_sales: toNullableNumber(item.gross_sales),
      net_sales: toNullableNumber(item.net_sales),
      product_cost: toNullableNumber(item.product_cost),
      total_product_cost: toNullableNumber(
        item.total_product_cost
      ),
    })),
    readiness: issues.length === 0 ? 'ready' : 'incomplete',
    issues,
  });
};
