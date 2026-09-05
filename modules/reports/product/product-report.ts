import { AggregateBuilder } from '../@shared/aggregate/builder';
import {
  // mergeFilters,
  tenantFilter,
  dateFilter,
  orderStatusFilter,
  platformFilter,
} from '../@shared/aggregate/pipelines/filters';
// import { mergeFilters } from './pipelines/filters/_merge';
import { mergeObject } from '@/lib/utils/object/merge';
import { ORDER_PLATFORMS } from '@/constant/order-platform';
import {
  baseMetrics,
  baseMetrics1,
  metricsForRevenue,
} from '../@shared/aggregate/pipelines/transforms/metrics';
import {
  groupByDateForDailyRevenue,
  sumDailyDataFromPreviousGrouping,
} from '../@shared/aggregate/pipelines/groups/revenue';
import { endOfDay, parse, startOfDay } from 'date-fns';
import { PipelineStage } from 'mongoose';
// import { dateParser } from '@/lib/utils/parser';
import { fnsFormatDate } from '@/lib/formatter/date';
import { type TimeZone } from '@/constant/timezone';
import { addNormalizeData } from '../@shared/aggregate/pipelines/transforms/normalize';
import { sortRevenue } from '../@shared/aggregate/pipelines/transforms/sort';

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
  const filters = mergeObject(
    [
      tenantFilter,
      tenantContext.organizationId,
      tenantContext.storeId,
    ],
    // [orderStatusFilter, 'Selesai'],
    [platformFilter, ORDER_PLATFORMS.shopee.value],
    [dateFilter, startDate, endDate, filterBy]
  );

  const pipelines = new AggregateBuilder()
    .with(addNormalizeData(filterBy, tz))
    .with(filters)
    .with(groupByDateForDailyRevenue())
    .with(sumDailyDataFromPreviousGrouping())
    .with(metricsForRevenue())
    .with(sortRevenue());

  pipelines.log();

  return pipelines.build();
};
