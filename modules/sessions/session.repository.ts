/**
 * Session Repository
 * Handles all session database operations with multi-tenancy support
 * Using Mongoose v9
 */

import { BaseRepository } from '../base.repository';
import { SessionModel, TSession } from './session.model';

export class SessionRepository extends BaseRepository<TSession> {
  constructor(tenantContext: {
    organizationId?: string;
    storeId?: string;
  }) {
    // super(SessionModel, tenantContext);
    super(SessionModel, {
      organizationId: tenantContext.organizationId || '',
      storeId: tenantContext.storeId || undefined,
    });
  }

  // async findLatestOrgAndStore(userId: string) {
  //   return await this.model
  //     .findOne({ userId })
  //     .sort({ createdAt: -1 })
  //     .lean();
  // }

  async findLatestSessionByUserId(userId: string) {
    return await this.model
      .findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();
  }
}
