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
import { Types, type ClientSession } from 'mongoose';

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

  async findFinanceState(session?: ClientSession) {
    const query = this.model
      .findOne({
        _id: this.tenantContext.organizationId,
      })
      .select('finance');
    if (session) query.session(session);
    return query.lean();
  }

  async findFinanceAccessState(session?: ClientSession) {
    const query = this.model
      .findOne({
        _id: this.tenantContext.organizationId,
      })
      .select('plan finance');
    if (session) query.session(session);
    return query.lean();
  }

  async startFinance(
    data: {
      onboarding_version: number;
      started_at: Date;
    },
    session?: ClientSession
  ) {
    const query = this.model.findOneAndUpdate(
      {
        _id: this.tenantContext.organizationId,
        $or: [
          { 'finance.status': { $exists: false } },
          { 'finance.status': 'not_started' },
        ],
      },
      {
        $set: {
          'finance.status': 'in_progress',
          'finance.onboarding_version':
            data.onboarding_version,
          'finance.started_at': data.started_at,
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

  async updateFinanceCalendarTimezone(
    calendarTimezone: string,
    session?: ClientSession
  ) {
    const query = this.model.findOneAndUpdate(
      {
        _id: this.tenantContext.organizationId,
        'finance.status': 'in_progress',
      },
      {
        $set: {
          'finance.calendar_timezone': calendarTimezone,
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

  async activateFinance(
    data: {
      onboarding_version: number;
      cut_off_date: Date;
      completed_at: Date;
      completed_by?: string;
    },
    session?: ClientSession
  ) {
    const completedBy = data.completed_by
      ? new Types.ObjectId(data.completed_by)
      : undefined;
    const query = this.model.findOneAndUpdate(
      {
        _id: this.tenantContext.organizationId,
        'finance.status': 'in_progress',
        'finance.onboarding_version':
          data.onboarding_version,
      },
      {
        $set: {
          'finance.status': 'active',
          'finance.cut_off_date': data.cut_off_date,
          'finance.completed_at': data.completed_at,
          ...(completedBy
            ? { 'finance.completed_by': completedBy }
            : {}),
        },
        $unset: { 'finance.blocked_reason': '' },
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
