import { fnsFormatDate } from '@/lib/formatter/date';
import {
  endOfDay,
  parse,
  parseISO,
  parseJSON,
  startOfDay,
} from 'date-fns';
import { string } from 'zod';

export const dateFilter = <F extends string>(
  startDate: string,
  endDate: string,
  field: F
) => {
  return {
    $match: {
      [field]: {
        $gte: startOfDay(parseISO(startDate)), // new Date(startDate),
        $lte: endOfDay(parseISO(endDate)), // new Date(endDate),
      },
    },
    // $match: {
    //   [field]: {
    //     $gt: new Date(startDate),
    //     $lte: new Date(endDate),
    //   },
    // },
  } as Record<F, { $gte: string; $lt: string }>;
};

export const dateFilterNormalize = <F extends string>(
  startDate: string,
  endDate: string,
  field: F
) => {
  const fieldMap: Record<string, string> = {
    placed_at: 'order_created_normalized',
    completed_at: 'order_completed_normalized',
    paid_at: 'order_paid_normalized',
  };

  return {
    $match: {
      [fieldMap[field]]: {
        $gte: fnsFormatDate(startDate, 'yyyy-MM-dd'),
        $lte: fnsFormatDate(endDate, 'yyyy-MM-dd'),
      },
    },
  };
};
