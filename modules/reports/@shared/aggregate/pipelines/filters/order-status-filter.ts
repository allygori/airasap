export const orderStatusFilter = (
  status: string | string[] = 'Selesai'
) => {
  return {
    $match: {
      // status: status,
    },
  };
};
