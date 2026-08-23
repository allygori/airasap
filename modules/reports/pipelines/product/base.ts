import { AggregateBuilder } from '@/modules/reports/@shared/aggregate/builder';
import { filterOrders } from '@/modules/reports/pipelines/@shared/filter-orders';
import { type PipelineStage } from 'mongoose';
import { ORDER_PLATFORMS } from '@/constant/order-platform';
import { normalizeOrder } from '@/modules/reports/pipelines/@shared/normalizer/normalize-order';
import { TimeZone } from '@/constant/timezone';
import { unwindItems } from '@/modules/reports/pipelines/@shared/unwind-items';
import { normalizeItem } from '../@shared/normalizer/normalize-item';

const DEFAULT_DATE_FIELD = 'placed_at';

type Args = {
  filterBy?: 'placed_at' | 'completed_at' | 'paid_at';
  startDate: string;
  endDate: string;
  tenantContext: {
    organizationId: string;
    storeId: string;
  };
  tz: TimeZone;
};

export const aggregateProductSalesReport = ({
  filterBy = DEFAULT_DATE_FIELD,
  startDate,
  endDate,
  tenantContext,
  tz,
}: Args): PipelineStage[] => {
  // const filters = mergeObject(
  //   [
  //     tenantFilter,
  //     tenantContext.organizationId,
  //     tenantContext.storeId,
  //   ],
  //   // [orderStatusFilter, 'Selesai'],
  //   [platformFilter, ORDER_PLATFORMS.shopee.value],
  //   [dateFilter, startDate, endDate, filterBy]
  // );

  const pipelines = new AggregateBuilder()
    .with(
      filterOrders({
        ...tenantContext,
        platform: ORDER_PLATFORMS.shopee.value,
        dateFilterBy: filterBy,
        startDate,
        endDate,
      })
    )
    .with(normalizeOrder(filterBy, tz))
    .with(unwindItems())
    .with(normalizeItem());
  // .with(groupByDateForDailyRevenue())
  // .with(sumDailyDataFromPreviousGrouping())
  // .with(metricsForRevenue())
  // .with(sortRevenue());

  pipelines.log();

  return pipelines.build();
};
