import { mergeObject } from '@/lib/utils/object/merge';
import { tenantFilter } from './filter/tenant-filter';
import { platformFilter } from './filter/platform-filter';
import { dateFilter } from './filter/date-filter';
import { Types, type PipelineStage } from 'mongoose';
import { endOfDay, parseISO, startOfDay } from 'date-fns';

type Args = {
  organizationId: string;
  storeId: string;
  platform: 'shopee' | 'tokopedia';
  dateFilterBy: string;
  startDate: string;
  endDate: string;
  statuses?: string[];
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

export const filterProductAnalyticsOrders = ({
  organizationId,
  storeId,
  platform,
  dateFilterBy,
  startDate,
  endDate,
  statuses,
}: Args): PipelineStage.Match => {
  return {
    $match: {
      organization: new Types.ObjectId(organizationId),
      store: new Types.ObjectId(storeId),
      platform,
      deleted_at: null,
      [dateFilterBy]: {
        $gte: startOfDay(parseISO(startDate)),
        $lte: endOfDay(parseISO(endDate)),
      },
      ...(statuses?.length
        ? { status: { $in: statuses } }
        : {}),
      items: { $type: 'array', $ne: [] },
    },
  };
};
