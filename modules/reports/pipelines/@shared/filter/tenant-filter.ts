import { Types } from 'mongoose';

export const tenantFilter = (
  organizationId: string,
  storeId: string
) => {
  return {
    $match: {
      organization: new Types.ObjectId(organizationId),
      store: new Types.ObjectId(storeId),
    },
  };
};
