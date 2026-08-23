import { mergeObject } from '@/lib/utils/object/merge';
import { tenantFilter } from './filter/tenant-filter';
import { platformFilter } from './filter/platform-filter';
import { dateFilter } from './filter/date-filter';

type Args = {
  organizationId: string;
  storeId: string;
  platform: 'shopee' | 'tokopedia';
  dateFilterBy: string;
  startDate: string;
  endDate: string;
};

export const filterOrders = ({
  organizationId,
  storeId,
  platform,
  dateFilterBy,
  startDate,
  endDate,
}: Args) => {
  return mergeObject(
    [tenantFilter, organizationId, storeId],
    // [orderStatusFilter, 'Selesai'],
    [platformFilter, platform],
    [dateFilter, startDate, endDate, dateFilterBy]
  );
};
