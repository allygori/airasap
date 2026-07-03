export const baseMetrics = (
  dateField: string = 'order_created_at'
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
