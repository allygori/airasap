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
import type { ClientSession } from 'mongoose';

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

  async findAccountingState(session?: ClientSession) {
    const query = this.model
      .findOne({
        _id: this.tenantContext.organizationId,
      })
      .select('accounting');
    if (session) query.session(session);
    return query.lean();
  }

  async startAccounting(
    data: {
      calendar_timezone: string;
      onboarding_version: number;
      started_at: Date;
    },
    session?: ClientSession
  ) {
    const query = this.model.findOneAndUpdate(
      {
        _id: this.tenantContext.organizationId,
        $or: [
          { 'accounting.status': { $exists: false } },
          { 'accounting.status': 'not_started' },
        ],
      },
      {
        $set: {
          'accounting.status': 'in_progress',
          'accounting.onboarding_version':
            data.onboarding_version,
          'accounting.calendar_timezone':
            data.calendar_timezone,
          'accounting.started_at': data.started_at,
        },
      },
      {
        new: true,
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );
    return query.lean();
  }

  async activateAccounting(
    data: {
      onboarding_version: number;
      calendar_timezone: string;
      cutover_date: Date;
      account_mappings?: Record<string, unknown>;
      completed_at: Date;
      completed_by?: string;
    },
    session?: ClientSession
  ) {
    const query = this.model.findOneAndUpdate(
      {
        _id: this.tenantContext.organizationId,
        'accounting.status': 'in_progress',
      },
      {
        $set: {
          'accounting.status': 'active',
          'accounting.onboarding_version':
            data.onboarding_version,
          'accounting.calendar_timezone':
            data.calendar_timezone,
          'accounting.cutover_date': data.cutover_date,
          ...(data.account_mappings
            ? {
                'accounting.account_mappings':
                  data.account_mappings,
              }
            : {}),
          'accounting.completed_at': data.completed_at,
          ...(data.completed_by
            ? {
                'accounting.completed_by':
                  data.completed_by,
              }
            : {}),
        },
      },
      {
        new: true,
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );
    return query.lean();
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
