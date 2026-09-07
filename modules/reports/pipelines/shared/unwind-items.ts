export const unwindItems = (
  preserveNullAndEmptyArrays?: boolean
) => {
  return {
    $unwind: {
      path: '$items',
      preserveNullAndEmptyArrays:
        preserveNullAndEmptyArrays ?? false,
    },
  };
};
