import { MemberModel } from '@/modules/members/member.model';
import type { FinanceTenantContext } from './finance.types';

export async function hasFinanceOwnerAccess(
  context: FinanceTenantContext
) {
  if (!context.userId) return false;

  const member = await MemberModel.findOne({
    organizationId: context.organizationId,
    userId: context.userId,
    role: 'owner',
    $or: [
      { deletedAt: null },
      { deletedAt: { $exists: false } },
    ],
  })
    .select('_id role')
    .lean();

  return Boolean(member);
}
