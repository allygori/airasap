import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth'; // Your Better Auth initialization file
// import { Project } from '@/models/Project';

export async function getTenantBoundModel(model: any) {
  const reqHeaders = await headers();
  // // Extract tenant context from your chosen custom header
  // const targetOrgId = reqHeaders.get('x-organization-id');
  // // const aa = auth.api.get

  // if (!targetOrgId) {
  //   throw new Error(
  //     'Unauthorized: Missing Organization context header.'
  //   );
  // }

  // // Double Check: Verify user belongs to this organization via Better Auth
  // const session = await auth.api.getSession({
  //   headers: reqHeaders,
  // });

  // if (
  //   !session ||
  //   session.session.activeOrganizationId !== targetOrgId
  // ) {
  //   throw new Error(
  //     'Forbidden: You are not authorized to view this organization.'
  //   );
  // }

  const session = await auth.api.getSession({
    headers: reqHeaders,
  });
  const targetOrgId =
    session?.session?.activeOrganizationId;

  // Return an executable proxy or utility closure bound to the tenant parameter
  return {
    find: (filter: any) =>
      model
        .find(filter)
        .setOptions({ organizationId: targetOrgId }),
    findOne: (filter: any) =>
      model
        .findOne(filter)
        .setOptions({ organizationId: targetOrgId }),
    countDocuments: (filter: any) =>
      model
        .countDocuments(filter)
        .setOptions({ organizationId: targetOrgId }),
    create: (data: any) =>
      model.create({
        ...data,
        organizationId: targetOrgId,
      }),
  };
}
