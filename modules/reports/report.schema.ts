import z from 'zod';

export const ReportPeriodModeSchema = z.enum([
  'today',
  'yesterday',
  '7-days',
  '30-days',
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'semiannually',
  'annually',
  'range',
]);

export const CreateReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  mode: ReportPeriodModeSchema.optional(),
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

export const OrderReportDailyReportSchema = z.object({
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
  discount_from_shopee: z.number(),
  voucher_borne_by_shopee: z.number(),
  bundle_deal_discount_from_shopee: z.number(),
  shipping_forwarded_by_shopee: z.number(),
  shopee_fee: z.number(),
  units: z.number(),
  orders: z.number(),
  net_margin: z.number(),
});

export const OrderReportSummarySchema = z.object({
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
  discount_from_shopee: z.number(),
  voucher_borne_by_shopee: z.number(),
  bundle_deal_discount_from_shopee: z.number(),
  shipping_forwarded_by_shopee: z.number(),
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

export const OrderReportFeeBreakdownSchema = z.object({
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

export const OrderReportDataQualitySchema = z.object({
  total_orders: z.number(),
  gross_sales_coverage: z.number(),
  net_sales_coverage: z.number(),
  net_profit_coverage: z.number(),
  released_funds_coverage: z.number(),
});

export const OrderReportGrowthSchema = z.object({
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

export const OrderReportHealthSummarySchema = z.object({
  headline: z.string(),
  tone: z.enum(['good', 'warning', 'bad', 'neutral']),
  notes: z.array(z.string()),
});

export const OrderReportProfitLeakageSchema = z.object({
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

export const OrderReportDayHighlightSchema = z.object({
  label: z.string(),
  date: z.string().nullable(),
  value: z.number(),
  metric: z.string(),
});

export const OrderReportMetricsSchema = z.object({
  average_profit_per_unit: z.number(),
  average_cogs_per_order: z.number(),
  average_fee_per_order: z.number(),
  average_seller_discount_per_order: z.number(),
  payment_to_net_sales_ratio: z.number(),
});

export const OrderReportAlertSchema = z.object({
  key: z.string(),
  severity: z.enum(['info', 'warning', 'danger']),
  title: z.string(),
  message: z.string(),
});

export const OrderReportVoucherSummarySchema = z.object({
  voucher_codes_count: z.number(),
  seller_discount: z.number(),
  shopee_discount: z.number(),
  total_discount: z.number(),
  seller_share: z.number(),
  discount_ratio: z.number(),
  top_codes: z.array(z.string()),
});

export const OrderReportShopeeEconomicsSchema = z.object({
  shipping_forwarded_by_shopee: z.number(),
  discount_from_shopee: z.number(),
  voucher_borne_by_shopee: z.number(),
  bundle_deal_discount_from_shopee: z.number(),
  admin_fee: z.number(),
  processing_fee: z.number(),
  gox_fee: z.number(),
  other_fee: z.number(),
  total_shopee_fee: z.number(),
  total_shopee_subsidy: z.number(),
  estimated_shopee_net_revenue: z.number(),
  estimated_shopee_take_rate: z.number(),
});

export const OrderReportResponseSchema = z.object({
  summary: OrderReportSummarySchema,
  daily_reports: z.array(OrderReportDailyReportSchema),
  fee_breakdown: OrderReportFeeBreakdownSchema,
  status_breakdown: z.array(
    z.object({
      status: z.string(),
      orders: z.number(),
      total_payment: z.number(),
    })
  ),
  data_quality: OrderReportDataQualitySchema,
  health_summary: OrderReportHealthSummarySchema,
  profit_leakage: OrderReportProfitLeakageSchema,
  best_days: z.array(OrderReportDayHighlightSchema),
  worst_days: z.array(OrderReportDayHighlightSchema),
  order_metrics: OrderReportMetricsSchema,
  alerts: z.array(OrderReportAlertSchema),
  voucher_summary: OrderReportVoucherSummarySchema,
  shopee_economics: OrderReportShopeeEconomicsSchema,
  comparison: OrderReportGrowthSchema.optional(),
  meta: z.object({
    start_date: z.string(),
    end_date: z.string(),
    period_days: z.number(),
  }),
});

export const OverviewReportResponseSchema = z.object({
  summary: z.object({
    potential_gross_sales: z.number(),
    realized_gross_sales: z.number(),
    cancelled_gross_sales: z.number(),
    in_progress_gross_sales: z.number(),
    return_refund_gross_sales: z.number(),
    net_sales: z.number(),
    total_payment: z.number(),
    released_funds: z.number(),
    cogs: z.number(),
    gross_profit: z.number(),
    net_profit: z.number(),
    seller_voucher: z.number(),
    seller_bundle_discount: z.number(),
    seller_discount: z.number(),
    shopee_voucher: z.number(),
    shopee_bundle_discount: z.number(),
    shopee_discount: z.number(),
    shopee_fee: z.number(),
    marketplace_deduction: z.number(),
    total_discount: z.number(),
    total_orders: z.number(),
    completed_orders: z.number(),
    cancelled_orders: z.number(),
    in_progress_orders: z.number(),
    return_refund_orders: z.number(),
    total_buyers: z.number(),
    completed_buyers: z.number(),
    total_units: z.number(),
    completed_units: z.number(),
    total_items: z.number(),
    completed_items: z.number(),
    average_order_value: z.number(),
    profit_per_order: z.number(),
    gross_margin: z.number(),
    net_margin: z.number(),
    fee_ratio: z.number(),
    seller_discount_ratio: z.number(),
    shopee_discount_ratio: z.number(),
    cancellation_rate_by_orders: z.number(),
    cancellation_rate_by_value: z.number(),
    sales_realization_rate: z.number(),
    net_sales_coverage: z.number(),
    net_profit_coverage: z.number(),
    released_funds_coverage: z.number(),
    voucher_codes: z.array(z.string()),
  }),
  funnel: z.array(
    z.object({
      bucket: z.string(),
      orders: z.number(),
      gross_sales: z.number(),
      total_payment: z.number(),
      units: z.number(),
    })
  ),
  status_breakdown: z.array(
    z.object({
      status: z.string(),
      orders: z.number(),
      gross_sales: z.number(),
      total_payment: z.number(),
    })
  ),
  daily_reports: z.array(
    z.object({
      date: z.string(),
      orders: z.number(),
      potential_gross_sales: z.number(),
      cancelled_orders: z.number(),
      cancelled_gross_sales: z.number(),
      completed_orders: z.number(),
      realized_gross_sales: z.number(),
      net_sales: z.number(),
      net_profit: z.number(),
      shopee_fee: z.number(),
      seller_discount: z.number(),
      cancellation_rate: z.number(),
      sales_realization_rate: z.number(),
      net_margin: z.number(),
    })
  ),
  cancellation_by_actor: z.array(
    z.object({
      cancelled_by: z.string(),
      orders: z.number(),
      cancelled_gross_sales: z.number(),
    })
  ),
  cancellation_by_reason: z.array(
    z.object({
      reason: z.string(),
      orders: z.number(),
      cancelled_gross_sales: z.number(),
    })
  ),
  meta: z.object({
    start_date: z.string(),
    end_date: z.string(),
    period_days: z.number(),
  }),
});

export const CustomerReportSummarySchema = z.object({
  total_customers: z.number(),
  new_customers: z.number(),
  repeat_customers: z.number(),
  returning_customers: z.number(),
  total_orders: z.number(),
  total_net_sales: z.number(),
  total_net_profit: z.number(),
  total_payment: z.number(),
  total_units: z.number(),
  repeat_customer_rate: z.number(),
  returning_customer_rate: z.number(),
  average_orders_per_customer: z.number(),
  average_net_sales_per_customer: z.number(),
  average_net_profit_per_customer: z.number(),
  average_days_to_second_order: z.number(),
});

export const CustomerReportRowSchema = z.object({
  customer_key: z.string(),
  username: z.string(),
  first_order_at: z.string().or(z.date()),
  last_order_at: z.string().or(z.date()),
  period_orders: z.number(),
  period_net_sales: z.number(),
  period_net_profit: z.number(),
  period_total_payment: z.number(),
  period_units: z.number(),
  lifetime_orders: z.number(),
  lifetime_net_sales: z.number(),
  lifetime_net_profit: z.number(),
  lifetime_total_payment: z.number(),
  lifetime_units: z.number(),
  is_new_customer: z.boolean(),
  is_repeat_customer: z.boolean(),
  is_returning_customer: z.boolean(),
  days_between_first_second_order: z.number().nullable(),
  average_order_value: z.number(),
  net_margin: z.number(),
});

export const CustomerReportResponseSchema = z.object({
  summary: CustomerReportSummarySchema,
  customers: z.array(CustomerReportRowSchema),
  repeat_interval_buckets: z.array(
    z.object({
      bucket: z.string(),
      customers: z.number(),
    })
  ),
  meta: z.object({
    start_date: z.string(),
    end_date: z.string(),
    period_days: z.number(),
  }),
});

export const VoucherReportSummarySchema = z.object({
  total_orders: z.number(),
  voucher_orders: z.number(),
  non_voucher_orders: z.number(),
  voucher_order_rate: z.number(),
  total_gross_sales: z.number(),
  total_net_sales: z.number(),
  total_net_profit: z.number(),
  total_payment: z.number(),
  seller_discount: z.number(),
  shopee_discount: z.number(),
  total_discount: z.number(),
  seller_discount_share: z.number(),
  discount_ratio: z.number(),
  net_margin: z.number(),
  campaign_fee: z.number(),
  affiliate_fee: z.number(),
  voucher_codes_count: z.number(),
});

export const VoucherReportRowSchema = z.object({
  voucher_code: z.string(),
  orders: z.number(),
  buyers: z.number(),
  gross_sales: z.number(),
  net_sales: z.number(),
  total_payment: z.number(),
  net_profit: z.number(),
  seller_discount: z.number(),
  shopee_discount: z.number(),
  bundle_seller_discount: z.number(),
  bundle_shopee_discount: z.number(),
  campaign_fee: z.number(),
  affiliate_fee: z.number(),
  total_discount: z.number(),
  average_order_value: z.number(),
  net_margin: z.number(),
  discount_ratio: z.number(),
  seller_discount_share: z.number(),
  classification: z.enum([
    'Profitable',
    'Growth Driver',
    'Margin Risk',
    'Monitor',
  ]),
});

export const VoucherReportResponseSchema = z.object({
  summary: VoucherReportSummarySchema,
  vouchers: z.array(VoucherReportRowSchema),
  meta: z.object({
    start_date: z.string(),
    end_date: z.string(),
    period_days: z.number(),
  }),
});

export const OperationReportSummarySchema = z.object({
  total_orders: z.number(),
  completed_orders: z.number(),
  cancelled_orders: z.number(),
  return_refund_orders: z.number(),
  in_progress_orders: z.number(),
  total_payment: z.number(),
  completed_payment: z.number(),
  cancelled_payment: z.number(),
  return_refund_payment: z.number(),
  completion_rate: z.number(),
  cancellation_rate: z.number(),
  return_refund_rate: z.number(),
  problem_order_rate: z.number(),
});

export const OperationStatusBreakdownSchema = z.object({
  status: z.string(),
  orders: z.number(),
  total_payment: z.number(),
});

export const OperationDailyReportSchema = z.object({
  date: z.string(),
  total_orders: z.number(),
  completed_orders: z.number(),
  cancelled_orders: z.number(),
  return_refund_orders: z.number(),
  completion_rate: z.number(),
});

export const OperationCancellationReasonSchema = z.object({
  cancelled_by: z.string(),
  reason: z.string(),
  orders: z.number(),
  total_payment: z.number(),
});

export const OperationReportResponseSchema = z.object({
  summary: OperationReportSummarySchema,
  status_breakdown: z.array(OperationStatusBreakdownSchema),
  daily_reports: z.array(OperationDailyReportSchema),
  cancellation_reasons: z.array(
    OperationCancellationReasonSchema
  ),
  meta: z.object({
    start_date: z.string(),
    end_date: z.string(),
    period_days: z.number(),
  }),
});
