import { AggregateBuilder } from './builder';
import {
  // mergeFilters,
  tenantFilter,
  dateFilter,
  orderStatusFilter,
  platformFilter,
} from './pipelines/filters';
// import { mergeFilters } from './pipelines/filters/_merge';
import { mergeObject } from '@/lib/utils/object/merge';
import { PLATFORMS_KV_WITH_LABEL } from '@/modules/constant';
import {
  baseMetrics,
  baseMetrics1,
} from './pipelines/transforms/metrics';
import { groupRevenueByDay } from './pipelines/groups/revenue';
import { endOfDay, parse, startOfDay } from 'date-fns';
import { PipelineStage } from 'mongoose';
// import { dateParser } from '@/lib/utils/parser';
import { fnsFormatDate } from '@/lib/formatter/date';

const DEFAULT_DATE_FIELD = 'placed_at';

type Args = {
  filterBy?: 'placed_at' | 'completed_at' | 'paid_at';
  startDate: string;
  endDate: string;
  tenantContext: {
    organizationId: string;
    storeId: string;
  };
};

export default function aggregateSalesReport({
  filterBy = DEFAULT_DATE_FIELD,
  startDate,
  endDate,
  tenantContext,
}: Args) {
  const filters = mergeObject(
    [
      tenantFilter,
      tenantContext.organizationId,
      tenantContext.storeId,
    ],
    [dateFilter, startDate, endDate, filterBy],
    [orderStatusFilter, 'Selesai'],
    [platformFilter, PLATFORMS_KV_WITH_LABEL.shopee.value]
  );

  // console.log(
  //   'salesReport filters',
  //   JSON.stringify(filters, null, 2)
  // );

  const pipelines = new AggregateBuilder()
    .with(filters)
    // .with(baseMetrics(filterBy))
    .with(baseMetrics1(filterBy))
    .with(groupRevenueByDay())
    .with({
      $group: {
        _id: null, // null berarti menggabungkan seluruh dokumen yang lolos dari stage sebelumnya
        total_revenue: { $sum: '$daily_revenue' },
        total_payout: { $sum: '$daily_payout' },
        total_profit: { $sum: '$daily_profit' },
        total_payment: { $sum: '$daily_payment' },
        total_cost: { $sum: '$daily_cost' },
        total_orders: { $sum: '$daily_orders_count' },
        // Kumpulkan semua data harian ke dalam satu array agar struktur lama tidak hilang
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
            orders: '$daily_orders',
          },
        },
      },
    })
    .with({
      $project: {
        _id: 0,
        total_revenue: 1,
        total_payout: 1,
        total_profit: 1,
        total_payment: 1,
        total_cost: 1,
        total_orders: 1,
        daily_reports: 1,
      },
    });
  // .with({
  //   $project: {
  //     _id: 0,
  //     day: '$_id.day',
  //     month: '$_id.month',
  //     year: '$_id.year',
  //     revenue: '$revenue',
  //     total_profit: '$profit',
  //     total_payment: '$total_payment',
  //     total_cost: '$total_cost',
  //     number_of_orders: '$number_of_orders',
  //     orders: '$orders',
  //   },
  // });

  // pipelines.debug();

  // return pipelines.build();

  // return [
  //   {
  //     $addFields: {
  //       // 1. Konversi tanggal UTC di DB ke String tanggal lokal Indonesia (WIB)
  //       order_created_wib: {
  //         $dateToString: {
  //           format: '%Y-%m-%d',
  //           date: '$placed_at',
  //           timezone: '+07:00',
  //         },
  //       },
  //       // Ekstrak komponen untuk laporan harian (tetap gunakan timezone +07:00)
  //       year: {
  //         $year: {
  //           date: '$placed_at',
  //           timezone: '+07:00',
  //         },
  //       },
  //       month: {
  //         $month: {
  //           date: '$placed_at',
  //           timezone: '+07:00',
  //         },
  //       },
  //       day: {
  //         $dayOfMonth: {
  //           date: '$placed_at',
  //           timezone: '+07:00',
  //         },
  //       },
  //     },
  //   },
  //   {
  //     $match: {
  //       organization: tenantContext.organizationId,
  //       store: tenantContext.storeId,
  //       platform: 'shopee',
  //       // 2. Filter murni menggunakan tanggal lokal string (Sangat mudah dicocokkan dengan Excel Shopee)
  //       order_created_wib: {
  //         // $gte: '2026-06-01',
  //         // $lte: '2026-06-30',
  //         $gte: startOfDay(
  //           parse('2026-06-01', 'yyyy-MM-dd', new Date())
  //         ).toISOString(),
  //         $lte: endOfDay(
  //           parse('2026-06-30', 'yyyy-MM-dd', new Date())
  //         ).toISOString(),
  //       },
  //     },
  //   },
  //   {
  //     $addFields: {
  //       revenue: '$order_subtotal',
  //       total_payment: '$total_payment',
  //       total_cost: '$total_product_cost',
  //       total_payout: '$released_amount',
  //       total_profit: {
  //         $subtract: [
  //           '$released_amount',
  //           { $ifNull: ['$total_product_cost', 0] },
  //         ],
  //       },
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: {
  //         year: '$year',
  //         month: '$month',
  //         day: '$day',
  //       },
  //       daily_revenue: { $sum: '$revenue' },
  //       daily_payout: { $sum: '$total_payout' },
  //       daily_profit: { $sum: '$total_profit' },
  //       daily_payment: { $sum: '$total_payment' },
  //       daily_cost: { $sum: '$total_cost' },
  //       daily_orders_count: { $sum: 1 },
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: null,
  //       total_revenue: {
  //         $sum: '$daily_revenue',
  //       },
  //       total_payout: {
  //         $sum: '$daily_payout',
  //       },
  //       total_profit: {
  //         $sum: '$daily_profit',
  //       },
  //       total_payment: {
  //         $sum: '$daily_payment',
  //       },
  //       total_cost: {
  //         $sum: '$daily_cost',
  //       },
  //       total_orders: {
  //         $sum: '$daily_orders_count',
  //       },
  //       daily_reports: {
  //         $push: {
  //           day: '$_id.day',
  //           month: '$_id.month',
  //           year: '$_id.year',
  //           daily_revenue: '$daily_revenue',
  //           daily_payout: '$daily_payout',
  //           daily_profit: '$daily_profit',
  //           daily_payment: '$daily_payment',
  //           daily_cost: '$daily_cost',
  //           number_of_orders: '$daily_orders_count',
  //           orders: '$daily_orders',
  //         },
  //       },
  //     },
  //   },
  //   {
  //     $project: {
  //       _id: 0,
  //       total_revenue: 1,
  //       total_payout: 1,
  //       total_profit: 1,
  //       total_payment: 1,
  //       total_cost: 1,
  //       total_orders: 1,
  //       daily_reports: 1,
  //     },
  //   },
  // ];

  console.log({
    $gte: fnsFormatDate(startDate, 'yyyy-MM-dd'),
    $lte: fnsFormatDate(endDate, 'yyyy-MM-dd'),
  });

  return [
    {
      $addFields: {
        order_created_wib: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$placed_at',
            timezone: '+07:00',
          },
        },
        year: {
          $year: {
            date: '$placed_at',
            timezone: '+07:00',
          },
        },
        month: {
          $month: {
            date: '$placed_at',
            timezone: '+07:00',
          },
        },
        day: {
          $dayOfMonth: {
            date: '$placed_at',
            timezone: '+07:00',
          },
        },
      },
    },
    {
      $match: {
        // organization: tenantContext.organizationId,
        // store: tenantContext.storeId,
        ...(tenantFilter(
          tenantContext.organizationId,
          tenantContext.storeId
        ).$match || {}),
        // cancelled_by: { $ne: 'buyer' },
        platform: 'shopee',
        order_created_wib: {
          // $gte: '2026-06-01',
          // $lte: '2026-06-30',
          $gte: fnsFormatDate(startDate, 'yyyy-MM-dd'),
          $lte: fnsFormatDate(endDate, 'yyyy-MM-dd'),
        },
      },
    },
    {
      $addFields: {
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
        total_profit: {
          $subtract: [
            '$released_amount',
            {
              $ifNull: ['$total_product_cost', 0],
            },
          ],
        },
      },
    },
    {
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
        // daily_orders_confirmed: {
        //   $addToSet: {
        //     $cond: {
        //       if: {
        //         $in: [
        //           '$status',
        //           [
        //             'selesai',
        //             'sedang-dikirim',
        //             'telah-dikirim',
        //           ],
        //         ],
        //       },
        //       then: '$order_id',
        //       else: '$$REMOVE',
        //     },
        //   },
        // },
        // daily_orders_cancelled: {
        //   $addToSet: {
        //     $cond: {
        //       if: { $eq: ['$status', 'batal'] },
        //       then: '$order_id',
        //       else: '$$REMOVE',
        //     },
        //   },
        // },
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
    },
    // {
    //   $addFields: {
    //     dateObj: {
    //       $dateFromParts: {
    //         year: '$_id.year',
    //         month: '$_id.month',
    //         day: '$_id.day',
    //       },
    //     },
    //   },
    // },

    // // Step 3: Create documents for the missing days
    // {
    //   $densify: {
    //     field: 'dateObj',
    //     range: {
    //       step: 1,
    //       unit: 'day',
    //       bounds: 'full',
    //     },
    //   },
    // },
    // {
    //   $fill: {
    //     sortBy: { dateObj: 1 },
    //     output: {
    //       daily_revenue: { value: 0 },
    //     },
    //   },
    // },
    // {
    //   $densify: {
    //     field: 'daily_reports.day',
    //     range: {
    //       step: 1,
    //       unit: 'day',
    //       bounds: 'full',
    //     },
    //   },
    // },
    // {
    //   $fill: {
    //     sortBy: { 'daily_reports.day': 1 },
    //     output: {
    //       daily_revenue: { value: 0 },
    //     },
    //   },
    // },
    {
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
    },
    {
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
    },
    {
      $sort: {
        'daily_reports.day': 1,
        'daily_reports.month': 1,
        'daily_reports.year': 1,
      },
    },
  ] as PipelineStage[];
}
