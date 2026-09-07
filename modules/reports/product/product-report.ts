import { ORDER_PLATFORMS } from '@/constant/order-platform';
import { SHOPEE_ORDER_STATUS } from '@/constant/order/shopee/status';
import { type TimeZone } from '@/constant/timezone';
import { AggregateBuilder } from '@/modules/reports/@shared/aggregate/builder';
import { calculateProductItemMetrics } from '@/modules/reports/pipelines/product/calculate-item-metrics';
import {
  finalizeProductAnalytics,
  projectProductAnalyticsResult,
} from '@/modules/reports/pipelines/product/finalize-product-analytics';
import { groupByProduct } from '@/modules/reports/pipelines/product/group-by-product';
import { normalizeProductAnalyticsItem } from '@/modules/reports/pipelines/product/normalizers/normalize-item';
import { normalizeProductAnalyticsOrder } from '@/modules/reports/pipelines/product/normalizers/normalize-order';
import { filterProductAnalyticsOrders } from '@/modules/reports/pipelines/shared/filter-orders';
import { unwindItems } from '@/modules/reports/pipelines/shared/unwind-items';
import {
  differenceInCalendarDays,
  endOfDay,
  parseISO,
  startOfDay,
} from 'date-fns';
import { type PipelineStage } from 'mongoose';

const DEFAULT_DATE_FIELD = 'placed_at';
const REPORTABLE_SHOPEE_ORDER_STATUSES = [
  SHOPEE_ORDER_STATUS.completed.value,
] as const;

export type ProductAnalyticsFilters = {
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
}: ProductAnalyticsFilters): PipelineStage[] => {
  const periodDays = Math.max(
    1,
    differenceInCalendarDays(
      endOfDay(parseISO(endDate)),
      startOfDay(parseISO(startDate))
    ) + 1
  );

  const pipelines = new AggregateBuilder()
    .with(
      filterProductAnalyticsOrders({
        ...tenantContext,
        platform: ORDER_PLATFORMS.shopee.value,
        dateFilterBy: filterBy,
        startDate,
        endDate,
        statuses: [...REPORTABLE_SHOPEE_ORDER_STATUSES],
      })
    )
    .with(normalizeProductAnalyticsOrder(filterBy, tz))
    .with(unwindItems())
    .with(normalizeProductAnalyticsItem())
    .with(calculateProductItemMetrics())
    .with(groupByProduct())
    .with(
      finalizeProductAnalytics({
        startDate,
        endDate,
        periodDays,
      })
    )
    .with(projectProductAnalyticsResult());

  return pipelines.build();
};
