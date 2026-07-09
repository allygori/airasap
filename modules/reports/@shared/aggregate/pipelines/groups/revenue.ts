export const groupByDateForDailyRevenue = () => {
  return {
    $group: {
      _id: {
        year: '$year',
        month: '$month',
        day: '$day',
      },
      daily_revenue: {
        $sum: '$revenue',
      },
      daily_payout: {
        $sum: '$total_payout',
      },
      daily_profit: {
        $sum: '$total_profit',
      },
      daily_payment: {
        $sum: '$total_payment',
      },
      daily_cost: {
        $sum: '$total_cost',
      },
      daily_voucher_borne_by_seller: {
        $sum: '$voucher_borne_by_seller',
      },
      daily_bundle_deal_discount_from_seller: {
        $sum: '$bundle_deal_discount_from_seller',
      },
      daily_shipping_cost_paid_by_buyer: {
        $sum: '$shipping_cost_paid_by_buyer',
      },
      daily_admin_fee: {
        $sum: '$admin_fee',
      },
      daily_processing_fee: {
        $sum: '$processing_fee',
      },
      daily_orders_confirmed: {
        $sum: {
          $cond: {
            if: {
              $in: [
                '$status',
                [
                  'selesai',
                  'sedang-dikirim',
                  'telah-dikirim',
                ],
              ],
            },
            then: 1,
            else: 0,
          },
        },
      },
      daily_orders_cancelled: {
        $sum: {
          $cond: {
            if: { $eq: ['$status', 'batal'] },
            then: 1,
            else: 0,
          },
        },
      },
      daily_order_ids: { $addToSet: '$order_id' },
      unique_buyers: { $addToSet: '$username' },
      daily_orders: {
        $push: {
          order_id: '$order_id',
          username: '$username',
          status: '$status',
          placed_at: '$placed_at',
          total_profit: '$total_profit',
          total_payment: '$total_payment',
          subtotal: '$revenue',
        },
      },
      daily_orders_count: {
        $sum: 1,
      },
    },
  };
};

export const sumDailyDataFromPreviousGrouping = () => {
  return {
    $group: {
      _id: null,
      total_revenue: {
        $sum: '$daily_revenue',
      },
      total_payout: {
        $sum: '$daily_payout',
      },
      total_profit: {
        $sum: '$daily_profit',
      },
      total_payment: {
        $sum: '$daily_payment',
      },
      total_cost: {
        $sum: '$daily_cost',
      },
      total_orders: {
        $sum: '$daily_orders_count',
      },
      total_voucher_borne_by_seller: {
        $sum: '$daily_voucher_borne_by_seller',
      },
      total_bundle_deal_discount_from_seller: {
        $sum: '$daily_bundle_deal_discount_from_seller',
      },
      total_shipping_cost_paid_by_buyer: {
        $sum: '$daily_shipping_cost_paid_by_buyer',
      },
      total_admin_fee: {
        $sum: '$daily_admin_fee',
      },
      total_processing_fee: {
        $sum: '$daily_processing_fee',
      },
      total_orders_confirmed: {
        $sum: '$daily_orders_confirmed',
      },
      total_orders_cancelled: {
        $sum: '$daily_orders_cancelled',
      },
      // unique_buyers: { $first: '$unique_buyers' },
      daily_buyers: { $push: '$unique_buyers' },
      daily_reports: {
        $push: {
          day: '$_id.day',
          month: '$_id.month',
          year: '$_id.year',
          daily_revenue: '$daily_revenue',
          daily_payout: '$daily_payout',
          daily_profit: '$daily_profit',
          daily_payment: '$daily_payment',
          daily_cost: '$daily_cost',
          number_of_orders: '$daily_orders_count',
          total_orders_confirmed: {
            $sum: '$daily_orders_confirmed',
          },
          total_orders_cancelled: {
            $sum: '$daily_orders_cancelled',
          },
          // daily_order_ids: '$daily_order_ids',
          // daily_buyers: '$unique_buyers',
          // username: '$username',
          orders: '$daily_orders',
          // place_at: '$place_at',
        },
      },
    },
  };
};

/**
 * Ampas
 * @returns
 */
export const groupRevenueByDay1 = () => {
  return {
    $group: {
      _id: {
        year: '$year',
        month: '$month',
        day: '$day',
      },

      revenue: {
        $sum: '$revenue',
      },

      income: {
        $sum: '$total_income',
      },

      profit: {
        $sum: '$total_profit',
      },

      total_payment: {
        $sum: '$total_payment',
      },

      total_cost: {
        $sum: '$total_cost',
      },

      number_of_orders: {
        $sum: 1,
      },

      orders: {
        $push: {
          order_id: '$order_id',
          total_profit: '$total_profit',
          total_payment: '$total_payment',
          subtotal: '$order_subtotal',
          status: '$status',
        },
      },
    },
  };
};

/**
 * Ampas
 * @returns
 */
export const groupRevenueByDay2 = () => {
  return {
    $group: {
      _id: {
        year: '$year',
        month: '$month',
        day: '$day',
      },

      daily_revenue: {
        $sum: '$revenue',
      },

      daily_payout: {
        $sum: '$total_payout',
      },

      daily_profit: {
        $sum: '$total_profit',
      },

      daily_payment: {
        $sum: '$total_payment',
      },

      daily_cost: {
        $sum: '$total_cost',
      },

      daily_orders_count: {
        $sum: 1,
      },

      daily_orders: {
        $push: {
          order_id: '$order_id',
          total_profit: '$total_profit',
          total_payment: '$total_payment',
          subtotal: '$order_subtotal',
          status: '$status',
        },
      },
    },
  };
};

export const groupRevenueByDay = () => {
  return {
    $group: {
      _id: {
        year: '$year',
        month: '$month',
        day: '$day',
      },

      daily_revenue: {
        $sum: '$revenue',
      },

      daily_payout: {
        $sum: '$total_payout',
      },

      daily_profit: {
        $sum: '$total_profit',
      },

      daily_payment: {
        $sum: '$total_payment',
      },

      daily_cost: {
        $sum: '$total_cost',
      },

      daily_orders_count: {
        $sum: 1,
      },

      daily_orders: {
        $push: {
          order_id: '$order_id',
          total_profit: '$total_profit',
          total_payment: '$total_payment',
          subtotal: '$order_subtotal',
          status: '$status',
        },
      },
    },
  };
};
