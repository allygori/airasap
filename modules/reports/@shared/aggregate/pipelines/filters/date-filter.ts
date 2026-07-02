export const dateFilter = (
  startDate: string | Date,
  endDate: string | Date,
  field: string
) => {
  return {
    $match: {
      [field]: {
        $gte: new Date(startDate).toISOString(),
        $lt: new Date(endDate).toISOString(),
      },
    },
  };
};
