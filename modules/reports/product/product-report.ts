import { ORDER_PLATFORMS } from '@/constant/order-platform';
import { SHOPEE_ORDER_STATUS } from '@/constant/order/shopee/status';
import { type TimeZone } from '@/constant/timezone';
import { AggregateBuilder } from '@/modules/reports/@shared/aggregate/builder';
import { filterProductAnalyticsOrders } from '@/modules/reports/pipelines/@shared/filter-orders';
import {
  allocateOrderLevelCosts,
  calculateNetProfitAfterAllocation,
  calculateProductItemMetrics,
} from '@/modules/reports/pipelines/@shared/calculate-item-metrics';
import { normalizeProductAnalyticsItem } from '@/modules/reports/pipelines/@shared/normalizer/normalize-item';
import { normalizeProductAnalyticsOrder } from '@/modules/reports/pipelines/@shared/normalizer/normalize-order';
import { unwindItems } from '@/modules/reports/pipelines/@shared/unwind-items';
import {
  finalizeProductAnalytics,
  projectProductAnalyticsResult,
} from '@/modules/reports/pipelines/product/finalize-product-analytics';
import { groupByProduct } from '@/modules/reports/pipelines/product/group-by-product';
import { type PipelineStage } from 'mongoose';

const DEFAULT_DATE_FIELD = 'placed_at';
const REPORTABLE_SHOPEE_ORDER_STATUSES = [
  SHOPEE_ORDER_STATUS.completed.value,
  // SHOPEE_ORDER_STATUS.needsToBeShipped.value,
  // SHOPEE_ORDER_STATUS.toShip.value,
  // SHOPEE_ORDER_STATUS.toReceive.value,
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
    Math.ceil(
      (new Date(endDate).getTime() -
        new Date(startDate).getTime()) /
        86_400_000
    )
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
    .with(allocateOrderLevelCosts())
    .with(calculateNetProfitAfterAllocation())
    .with(groupByProduct())
    .with(
      finalizeProductAnalytics({
        startDate,
        endDate,
        periodDays,
        reportableStatuses: [
          ...REPORTABLE_SHOPEE_ORDER_STATUSES,
        ],
      })
    )
    .with(projectProductAnalyticsResult());

  return pipelines.build();
};
