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
