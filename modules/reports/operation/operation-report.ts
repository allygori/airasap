import { ORDER_PLATFORMS } from '@/constant/order-platform';
import { SHOPEE_ORDER_STATUS } from '@/constant/order/shopee/status';
import { type TimeZone } from '@/constant/timezone';
import { AggregateBuilder } from '@/modules/reports/@shared/aggregate/builder';
import {
  differenceInCalendarDays,
  endOfDay,
  parseISO,
  startOfDay,
} from 'date-fns';
import { Types, type PipelineStage } from 'mongoose';

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

const tzMap: Record<TimeZone, string> = {
  'Asia/Jakarta': '+07:00',
  'Asia/Makassar': '+08:00',
  'Asia/Jayapura': '+09:00',
};

export const aggregateOperationReport = ({
  filterBy = DEFAULT_DATE_FIELD,
  startDate,
  endDate,
  tenantContext,
  tz,
}: Args): PipelineStage[] => {
  const periodDays = Math.max(
    1,
    differenceInCalendarDays(
      endOfDay(parseISO(endDate)),
      startOfDay(parseISO(startDate))
    ) + 1
  );

  return new AggregateBuilder()
    .with({
      $match: {
        organization: new Types.ObjectId(
          tenantContext.organizationId
        ),
        store: new Types.ObjectId(tenantContext.storeId),
        platform: ORDER_PLATFORMS.shopee.value,
        deleted_at: null,
        [filterBy]: {
          $gte: startOfDay(parseISO(startDate)),
          $lte: endOfDay(parseISO(endDate)),
        },
      },
    })
    .with(normalizeOperationOrder(filterBy, tz))
    .with({
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              total_orders: { $sum: 1 },
              completed_orders: {
                $sum: {
                  $cond: ['$_operation.is_completed', 1, 0],
                },
              },
              cancelled_orders: {
                $sum: {
                  $cond: ['$_operation.is_cancelled', 1, 0],
                },
              },
              return_refund_orders: {
                $sum: {
                  $cond: [
                    '$_operation.is_return_refund',
                    1,
                    0,
                  ],
                },
              },
              in_progress_orders: {
                $sum: {
                  $cond: [
                    '$_operation.is_in_progress',
                    1,
                    0,
                  ],
                },
              },
              total_payment: {
                $sum: '$_operation.total_payment',
              },
              completed_payment: {
                $sum: {
                  $cond: [
                    '$_operation.is_completed',
                    '$_operation.total_payment',
                    0,
                  ],
                },
              },
              cancelled_payment: {
                $sum: {
                  $cond: [
                    '$_operation.is_cancelled',
                    '$_operation.total_payment',
                    0,
                  ],
                },
              },
              return_refund_payment: {
                $sum: {
                  $cond: [
                    '$_operation.is_return_refund',
                    '$_operation.total_payment',
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              total_orders: 1,
              completed_orders: 1,
              cancelled_orders: 1,
              return_refund_orders: 1,
              in_progress_orders: 1,
              total_payment: 1,
              completed_payment: 1,
              cancelled_payment: 1,
              return_refund_payment: 1,
              completion_rate: ratio(
                '$completed_orders',
                '$total_orders'
              ),
              cancellation_rate: ratio(
                '$cancelled_orders',
                '$total_orders'
              ),
              return_refund_rate: ratio(
                '$return_refund_orders',
                '$total_orders'
              ),
              problem_order_rate: ratio(
                {
                  $add: [
                    '$cancelled_orders',
                    '$return_refund_orders',
                  ],
                },
                '$total_orders'
              ),
            },
          },
        ],
        status_breakdown: [
          {
            $group: {
              _id: '$_operation.status',
              orders: { $sum: 1 },
              total_payment: {
                $sum: '$_operation.total_payment',
              },
            },
          },
          {
            $project: {
              _id: 0,
              status: { $ifNull: ['$_id', 'unknown'] },
              orders: 1,
              total_payment: 1,
            },
          },
          { $sort: { orders: -1 } },
        ],
        daily_reports: [
          {
            $group: {
              _id: '$_operation.order_date_local',
              total_orders: { $sum: 1 },
              completed_orders: {
                $sum: {
                  $cond: ['$_operation.is_completed', 1, 0],
                },
              },
              cancelled_orders: {
                $sum: {
                  $cond: ['$_operation.is_cancelled', 1, 0],
                },
              },
              return_refund_orders: {
                $sum: {
                  $cond: [
                    '$_operation.is_return_refund',
                    1,
                    0,
                  ],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              _id: 0,
              date: '$_id',
              total_orders: 1,
              completed_orders: 1,
              cancelled_orders: 1,
              return_refund_orders: 1,
              completion_rate: ratio(
                '$completed_orders',
                '$total_orders'
              ),
            },
          },
        ],
        cancellation_reasons: [
          {
            $match: {
              '_operation.is_cancelled': true,
            },
          },
          {
            $group: {
              _id: {
                by: '$_operation.cancelled_by',
                reason: '$_operation.cancellation_reason',
              },
              orders: { $sum: 1 },
              total_payment: {
                $sum: '$_operation.total_payment',
              },
            },
          },
          {
            $project: {
              _id: 0,
              cancelled_by: {
                $ifNull: ['$_id.by', 'unknown'],
              },
              reason: {
                $ifNull: ['$_id.reason', 'Unknown'],
              },
              orders: 1,
              total_payment: 1,
            },
          },
          { $sort: { orders: -1 } },
          { $limit: 20 },
        ],
      },
    })
    .with({
      $project: {
        _id: 0,
        summary: {
          $ifNull: [
            { $arrayElemAt: ['$summary', 0] },
            emptyOperationSummary(),
          ],
        },
        status_breakdown: 1,
        daily_reports: 1,
        cancellation_reasons: 1,
        meta: {
          start_date: startDate,
          end_date: endDate,
          period_days: periodDays,
        },
      },
    })
    .build();
};

const normalizeOperationOrder = <F extends string>(
  field: F,
  timezone: TimeZone
): PipelineStage.AddFields => ({
  $addFields: {
    _operation: {
      status: { $ifNull: ['$status', 'unknown'] },
      cancelled_by: {
        $ifNull: ['$cancelled_by', 'unknown'],
      },
      cancellation_reason: {
        $ifNull: ['$cancellation_reason', 'Unknown'],
      },
      total_payment: { $ifNull: ['$total_payment', 0] },
      order_date_local: {
        $dateToString: {
          format: '%Y-%m-%d',
          date: `$${field}`,
          timezone: tzMap[timezone],
        },
      },
      is_completed: {
        $eq: [
          '$status',
          SHOPEE_ORDER_STATUS.completed.value,
        ],
      },
      is_cancelled: {
        $eq: [
          '$status',
          SHOPEE_ORDER_STATUS.cancelled.value,
        ],
      },
      is_return_refund: {
        $in: [
          '$status',
          [
            SHOPEE_ORDER_STATUS.return.value,
            SHOPEE_ORDER_STATUS.refund.value,
          ],
        ],
      },
      is_in_progress: {
        $in: [
          '$status',
          [
            SHOPEE_ORDER_STATUS.needsToBeShipped.value,
            SHOPEE_ORDER_STATUS.toShip.value,
            SHOPEE_ORDER_STATUS.toReceive.value,
          ],
        ],
      },
    },
  },
});

const ratio = (value: unknown, total: unknown) => ({
  $cond: [
    { $gt: [total, 0] },
    { $divide: [value, total] },
    0,
  ],
});

const emptyOperationSummary = () => ({
  total_orders: 0,
  completed_orders: 0,
  cancelled_orders: 0,
  return_refund_orders: 0,
  in_progress_orders: 0,
  total_payment: 0,
  completed_payment: 0,
  cancelled_payment: 0,
  return_refund_payment: 0,
  completion_rate: 0,
  cancellation_rate: 0,
  return_refund_rate: 0,
  problem_order_rate: 0,
});
