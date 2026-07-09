import type { TimeZone } from '@/constant/timezone';

export const addNormalizeData = <F extends string>(
  field: F,
  timezone: TimeZone = 'Asia/Jakarta'
) => {
  const fieldMap: Record<string, string> = {
    placed_at: 'order_created_normalized',
    completed_at: 'order_completed_normalized',
    paid_at: 'order_paid_normalized',
  };
  const tzMap = {
    'Asia/Jakarta': '+07:00',
    'Asia/Makassar': '+08:00',
    'Asia/Jayapura': '+09:00',
  };

  return {
    $addFields: {
      [fieldMap[field]]: {
        $dateToString: {
          format: '%Y-%m-%d',
          date: '$placed_at',
          timezone: tzMap[timezone],
        },
      },
      year: {
        $year: {
          date: '$placed_at',
          timezone: tzMap[timezone],
        },
      },
      month: {
        $month: {
          date: '$placed_at',
          timezone: tzMap[timezone],
        },
      },
      day: {
        $dayOfMonth: {
          date: '$placed_at',
          timezone: tzMap[timezone],
        },
      },
      revenue: '$order_subtotal',
      total_payment: '$total_payment',
      total_cost: '$total_product_cost',
      total_payout: '$released_amount',
      order_id: '$order_id',
      username: '$username',
      status: '$status',
      voucher_borne_by_seller: '$voucher_borne_by_seller',
      bundle_deal_discount_from_seller:
        '$bundle_deal_discount_from_seller',
      shipping_cost_paid_by_buyer:
        '$shipping_cost_paid_by_buyer',
      admin_fee: '$fee.admin_fee',
      processing_fee: '$fee.processing_fee',
      total_profit: '$total_profit',

      // total_profit: {
      //   $subtract: [
      //     '$released_amount',
      //     {
      //       $ifNull: ['$total_product_cost', 0],
      //     },
      //   ],
      // },
    },
  };
};
