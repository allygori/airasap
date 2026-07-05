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
