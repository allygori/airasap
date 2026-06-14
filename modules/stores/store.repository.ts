/**
 * Store Repository
 * Handles all file database operations with multi-tenancy support
 * Using Mongoose v9
 */

import { BaseRepository } from '../base.repository';
import { StoreModel, TStore } from './store.model';
import { QueryFilter } from 'mongoose';

export class StoreRepository extends BaseRepository<TStore> {
  constructor(tenantContext: {
    organizationId: string;
    // storeId?: string;
  }) {
    super(StoreModel, tenantContext);
  }

  /**
   * Find active stores only
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
   * Create a new store
   */
  async create(data: any) {
    return await this.model.create({
      ...data,
      organizationId: this.tenantContext.organizationId,
    });
  }

  /**
   * Soft delete file by setting deleted_at
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
   * Restore soft-deleted file
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
   * Get stores with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    filter?: QueryFilter<TStore>
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
