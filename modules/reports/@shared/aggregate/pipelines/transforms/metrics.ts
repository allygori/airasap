export const baseMetrics = (
  dateField: string = 'order_created_at'
) => {
  return {
    $addFields: {
      revenue: '$total_payment',

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
