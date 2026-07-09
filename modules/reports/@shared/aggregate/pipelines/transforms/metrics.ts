export const metricsForRevenue = () => {
  return {
    $project: {
      _id: 0,
      // total_revenue: 1,
      total_revenue: {
        $subtract: [
          '$total_revenue',
          '$total_voucher_borne_by_seller',
        ],
      },
      total_payout: 1,
      total_profit: 1,
      total_payment: 1,
      // total_payment: {
      //   $subtract: [
      //     '$total_payment',
      //     '$total_voucher_borne_by_seller',
      //   ],
      // },
      total_cost: 1,
      total_orders: 1,
      total_voucher_borne_by_seller: 1,
      total_bundle_deal_discount_from_seller: 1,
      total_shipping_cost_paid_by_buyer: 1,
      total_admin_fee: 1,
      total_processing_fee: 1,
      // total_buyers: 1,
      // total_buyers: {
      //   $size: '$unique_buyers',
      // },
      total_orders_confirmed: 1,
      total_orders_cancelled: 1,
      total_buyers: {
        $size: {
          $reduce: {
            input: '$daily_buyers',
            initialValue: [],
            in: { $setUnion: ['$$value', '$$this'] },
          },
        },
      },
      daily_reports: 1,
    },
  };
};

/**
 * Enrich and format data
 * @param dateField
 * @returns
 */
export const baseMetrics = (
  dateField: string = 'placed_at'
) => {
  return {
    $addFields: {
      revenue: '$order_subtotal',
      // revenue: '$total_payment',

      total_payment: '$total_payment',

      total_cost: '$total_product_cost',

      total_payout: '$released_amount',

      order_count: 1,

      item_count: '$number_of_products_ordered',

      // WAJIB menggunakan timezone +07:00 dan field yang konsisten dengan $match
      year: {
        $year: {
          date: '$completed_at',
          timezone: '+07:00',
        },
      },

      month: {
        $month: {
          date: '$completed_at',
          timezone: '+07:00',
        },
      },

      day: {
        $dayOfMonth: {
          date: '$completed_at',
          timezone: '+07:00',
        },
      },

      hour: {
        $hour: {
          date: '$completed_at',
          timezone: '+07:00',
        },
      },
    },
  };
};

/**
 * Enrich and format data
 * @param dateField
 * @returns
 */
export const baseMetrics1 = (
  dateField: string = 'placed_at'
) => {
  return {
    $addFields: {
      revenue: '$order_subtotal',
      // revenue: '$total_payment',

      total_payment: '$total_payment',

      total_cost: '$total_product_cost',

      total_payout: '$released_amount',

      order_count: 1,

      item_count: '$number_of_products_ordered',

      year: {
        $year: `$${dateField}`,
      },

      month: {
        $month: `$${dateField}`,
      },

      day: {
        $dayOfMonth: `$${dateField}`,
      },

      hour: {
        $hour: `$${dateField}`,
      },
    },
  };
};
