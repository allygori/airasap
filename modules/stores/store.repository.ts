/**
 * Store Repository
 * Handles all file database operations with multi-tenancy support
 * Using Mongoose v9
 */

import { BaseRepository } from '../base.repository';
import { Types, type QueryFilter } from 'mongoose';
import type {
  CreateStoreDTO,
  UpdateStoreDTO,
} from './store.dto';
import { StoreModel, type TStore } from './store.model';

export class StoreRepository extends BaseRepository<TStore> {
  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
  }) {
    super(StoreModel, tenantContext);
  }

  /**
   * Find current store
   */
  async findCurrentStore() {
    const storeId = this.tenantContext.storeId;
    if (!storeId || !Types.ObjectId.isValid(storeId)) {
      return null;
    }

    return await this.model
      .findOne({
        _id: new Types.ObjectId(storeId),
        ...this.getTenantFilter(),
        is_active: true,
        deleted_at: null,
      })
      .lean()
      .exec();
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
  async create(data: CreateStoreDTO) {
    return await this.model.create({
      ...data,
      // organizationId: this.tenantContext.organizationId,
      organization: this.tenantContext.organizationId,
    });
  }

  /**
   * Update an active Store inside the trusted Organization scope.
   */
  async updateById(id: string, data: UpdateStoreDTO) {
    if (!Types.ObjectId.isValid(id)) return null;

    return this.model
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          ...this.getTenantFilter(),
          is_active: true,
          deleted_at: null,
        },
        { $set: data },
        { returnDocument: 'after', runValidators: true }
      )
      .lean()
      .exec();
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
