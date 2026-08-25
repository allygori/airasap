export const normalizeItem = () => {
  return {
    $addFields: {
      gross_sales: '$order_subtotal',
      discount: '$total_discount',
      net_sales: '',
      platform_fee: '',
      seller_income: '$released_funds',
    },
  };
};
