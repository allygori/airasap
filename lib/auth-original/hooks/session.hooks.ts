// import { MemberService } from '@/modules/members/member.service';
import { OrganizationService } from '@/modules/organizations/organization.service';
import { SessionBaseDTO } from '@/modules/sessions/session.dto';
import { SessionService } from '@/modules/sessions/session.service';

export const sessionHooks = {
  create: {
    before: async (session: any) => {
      console.log(
        `sessionHooks: ${JSON.stringify(session, null, 2)}`
      );

      // // 1. Check organization
      // const org = await OrganizationService.getOneByUserId(
      //   session?.userId
      // );

      // console.log(
      //   `sessionHooks org: ${JSON.stringify(org, null, 2)}`
      // );

      // if (!org) {
      //   return { data: session };
      // }

      // // 1. Cari session terakhir dari user
      // const latestSession =
      //   await SessionService.getLatestSession(
      //     session?.userId
      //   );

      // console.log(
      //   `sessionHooks latestSession: ${JSON.stringify(latestSession, null, 2)}`
      // );

      // if (latestSession) {
      //   return {
      //     data: {
      //       ...session,
      //       activeOrganizationId:
      //         latestSession.active_organization,
      //       activeStoreId: latestSession.active_store,
      //     },
      //   };
      // }

      // // 1. Cari organisasi pertama/terakhir tempat user bergabung
      // const userMember = await db.member.findFirst({
      //   where: { userId: session.userId },
      //   orderBy: { createdAt: 'asc' }, // Mengambil organisasi pertama
      //   select: { organizationId: true },
      // });
      // 2. Jika punya organisasi, pasang sebagai activeOrganizationId di sesi baru
      // if (userMember) {
      //   return {
      //     data: {
      //       ...session,
      //       activeOrganizationId: userMember.organizationId,
      //     },
      //   };
      // }
      return { data: session };
    },
  },
};
