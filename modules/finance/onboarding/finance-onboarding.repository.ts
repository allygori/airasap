import { Types, type ClientSession } from 'mongoose';
import { FINANCE_DEFAULT_CALENDAR_TIMEZONE } from '../calendar/finance-calendar.constants';
import {
  FinanceOnboardingModel,
  type TFinanceOnboarding,
} from './finance-onboarding.model';
import {
  assertFinanceTenant,
  normalizeFinanceState,
  type FinanceState,
  type FinanceTenantContext,
} from '../finance.types';

type FinanceOnboardingRecord = Pick<
  TFinanceOnboarding,
  'lifecycle' | 'settings'
>;

const isDuplicateKeyError = (
  error: unknown
): error is { code: number } =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 11000;

export class FinanceOnboardingRepository {
  private readonly organizationId: Types.ObjectId;

  constructor(context: FinanceTenantContext) {
    assertFinanceTenant(context);
    this.organizationId = new Types.ObjectId(
      context.organizationId
    );
  }

  async findFinanceState(
    session?: ClientSession
  ): Promise<FinanceState | null> {
    const query = FinanceOnboardingModel.findOne({
      organization: this.organizationId,
    }).select('lifecycle settings');
    if (session) query.session(session);

    const record = await query
      .lean<FinanceOnboardingRecord | null>()
      .exec();

    return record ? this.toFinanceState(record) : null;
  }

  async startFinance(
    data: {
      onboarding_version: number;
      started_at: Date;
    },
    session?: ClientSession
  ): Promise<FinanceState | null> {
    await this.ensureState(
      data.onboarding_version,
      session
    );

    const query = FinanceOnboardingModel.findOneAndUpdate(
      {
        organization: this.organizationId,
        'lifecycle.status': 'not_started',
      },
      {
        $set: {
          'lifecycle.status': 'in_progress',
          'lifecycle.onboarding_version':
            data.onboarding_version,
          'lifecycle.started_at': data.started_at,
        },
      },
      {
        new: true,
        runValidators: true,
        ...(session ? { session } : {}),
      }
    ).select('lifecycle settings');

    const record = await query
      .lean<FinanceOnboardingRecord | null>()
      .exec();

    return record ? this.toFinanceState(record) : null;
  }

  async updateFinanceCalendarTimezone(
    calendarTimezone: FinanceState['calendar_timezone'],
    session?: ClientSession
  ): Promise<FinanceState | null> {
    const query = FinanceOnboardingModel.findOneAndUpdate(
      {
        organization: this.organizationId,
        'lifecycle.status': 'in_progress',
      },
      {
        $set: {
          'settings.calendar_timezone': calendarTimezone,
        },
      },
      {
        new: true,
        runValidators: true,
        ...(session ? { session } : {}),
      }
    ).select('lifecycle settings');

    const record = await query
      .lean<FinanceOnboardingRecord | null>()
      .exec();

    return record ? this.toFinanceState(record) : null;
  }

  async updateShopeePayoutAccount(
    accountId: string,
    session?: ClientSession
  ): Promise<FinanceState | null> {
    const query = FinanceOnboardingModel.findOneAndUpdate(
      {
        organization: this.organizationId,
        'lifecycle.status': {
          $in: ['in_progress', 'active'],
        },
      },
      {
        $set: {
          'settings.shopee_payout_account_id':
            new Types.ObjectId(accountId),
        },
      },
      {
        new: true,
        runValidators: true,
        ...(session ? { session } : {}),
      }
    ).select('lifecycle settings');

    const record = await query
      .lean<FinanceOnboardingRecord | null>()
      .exec();

    return record ? this.toFinanceState(record) : null;
  }

  async setShopeePayoutAccountIfMissing(
    accountId: string,
    session?: ClientSession
  ): Promise<void> {
    const query = FinanceOnboardingModel.updateOne(
      {
        organization: this.organizationId,
        'lifecycle.status': 'in_progress',
        'settings.shopee_payout_account_id': null,
      },
      {
        $set: {
          'settings.shopee_payout_account_id':
            new Types.ObjectId(accountId),
        },
      },
      {
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );

    await query.exec();
  }

  async activateFinance(
    data: {
      onboarding_version: number;
      cut_off_date: Date;
      completed_at: Date;
      completed_by?: string;
    },
    session?: ClientSession
  ): Promise<FinanceState | null> {
    const completedBy = data.completed_by
      ? new Types.ObjectId(data.completed_by)
      : undefined;
    const query = FinanceOnboardingModel.findOneAndUpdate(
      {
        organization: this.organizationId,
        'lifecycle.status': 'in_progress',
        'lifecycle.onboarding_version':
          data.onboarding_version,
      },
      {
        $set: {
          'lifecycle.status': 'active',
          'lifecycle.cut_off_date': data.cut_off_date,
          'lifecycle.completed_at': data.completed_at,
          ...(completedBy
            ? { 'lifecycle.completed_by': completedBy }
            : {}),
        },
        $unset: { 'lifecycle.blocked_reason': '' },
      },
      {
        new: true,
        runValidators: true,
        ...(session ? { session } : {}),
      }
    ).select('lifecycle settings');

    const record = await query
      .lean<FinanceOnboardingRecord | null>()
      .exec();

    return record ? this.toFinanceState(record) : null;
  }

  private async ensureState(
    onboardingVersion: number,
    session?: ClientSession
  ) {
    try {
      const query = FinanceOnboardingModel.findOneAndUpdate(
        { organization: this.organizationId },
        {
          $setOnInsert: {
            lifecycle: {
              status: 'not_started',
              onboarding_version: onboardingVersion,
            },
            settings: {
              calendar_timezone:
                FINANCE_DEFAULT_CALENDAR_TIMEZONE,
              shopee_payout_account_id: null,
            },
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          ...(session ? { session } : {}),
        }
      );
      await query.lean().exec();
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;

      const existing = await this.findFinanceState(session);
      if (!existing) throw error;
    }
  }

  private toFinanceState(
    record: FinanceOnboardingRecord
  ): FinanceState {
    return normalizeFinanceState({
      status: record.lifecycle?.status,
      onboarding_version:
        record.lifecycle?.onboarding_version,
      started_at: record.lifecycle?.started_at,
      blocked_reason: record.lifecycle?.blocked_reason,
      cut_off_date: record.lifecycle?.cut_off_date,
      completed_at: record.lifecycle?.completed_at,
      completed_by: record.lifecycle?.completed_by
        ? String(record.lifecycle.completed_by)
        : undefined,
      calendar_timezone: record.settings?.calendar_timezone,
      shopee_payout_account_id: record.settings
        ?.shopee_payout_account_id
        ? String(record.settings.shopee_payout_account_id)
        : null,
    });
  }
}
