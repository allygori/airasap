// import { BaseRepository } from '../base.repository';
import {
  AggregateOptions,
  Model,
  PipelineStage,
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
    // startDate: string | Date,
    // endDate: string | Date
    // aggregate

    // Guard
    const guard = {
      $match: {
        organization: this.tenantContext.organizationId,
        store: this.tenantContext.storeId,
      },
    };

    return await this.orderModel.aggregate(
      pipeline,
      options
    );
  }
}
