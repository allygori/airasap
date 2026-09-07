import z from 'zod';

export const CreateReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

export const SalesReportResponseSchema = z.object({
  // total_profit: z.number(),
  total_gross_profit: z.number(),
  total_net_profit: z.number(),
  total_revenue: z.number(),
  ratio_profit_to_revenue: z.number(),
  total_payout: z.number(),
  // total_gross_profit: z.number(),
  total_payment: z.number(),
  total_cost: z.number(),
  total_voucher_borne_by_seller: z.number(),
  total_bundle_deal_discount_from_seller: z.number(),
  total_shipping_cost_paid_by_buyer: z.number(),
  total_admin_fee: z.number(),
  total_processing_fee: z.number(),
  total_orders: z.number(),
  total_buyers: z.number(),
  total_orders_confirmed: z.number(),
  total_orders_cancelled: z.number(),
  daily_reports: z.array(
    z.object({
      day: z.number(),
      month: z.number(),
      year: z.number(),
      daily_revenue: z.number(),
      daily_payout: z.number(),
      // daily_profit: z.number(),
      daily_gross_profit: z.number(),
      daily_net_profit: z.number(),
      daily_payment: z.number(),
      daily_cost: z.number(),
      number_of_orders: z.number(),
      total_orders_confirmed: z.number(),
      total_orders_cancelled: z.number(),
      orders: z.array(
        z.object({
          order_id: z.string(),
          username: z.string(),
          status: z.string(),
          placed_at: z.string(),
          // total_profit: z.number(),
          total_gross_profit: z.number(),
          total_net_profit: z.number(),
          total_payment: z.number(),
          subtotal: z.number(),
        })
      ),
    })
  ),
});

export const ProductAnalyticsRowSchema = z.object({
  product_id: z.string().nullable().optional(),
  product_name: z.string(),
  variation_id: z.string().nullable().optional(),
  variation_name: z.string().nullable().optional(),
  parent_sku: z.string().nullable().optional(),
  child_sku: z.string().nullable().optional(),
  orders: z.number(),
  units: z.number(),
  returned_units: z.number(),
  gross_sales: z.number(),
  discount: z.number(),
  net_sales: z.number(),
  cogs: z.number(),
  gross_profit: z.number(),
  platform_fee: z.number(),
  shipping_cost: z.number(),
  other_variable_cost: z.number(),
  marketplace_deduction: z.number(),
  net_profit: z.number(),
  gross_margin: z.number(),
  net_margin: z.number(),
  profit_per_unit: z.number(),
  sales_contribution: z.number(),
  profit_contribution: z.number(),
  unit_contribution: z.number(),
  order_contribution: z.number(),
  sales_rank: z.number(),
  profit_rank: z.number(),
  units_rank: z.number(),
  sales_per_day: z.number(),
  units_per_day: z.number(),
  orders_per_day: z.number(),
  profit_per_day: z.number(),
  items_count: z.number(),
  items_with_stored_net_sales: z.number(),
  items_with_stored_net_profit: z.number(),
  canonical_net_sales_rate: z.number(),
  canonical_net_profit_rate: z.number(),
  data_quality_score: z.number(),
  opportunity_score: z.number(),
  opportunity_label: z.enum([
    'Scale',
    'Optimize',
    'Fix Margin',
    'Monitor',
  ]),
  top_orders: z.array(
    z.object({
      order_id: z.string(),
      units: z.number(),
      net_sales: z.number(),
      net_profit: z.number(),
      net_margin: z.number(),
    })
  ),
  classification: z.enum([
    'Star',
    'Revenue Driver',
    'Profit Driver',
    'Weak',
  ]),
});

export const ProductAnalyticsSummarySchema = z.object({
  total_products: z.number(),
  total_orders: z.number(),
  product_order_count: z.number(),
  distinct_completed_orders: z.number(),
  total_units: z.number(),
  returned_units: z.number(),
  gross_sales: z.number(),
  total_gross_sales: z.number(),
  total_payment: z.number(),
  total_shopee_fee: z.number(),
  seller_discount: z.number(),
  shopee_discount: z.number(),
  voucher_codes: z.array(z.string()),
  discount: z.number(),
  net_sales: z.number(),
  cogs: z.number(),
  gross_profit: z.number(),
  platform_fee: z.number(),
  shipping_cost: z.number(),
  other_variable_cost: z.number(),
  marketplace_deduction: z.number(),
  net_profit: z.number(),
  gross_margin: z.number(),
  net_margin: z.number(),
  total_items: z.number(),
  items_with_stored_net_sales: z.number(),
  items_with_stored_net_profit: z.number(),
  canonical_net_sales_rate: z.number(),
  canonical_net_profit_rate: z.number(),
  data_quality_score: z.number(),
});

export const ProductAnalyticsGrowthSchema = z.object({
  previous_period: z.object({
    start_date: z.string(),
    end_date: z.string(),
  }),
  summary: z.object({
    net_sales: z.number(),
    net_profit: z.number(),
    units: z.number(),
    orders: z.number(),
    net_margin: z.number(),
  }),
  changes: z.object({
    net_sales: z.number(),
    net_profit: z.number(),
    units: z.number(),
    orders: z.number(),
    net_margin: z.number(),
  }),
});

export const ProductAnalyticsResponseSchema = z.object({
  summary: ProductAnalyticsSummarySchema,
  products: z.array(ProductAnalyticsRowSchema),
  comparison: ProductAnalyticsGrowthSchema.optional(),
  meta: z.object({
    total_products: z.number(),
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
    period_days: z.number(),
  }),
});

export const SalesV2DailyReportSchema = z.object({
  date: z.string(),
  gross_sales: z.number(),
  net_sales: z.number(),
  total_payment: z.number(),
  released_funds: z.number(),
  cogs: z.number(),
  gross_profit: z.number(),
  net_profit: z.number(),
  seller_discount: z.number(),
  shopee_discount: z.number(),
  shopee_fee: z.number(),
  units: z.number(),
  orders: z.number(),
  net_margin: z.number(),
});

export const SalesV2SummarySchema = z.object({
  total_orders: z.number(),
  total_buyers: z.number(),
  total_units: z.number(),
  total_items: z.number(),
  gross_sales: z.number(),
  net_sales: z.number(),
  total_payment: z.number(),
  released_funds: z.number(),
  cogs: z.number(),
  gross_profit: z.number(),
  net_profit: z.number(),
  seller_discount: z.number(),
  shopee_discount: z.number(),
  shopee_fee: z.number(),
  marketplace_deduction: z.number(),
  average_order_value: z.number(),
  profit_per_order: z.number(),
  gross_margin: z.number(),
  net_margin: z.number(),
  fee_ratio: z.number(),
  seller_discount_ratio: z.number(),
  shopee_discount_ratio: z.number(),
  voucher_codes: z.array(z.string()),
});

export const SalesV2FeeBreakdownSchema = z.object({
  admin_fee: z.number().optional(),
  processing_fee: z.number().optional(),
  affiliate_fee: z.number().optional(),
  gox_fee: z.number().optional(),
  service_fee: z.number().optional(),
  transaction_fee: z.number().optional(),
  campaign_fee: z.number().optional(),
  shipping_saver_program_fee: z.number().optional(),
  other_fee: z.number().optional(),
  premium_fee: z.number().optional(),
  fbs_fee: z.number().optional(),
  tax_pph22: z.number().optional(),
  import_duty_vat_income_tax: z.number().optional(),
  auto_top_up_fee_from_income: z.number().optional(),
  return_shipping_fee: z.number().optional(),
  return_to_sender_shipping_fee: z.number().optional(),
  shipping_fee_refund: z.number().optional(),
});

export const SalesV2DataQualitySchema = z.object({
  total_orders: z.number(),
  gross_sales_coverage: z.number(),
  net_sales_coverage: z.number(),
  net_profit_coverage: z.number(),
  released_funds_coverage: z.number(),
});

export const SalesV2GrowthSchema = z.object({
  previous_period: z.object({
    start_date: z.string(),
    end_date: z.string(),
  }),
  summary: z.object({
    net_sales: z.number(),
    net_profit: z.number(),
    total_payment: z.number(),
    orders: z.number(),
    average_order_value: z.number(),
    net_margin: z.number(),
  }),
  changes: z.object({
    net_sales: z.number(),
    net_profit: z.number(),
    total_payment: z.number(),
    orders: z.number(),
    average_order_value: z.number(),
    net_margin: z.number(),
  }),
});

export const SalesV2HealthSummarySchema = z.object({
  headline: z.string(),
  tone: z.enum(['good', 'warning', 'bad', 'neutral']),
  notes: z.array(z.string()),
});

export const SalesV2ProfitLeakageSchema = z.object({
  total_leakage: z.number(),
  leakage_ratio: z.number(),
  items: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      value: z.number(),
      ratio: z.number(),
    })
  ),
});

export const SalesV2DayHighlightSchema = z.object({
  label: z.string(),
  date: z.string().nullable(),
  value: z.number(),
  metric: z.string(),
});

export const SalesV2OrderEconomicsSchema = z.object({
  average_profit_per_unit: z.number(),
  average_cogs_per_order: z.number(),
  average_fee_per_order: z.number(),
  average_seller_discount_per_order: z.number(),
  payment_to_net_sales_ratio: z.number(),
});

export const SalesV2AlertSchema = z.object({
  key: z.string(),
  severity: z.enum(['info', 'warning', 'danger']),
  title: z.string(),
  message: z.string(),
});

export const SalesV2VoucherSummarySchema = z.object({
  voucher_codes_count: z.number(),
  seller_discount: z.number(),
  shopee_discount: z.number(),
  total_discount: z.number(),
  seller_share: z.number(),
  discount_ratio: z.number(),
  top_codes: z.array(z.string()),
});

export const SalesV2ResponseSchema = z.object({
  summary: SalesV2SummarySchema,
  daily_reports: z.array(SalesV2DailyReportSchema),
  fee_breakdown: SalesV2FeeBreakdownSchema,
  status_breakdown: z.array(
    z.object({
      status: z.string(),
      orders: z.number(),
      total_payment: z.number(),
    })
  ),
  data_quality: SalesV2DataQualitySchema,
  health_summary: SalesV2HealthSummarySchema,
  profit_leakage: SalesV2ProfitLeakageSchema,
  best_days: z.array(SalesV2DayHighlightSchema),
  worst_days: z.array(SalesV2DayHighlightSchema),
  order_economics: SalesV2OrderEconomicsSchema,
  alerts: z.array(SalesV2AlertSchema),
  voucher_summary: SalesV2VoucherSummarySchema,
  comparison: SalesV2GrowthSchema.optional(),
  meta: z.object({
    start_date: z.string(),
    end_date: z.string(),
    period_days: z.number(),
  }),
});
