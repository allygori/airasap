export const dateFilter = <F extends string>(
  startDate: string | Date,
  endDate: string | Date,
  field: F
) => {
  return {
    $match: {
      [field]: {
        $gte: new Date(startDate),
        $lt: new Date(endDate),
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
