import { Types, type PipelineStage } from 'mongoose';
import { getReportDateRange } from '@/lib/utils/date/report-range';
import type { TimeZone } from '@/constant/timezone';

type Args = {
  organizationId: string;
  storeId: string;
  platform: 'shopee' | 'tokopedia';
  dateFilterBy: string;
  startDate: string;
  endDate: string;
  timezone: TimeZone;
  statuses?: string[];
};

export const filterProductAnalyticsOrders = ({
  organizationId,
  storeId,
  platform,
  dateFilterBy,
  startDate,
  endDate,
  timezone,
  statuses,
}: Args): PipelineStage.Match => {
  const dateRange = getReportDateRange(
    startDate,
    endDate,
    timezone
  );

  return {
    $match: {
      organization: new Types.ObjectId(organizationId),
      store: new Types.ObjectId(storeId),
      platform,
      deleted_at: null,
      [dateFilterBy]: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate,
      },
      ...(statuses?.length
        ? { status: { $in: statuses } }
        : {}),
      items: { $type: 'array', $ne: [] },
    },
  };
};
