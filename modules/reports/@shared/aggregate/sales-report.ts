import { AggregateBuilder } from './builder';
import {
  // mergeFilters,
  tenantFilter,
  dateFilter,
  orderStatusFilter,
  platformFilter,
} from './pipelines/filters';
import { mergeFilters } from './pipelines/filters/_merge';
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

export default function salesReport({
  filterBy = DEFAULT_DATE_FIELD,
  startDate,
  endDate,
  tenantContext,
}: Args) {
  const filters = mergeFilters(
    [
      tenantFilter,
      tenantContext.organizationId,
      tenantContext.storeId,
    ],
    [dateFilter, startDate, endDate, filterBy],
    [orderStatusFilter, 'Selesai'],
    [platformFilter, PLATFORMS_KV_WITH_LABEL.shopee.value]
  );

  console.log(
    'salesReport filters',
    JSON.stringify(filters, null, 2)
  );

  const pipelines = new AggregateBuilder()
    .with(filters)
    .with(baseMetrics(DEFAULT_DATE_FIELD))
    .with(groupRevenueByDay());

  pipelines.debug();

  return pipelines.build();
}
