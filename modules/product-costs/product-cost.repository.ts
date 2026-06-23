/**
 * Product Cost Repository
 * Handles all product cost database operations with multi-tenancy support
 * Using Mongoose v9
 */

import { BaseRepository } from '../base.repository';
import {
  ProductCostModel,
  TProductCost,
} from './product-cost.model';
import { QueryFilter } from 'mongoose';

export class ProductCostRepository extends BaseRepository<TProductCost> {
  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
  }) {
    super(ProductCostModel, tenantContext);
  }

  /**
   * Find active product costs only
   */
  async findActive() {
    return await this.model
      .find({
        ...this.getTenantFilter(),
        is_active: true,
        deleted_at: null,
      })
      .lean();
  }

  /**
   * Soft delete product cost by setting deleted_at
   */
  async softDelete(id: string) {
    return await this.model
      .findOneAndUpdate(
        {
          _id: id,
          ...this.getTenantFilter(),
        },
        { $set: { deleted_at: new Date() } },
        { new: true }
      )
      .lean();
  }

  /**
   * Restore soft-deleted product cost
   */
  async restore(id: string) {
    return await this.model
      .findOneAndUpdate(
        {
          _id: id,
          ...this.getTenantFilter(),
        },
        { $set: { deleted_at: null } },
        { new: true }
      )
      .lean();
  }

  /**
   * Get product costs with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    filter?: QueryFilter<TProductCost>
  ) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model
        .find({
          ...this.getTenantFilter(),
          deleted_at: null,
          ...filter,
        })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments({
        ...this.getTenantFilter(),
        deleted_at: null,
        ...filter,
      }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
