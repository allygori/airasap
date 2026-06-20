/**
 * Organization Repository
 * Handles all organization database operations with multi-tenancy support
 * Using Mongoose v9
 */

import { BaseRepository } from '../base.repository';
import {
  OrganizationModel,
  TOrganization,
} from './organization.model';

export class OrganizationRepository extends BaseRepository<TOrganization> {
  constructor(tenantContext: {
    organizationId?: string;
    storeId?: string;
  }) {
    // super(OrganizationModel, tenantContext);
    super(OrganizationModel, {
      organizationId: tenantContext.organizationId || '',
      storeId: tenantContext.storeId || undefined,
    });
  }

  async findLatestByUserId(userId: string) {
    return await this.model
      .findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  // async findLatestOrgAndStore(userId: string) {
  //   return await this.model
  //     .findOne({ userId })
  //     .sort({ createdAt: -1 })
  //     .lean();
  // }

  // async findLatestOrganizationByUserId(userId: string) {
  //   return await this.model
  //     .findOne({ userId })
  //     .sort({ createdAt: -1 })
  //     .lean();
  // }
}
