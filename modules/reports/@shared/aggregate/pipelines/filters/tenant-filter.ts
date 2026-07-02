export const tenantFilter = (
  organizationId: string,
  storeId: string
) => {
  return {
    $match: {
      organization: organizationId,
      store: storeId,
    },
  };
};
