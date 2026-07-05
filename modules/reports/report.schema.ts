import z from 'zod';

export const CreateReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

export const SalesReportResponseSchema = z.object({
  total_revenue: z.number(),
  total_payout: z.number(),
  total_profit: z.number(),
  total_payment: z.number(),
  total_cost: z.number(),
  total_voucher_borne_by_seller: z.number(),
  total_orders: z.number(),
  total_buyers: z.number(),
  daily_reports: z.array(
    z.object({
      day: z.number(),
      month: z.number(),
      year: z.number(),
      daily_revenue: z.number(),
      daily_payout: z.number(),
      daily_profit: z.number(),
      daily_payment: z.number(),
      daily_cost: z.number(),
      number_of_orders: z.number(),
      orders: z.array(
        z.object({
          order_id: z.string(),
          total_profit: z.number(),
          total_payment: z.number(),
          subtotal: z.number(),
          status: z.string(),
        })
      ),
    })
  ),
});
