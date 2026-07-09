/**
 * Product Repository
 * Handles all product database operations with multi-tenancy support
 * Using Mongoose v9
 */

import { BaseRepository } from '../base.repository';
import { ProductModel, TProduct } from './product.model';
import { QueryFilter, UpdateQuery } from 'mongoose';
import { type OrderPlatform } from '@/constant/order-platform';

export class ProductRepository extends BaseRepository<TProduct> {
  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
  }) {
    super(ProductModel, tenantContext);
  }

  /**
   * Find products by multiple product ids
   */
  async findByMultipleIds(ids: string[]) {
    return await this.model
      .find({
        ...this.getTenantFilter(),
        product_id: { $in: ids },
        // deleted_at: null,
      })
      .lean();
  }

  /**
   * Find products by names
   */
  async findByNames(names: string[], populate?: string) {
    let query = this.model.find({
      ...this.getTenantFilter(),
      name: { $in: names },
    });

    if (populate) {
      const fields = populate
        .split(',')
        .map((f) => f.trim());
      fields.forEach((field) => {
        query = query.populate(field) as any;
      });
    }

    return await query.lean();
  }

  /**
   * Find products by platform
   */
  async findByPlatform(platform: OrderPlatform) {
    return await this.model
      .find({
        ...this.getTenantFilter(),
        platform,
        deleted_at: null,
      })
      .lean();
  }

  /**
   * Find active products only
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
   * Search products by name or product_id
   */
  async search(query: string) {
    return await this.model
      .find({
        ...this.getTenantFilter(),
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { product_id: { $regex: query, $options: 'i' } },
        ],
        deleted_at: null,
      })
      .lean();
  }

  /**
   * Find product by product_id (unique identifier)
   */
  async findByProductId(productId: string) {
    return await this.model
      .findOne({
        ...this.getTenantFilter(),
        product_id: productId,
        deleted_at: null,
      })
      .lean();
  }

  /**
   * Soft delete product by setting deleted_at
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
   * Restore soft-deleted product
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
   * @TODO Need Fix!
   * @param original
   * @param dataToUpdate
   * @returns
   */
  async save(
    original: TProduct,
    dataToUpdate: UpdateQuery<TProduct>
  ) {
    const mergedData = { ...original, ...dataToUpdate };

    return await mergedData.save();
  }

  /**
   * Bulk update product status
   */
  async bulkUpdateStatus(
    productIds: string[],
    isActive: boolean
  ) {
    return await this.model.updateMany(
      {
        _id: { $in: productIds },
        ...this.getTenantFilter(),
        deleted_at: null,
      },
      { $set: { is_active: isActive } }
      // { multi: true }
    );
  }

  /**
   * Get products with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    filter?: QueryFilter<TProduct>
  ) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model
        .find({
          $or: [
            { deleted_at: { $eq: null } },
            { deleted_at: { $exists: false } },
          ],
          ...filter,
          ...this.getTenantFilter(),
        })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments({
        $or: [
          { deleted_at: { $eq: null } },
          { deleted_at: { $exists: false } },
        ],
        ...filter,
        ...this.getTenantFilter(),
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

  /**
   * Count products by platform
   */
  async countByPlatform(platform: OrderPlatform) {
    return await this.model.countDocuments({
      ...this.getTenantFilter(),
      platform,
      deleted_at: null,
    });
  }
}
