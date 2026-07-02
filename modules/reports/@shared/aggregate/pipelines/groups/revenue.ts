export const groupRevenueByDay = () => {
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

      orders: {
        $sum: 1,
      },
    },
  };
};
