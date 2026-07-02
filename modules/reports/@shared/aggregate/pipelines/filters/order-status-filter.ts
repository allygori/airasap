export const orderStatusFilter = (
  status: string = 'Selesai'
) => {
  return {
    $match: {
      status: status,
    },
  };
};
