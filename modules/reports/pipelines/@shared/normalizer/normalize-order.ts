import type { TimeZone } from '@/constant/timezone';
import type { PipelineStage } from 'mongoose';

export const normalizeOrder = <F extends string>(
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
      total_payout: '$released_funds',
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
      estimated_total_profit: '$estimated_total_profit',

      // total_profit: {
      //   $subtract: [
      //     '$released_funds',
      //     {
      //       $ifNull: ['$total_product_cost', 0],
      //     },
      //   ],
      // },
    },
  };
};

export const normalizeProductAnalyticsOrder = <
  F extends string,
>(
  field: F,
  timezone: TimeZone = 'Asia/Jakarta'
): PipelineStage.AddFields => {
  const tzMap = {
    'Asia/Jakarta': '+07:00',
    'Asia/Makassar': '+08:00',
    'Asia/Jayapura': '+09:00',
  };

  return {
    $addFields: {
      _analytics: {
        order_id: '$order_id',
        order_date: `$${field}`,
        order_date_local: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: `$${field}`,
            timezone: tzMap[timezone],
          },
        },
        organization: '$organization',
        store: '$store',
        status: '$status',
        order_gross_sales: {
          $ifNull: [
            '$total_gross_sales',
            '$order_subtotal',
            0,
          ],
        },
        order_net_sales: {
          $ifNull: [
            '$total_net_sales',
            '$order_subtotal',
            0,
          ],
        },
        order_discount: { $ifNull: ['$total_discount', 0] },
        order_cogs: { $ifNull: ['$total_product_cost', 0] },
        order_gross_profit: {
          $ifNull: [
            '$total_gross_profit',
            {
              $subtract: [
                { $ifNull: ['$order_subtotal', 0] },
                { $ifNull: ['$total_product_cost', 0] },
              ],
            },
          ],
        },
        order_net_profit: {
          $ifNull: [
            '$total_net_profit',
            {
              $subtract: [
                { $ifNull: ['$released_funds', 0] },
                { $ifNull: ['$total_product_cost', 0] },
              ],
            },
          ],
        },
        order_released_funds: {
          $ifNull: ['$released_funds', 0],
        },
        order_platform_fee: {
          $add: [
            { $ifNull: ['$fee.admin_fee', 0] },
            { $ifNull: ['$fee.processing_fee', 0] },
            { $ifNull: ['$fee.affiliate_fee', 0] },
            { $ifNull: ['$fee.service_fee', 0] },
            { $ifNull: ['$fee.transaction_fee', 0] },
            { $ifNull: ['$fee.campaign_fee', 0] },
            {
              $ifNull: [
                '$fee.shipping_saver_program_fee',
                0,
              ],
            },
            { $ifNull: ['$fee.other_fee', 0] },
            { $ifNull: ['$fee.premium_fee', 0] },
            { $ifNull: ['$fee.fbs_fee', 0] },
          ],
        },
        order_shipping_cost: {
          $add: [
            {
              $ifNull: [
                '$free_shipping_promo_from_seller',
                0,
              ],
            },
            { $ifNull: ['$fee.return_shipping_fee', 0] },
            {
              $ifNull: [
                '$fee.return_to_sender_shipping_fee',
                0,
              ],
            },
          ],
        },
        order_other_variable_cost: {
          $sum: {
            $map: {
              input: {
                $ifNull: ['$other_variable_cost', []],
              },
              as: 'cost',
              in: { $ifNull: ['$$cost.cost', 0] },
            },
          },
        },
      },
    },
  };
};
