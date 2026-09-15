// import { BaseRepository } from '../base.repository';
import {
  AggregateOptions,
  Model,
  PipelineStage,
  Types,
  // Document,
  // QueryFilter,
  // UpdateQuery,
} from 'mongoose';

import { OrderModel } from '../orders/order.model';

export class ReportRepository {
  protected orderModel: Model<typeof OrderModel>;
  protected tenantContext: {
    organizationId: string;
    storeId?: string;
  };

  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
  }) {
    this.orderModel = OrderModel;
    this.tenantContext = tenantContext;
  }

  async aggregate(
    pipeline?: PipelineStage[],
    options?: AggregateOptions
  ) {
    if (
      !Types.ObjectId.isValid(
        this.tenantContext.organizationId
      ) ||
      !Types.ObjectId.isValid(
        this.tenantContext.storeId || ''
      )
    ) {
      throw new Error(
        'Invalid tenant context for report aggregation.'
      );
    }

    // Aggregate middleware cannot reliably infer the tenant from a regular
    // query option, so the repository owns this boundary explicitly.
    const tenantMatch: PipelineStage.Match = {
      $match: {
        organization: new Types.ObjectId(
          this.tenantContext.organizationId
        ),
        store: new Types.ObjectId(
          this.tenantContext.storeId!
        ),
      },
    };

    return await this.orderModel.aggregate(
      [tenantMatch, ...(pipeline || [])],
      options
    );
  }
}
