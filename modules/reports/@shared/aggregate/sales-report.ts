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

const DEFAULT_DATE_FIELD = 'order_created_at';

type Args = {
  filterBy?:
    | 'order_created_at'
    | 'order_completed_at'
    | 'paid_at';
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
  //           date: '$order_created_at',
  //           timezone: '+07:00',
  //         },
  //       },
  //       // Ekstrak komponen untuk laporan harian (tetap gunakan timezone +07:00)
  //       year: {
  //         $year: {
  //           date: '$order_created_at',
  //           timezone: '+07:00',
  //         },
  //       },
  //       month: {
  //         $month: {
  //           date: '$order_created_at',
  //           timezone: '+07:00',
  //         },
  //       },
  //       day: {
  //         $dayOfMonth: {
  //           date: '$order_created_at',
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

  return [
    {
      $addFields: {
        order_created_wib: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$order_created_at',
            timezone: '+07:00',
          },
        },
        year: {
          $year: {
            date: '$order_created_at',
            timezone: '+07:00',
          },
        },
        month: {
          $month: {
            date: '$order_created_at',
            timezone: '+07:00',
          },
        },
        day: {
          $dayOfMonth: {
            date: '$order_created_at',
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
        cancelled_by: { $ne: 'buyer' },
        platform: 'shopee',
        order_created_wib: {
          $gte: '2026-06-01',
          $lte: '2026-06-30',
        },
      },
    },
    {
      $addFields: {
        revenue: '$order_subtotal',
        total_payment: '$total_payment',
        total_cost: '$total_product_cost',
        total_payout: '$released_amount',
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
        daily_orders_count: {
          $sum: 1,
        },
      },
    },
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
    },
    {
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
    },
  ] as PipelineStage[];
}
