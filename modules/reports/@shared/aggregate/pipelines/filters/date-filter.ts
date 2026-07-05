import {
  endOfDay,
  parse,
  parseISO,
  parseJSON,
  startOfDay,
} from 'date-fns';

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
