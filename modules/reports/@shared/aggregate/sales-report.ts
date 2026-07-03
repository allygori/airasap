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
import { baseMetrics } from './pipelines/transforms/metrics';
import { groupRevenueByDay } from './pipelines/groups/revenue';

const DEFAULT_DATE_FIELD = 'order_created_at';

type Args = {
  filterBy?: 'order_created_at' | 'order_completed_at';
  startDate: string | Date;
  endDate: string | Date;
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
    .with(baseMetrics(DEFAULT_DATE_FIELD))
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

  pipelines.debug();

  return pipelines.build();
}
