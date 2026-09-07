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
const REPORTABLE_SHOPEE_ORDER_STATUSES = [
  SHOPEE_ORDER_STATUS.completed.value,
] as const;

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

export const aggregateCustomerReport = ({
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
        status: {
          $in: [...REPORTABLE_SHOPEE_ORDER_STATUSES],
        },
        [filterBy]: {
          $lte: endOfDay(parseISO(endDate)),
        },
        username: { $type: 'string', $ne: '' },
      },
    })
    .with(normalizeCustomerOrder(filterBy, tz))
    .with(groupByCustomer(startDate, endDate))
    .with(addCustomerDerivedMetrics(startDate))
    .with({
      $facet: {
        summary:
          summarizeCustomers() as PipelineStage.FacetPipelineStage[],
        customers: [
          {
            $match: {
              period_orders: { $gt: 0 },
            },
          },
          {
            $sort: {
              period_net_profit: -1,
              period_net_sales: -1,
            },
          },
          { $limit: 50 },
          ...(projectCustomerRow() as PipelineStage.FacetPipelineStage[]),
        ],
        repeat_interval_buckets: [
          addSecondOrderMetric(),
          {
            $match: {
              period_orders: { $gt: 0 },
              days_between_first_second_order: {
                $ne: null,
              },
            },
          },
          {
            $bucket: {
              groupBy: '$days_between_first_second_order',
              boundaries: [0, 8, 15, 31, 61, 91, 181, 3660],
              default: 3660,
              output: {
                customers: { $sum: 1 },
              },
            },
          },
          {
            $project: {
              _id: 0,
              bucket: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ['$_id', 0] },
                      then: '0-7 days',
                    },
                    {
                      case: { $eq: ['$_id', 8] },
                      then: '8-14 days',
                    },
                    {
                      case: { $eq: ['$_id', 15] },
                      then: '15-30 days',
                    },
                    {
                      case: { $eq: ['$_id', 31] },
                      then: '31-60 days',
                    },
                    {
                      case: { $eq: ['$_id', 61] },
                      then: '61-90 days',
                    },
                    {
                      case: { $eq: ['$_id', 91] },
                      then: '91-180 days',
                    },
                    {
                      case: { $eq: ['$_id', 181] },
                      then: '181+ days',
                    },
                  ],
                  default: 'Unknown',
                },
              },
              customers: 1,
            },
          },
        ],
      },
    })
    .with({
      $project: {
        _id: 0,
        summary: {
          $ifNull: [
            { $arrayElemAt: ['$summary', 0] },
            emptyCustomerSummary(),
          ],
        },
        customers: 1,
        repeat_interval_buckets: 1,
        meta: {
          start_date: startDate,
          end_date: endDate,
          period_days: periodDays,
        },
      },
    })
    .build();
};

const normalizeCustomerOrder = <F extends string>(
  field: F,
  timezone: TimeZone
): PipelineStage.AddFields => ({
  $addFields: {
    _customer_report: {
      customer_key: { $toLower: '$username' },
      username: '$username',
      order_id: '$order_id',
      order_date: `$${field}`,
      order_date_local: {
        $dateToString: {
          format: '%Y-%m-%d',
          date: `$${field}`,
          timezone: tzMap[timezone],
        },
      },
      gross_sales: {
        $ifNull: [
          '$total_gross_sales',
          '$order_subtotal',
          0,
        ],
      },
      net_sales: {
        $ifNull: ['$total_net_sales', '$order_subtotal', 0],
      },
      total_payment: { $ifNull: ['$total_payment', 0] },
      cogs: { $ifNull: ['$total_product_cost', 0] },
      net_profit: {
        $ifNull: [
          '$total_net_profit',
          {
            $subtract: [
              { $ifNull: ['$released_funds', 0] },
              { $ifNull: ['$total_product_cost', 0] },
            ],
          },
        ],
      },
      units: {
        $sum: {
          $map: {
            input: { $ifNull: ['$items', []] },
            as: 'item',
            in: {
              $ifNull: [
                '$$item.final_quantity',
                '$$item.quantity',
                0,
              ],
            },
          },
        },
      },
    },
  },
});

const groupByCustomer = (
  startDate: string,
  endDate: string
): PipelineStage.Group => ({
  $group: {
    _id: '$_customer_report.customer_key',
    username: { $first: '$_customer_report.username' },
    first_order_at: {
      $min: '$_customer_report.order_date',
    },
    last_order_at: { $max: '$_customer_report.order_date' },
    lifetime_orders: { $sum: 1 },
    lifetime_net_sales: {
      $sum: '$_customer_report.net_sales',
    },
    lifetime_net_profit: {
      $sum: '$_customer_report.net_profit',
    },
    lifetime_total_payment: {
      $sum: '$_customer_report.total_payment',
    },
    lifetime_units: { $sum: '$_customer_report.units' },
    period_orders: {
      $sum: {
        $cond: [isOrderInPeriod(startDate, endDate), 1, 0],
      },
    },
    period_net_sales: {
      $sum: {
        $cond: [
          isOrderInPeriod(startDate, endDate),
          '$_customer_report.net_sales',
          0,
        ],
      },
    },
    period_net_profit: {
      $sum: {
        $cond: [
          isOrderInPeriod(startDate, endDate),
          '$_customer_report.net_profit',
          0,
        ],
      },
    },
    period_total_payment: {
      $sum: {
        $cond: [
          isOrderInPeriod(startDate, endDate),
          '$_customer_report.total_payment',
          0,
        ],
      },
    },
    period_units: {
      $sum: {
        $cond: [
          isOrderInPeriod(startDate, endDate),
          '$_customer_report.units',
          0,
        ],
      },
    },
    period_order_dates: {
      $push: {
        $cond: [
          isOrderInPeriod(startDate, endDate),
          '$_customer_report.order_date',
          '$$REMOVE',
        ],
      },
    },
    order_dates: { $push: '$_customer_report.order_date' },
  },
});

const isOrderInPeriod = (
  startDate: string,
  endDate: string
) => ({
  $and: [
    {
      $gte: [
        '$_customer_report.order_date',
        startOfDay(parseISO(startDate)),
      ],
    },
    {
      $lte: [
        '$_customer_report.order_date',
        endOfDay(parseISO(endDate)),
      ],
    },
  ],
});

const summarizeCustomers = (): PipelineStage[] => [
  addSecondOrderMetric(),
  {
    $match: {
      period_orders: { $gt: 0 },
    },
  },
  {
    $group: {
      _id: null,
      total_customers: { $sum: 1 },
      new_customers: {
        $sum: {
          $cond: ['$is_new_customer', 1, 0],
        },
      },
      repeat_customers: {
        $sum: {
          $cond: ['$is_repeat_customer', 1, 0],
        },
      },
      returning_customers: {
        $sum: {
          $cond: ['$is_returning_customer', 1, 0],
        },
      },
      total_orders: { $sum: '$period_orders' },
      total_net_sales: { $sum: '$period_net_sales' },
      total_net_profit: { $sum: '$period_net_profit' },
      total_payment: { $sum: '$period_total_payment' },
      total_units: { $sum: '$period_units' },
      total_lifetime_orders: { $sum: '$lifetime_orders' },
      total_days_between_first_second: {
        $sum: {
          $ifNull: ['$days_between_first_second_order', 0],
        },
      },
      customers_with_second_order: {
        $sum: {
          $cond: [
            {
              $ne: [
                '$days_between_first_second_order',
                null,
              ],
            },
            1,
            0,
          ],
        },
      },
    },
  },
  {
    $project: {
      _id: 0,
      total_customers: 1,
      new_customers: 1,
      repeat_customers: 1,
      returning_customers: 1,
      total_orders: 1,
      total_net_sales: 1,
      total_net_profit: 1,
      total_payment: 1,
      total_units: 1,
      repeat_customer_rate: {
        $cond: [
          { $gt: ['$total_customers', 0] },
          {
            $divide: [
              '$repeat_customers',
              '$total_customers',
            ],
          },
          0,
        ],
      },
      returning_customer_rate: {
        $cond: [
          { $gt: ['$total_customers', 0] },
          {
            $divide: [
              '$returning_customers',
              '$total_customers',
            ],
          },
          0,
        ],
      },
      average_orders_per_customer: {
        $cond: [
          { $gt: ['$total_customers', 0] },
          {
            $divide: ['$total_orders', '$total_customers'],
          },
          0,
        ],
      },
      average_net_sales_per_customer: {
        $cond: [
          { $gt: ['$total_customers', 0] },
          {
            $divide: [
              '$total_net_sales',
              '$total_customers',
            ],
          },
          0,
        ],
      },
      average_net_profit_per_customer: {
        $cond: [
          { $gt: ['$total_customers', 0] },
          {
            $divide: [
              '$total_net_profit',
              '$total_customers',
            ],
          },
          0,
        ],
      },
      average_days_to_second_order: {
        $cond: [
          { $gt: ['$customers_with_second_order', 0] },
          {
            $divide: [
              '$total_days_between_first_second',
              '$customers_with_second_order',
            ],
          },
          0,
        ],
      },
    },
  },
];

const addCustomerDerivedMetrics = (
  startDate: string
): PipelineStage.AddFields => ({
  $addFields: {
    sorted_order_dates: {
      $sortArray: {
        input: '$order_dates',
        sortBy: 1,
      },
    },
    sorted_period_order_dates: {
      $sortArray: {
        input: '$period_order_dates',
        sortBy: 1,
      },
    },
    is_new_customer: {
      $gte: [
        '$first_order_at',
        startOfDay(parseISO(startDate)),
      ],
    },
    is_repeat_customer: { $gt: ['$period_orders', 1] },
    is_returning_customer: {
      $lt: [
        '$first_order_at',
        startOfDay(parseISO(startDate)),
      ],
    },
  },
});

const addSecondOrderMetric =
  (): PipelineStage.AddFields => ({
    $addFields: {
      days_between_first_second_order: {
        $cond: [
          { $gte: [{ $size: '$sorted_order_dates' }, 2] },
          {
            $dateDiff: {
              startDate: {
                $arrayElemAt: ['$sorted_order_dates', 0],
              },
              endDate: {
                $arrayElemAt: ['$sorted_order_dates', 1],
              },
              unit: 'day',
            },
          },
          null,
        ],
      },
    },
  });

const projectCustomerRow = (): PipelineStage[] => [
  addSecondOrderMetric(),
  {
    $project: {
      _id: 0,
      customer_key: '$_id',
      username: 1,
      first_order_at: 1,
      last_order_at: 1,
      period_orders: 1,
      period_net_sales: 1,
      period_net_profit: 1,
      period_total_payment: 1,
      period_units: 1,
      lifetime_orders: 1,
      lifetime_net_sales: 1,
      lifetime_net_profit: 1,
      lifetime_total_payment: 1,
      lifetime_units: 1,
      is_new_customer: 1,
      is_repeat_customer: 1,
      is_returning_customer: 1,
      days_between_first_second_order: 1,
      average_order_value: {
        $cond: [
          { $gt: ['$period_orders', 0] },
          {
            $divide: [
              '$period_total_payment',
              '$period_orders',
            ],
          },
          0,
        ],
      },
      net_margin: {
        $cond: [
          { $gt: ['$period_net_sales', 0] },
          {
            $divide: [
              '$period_net_profit',
              '$period_net_sales',
            ],
          },
          0,
        ],
      },
    },
  },
];

const emptyCustomerSummary = () => ({
  total_customers: 0,
  new_customers: 0,
  repeat_customers: 0,
  returning_customers: 0,
  total_orders: 0,
  total_net_sales: 0,
  total_net_profit: 0,
  total_payment: 0,
  total_units: 0,
  repeat_customer_rate: 0,
  returning_customer_rate: 0,
  average_orders_per_customer: 0,
  average_net_sales_per_customer: 0,
  average_net_profit_per_customer: 0,
  average_days_to_second_order: 0,
});
