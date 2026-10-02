/**
 * Product Repository
 * Handles all product database operations with multi-tenancy support
 * Using Mongoose v9
 */

import { BaseRepository } from '../base.repository';
import { ProductModel, TProduct } from './product.model';
import { QueryFilter, Types, UpdateQuery } from 'mongoose';
import { escapeRegex } from '@/lib/string';
import { type OrderPlatform } from '@/constant/order-platform';

export type ProductInventorySourceRecord = {
  _id: Types.ObjectId;
  product_id: string;
  name: string;
  platform?: OrderPlatform;
  parent_sku?: string;
  has_variation: boolean;
  variants: Array<{
    variant_id: string;
    name: string;
    child_sku?: string | null;
  }>;
};

export class ProductRepository extends BaseRepository<TProduct> {
  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
  }) {
    super(ProductModel, tenantContext);
  }

  async listActiveInventorySources(input: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{
    records: ProductInventorySourceRecord[];
    total: number;
  }> {
    const filter: QueryFilter<TProduct> = {
      ...this.getTenantFilter(),
      is_active: true,
      $or: [
        { deleted_at: null },
        { deleted_at: { $exists: false } },
      ],
    };

    if (input.search) {
      const search = new RegExp(
        escapeRegex(input.search),
        'i'
      );
      filter.$and = [
        {
          $or: [
            { name: search },
            { product_id: search },
            { parent_sku: search },
            { 'variants.child_sku': search },
          ],
        },
      ];
    }

    const [records, total] = await Promise.all([
      this.model
        .find(filter)
        .select(
          '_id product_id name platform parent_sku has_variation variants.variant_id variants.name variants.child_sku'
        )
        .sort({ name: 1, _id: 1 })
        .skip((input.page - 1) * input.limit)
        .limit(input.limit)
        .lean<ProductInventorySourceRecord[]>()
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { records, total };
  }

  async findActiveInventorySourceById(
    id: string
  ): Promise<ProductInventorySourceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return this.model
      .findOne({
        ...this.getTenantFilter(),
        _id: new Types.ObjectId(id),
        is_active: true,
        $or: [
          { deleted_at: null },
          { deleted_at: { $exists: false } },
        ],
      })
      .select(
        '_id product_id name platform parent_sku has_variation variants.variant_id variants.name variants.child_sku'
      )
      .lean<ProductInventorySourceRecord | null>()
      .exec();
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
        query = query.populate(field) as typeof query;
      });
    }

    return await query.lean();
  }

  async findForOrderMatching(input: {
    names?: string[];
    parentSkus?: string[];
    childSkus?: string[];
    productIds?: string[];
  }) {
    const names = (input.names ?? []).filter(Boolean);
    const parentSkus = (input.parentSkus ?? []).filter(
      Boolean
    );
    const childSkus = (input.childSkus ?? []).filter(
      Boolean
    );
    const productIds = (input.productIds ?? []).filter(
      Boolean
    );
    const or: QueryFilter<TProduct>[] = [];

    if (names.length > 0) {
      or.push(
        { name: { $in: names } } as QueryFilter<TProduct>,
        {
          name_history: { $in: names },
        } as QueryFilter<TProduct>
      );
    }
    if (parentSkus.length > 0) {
      or.push({
        parent_sku: { $in: parentSkus },
      } as QueryFilter<TProduct>);
    }
    if (childSkus.length > 0) {
      or.push({
        'variants.child_sku': { $in: childSkus },
      } as QueryFilter<TProduct>);
    }
    if (productIds.length > 0) {
      or.push({
        product_id: { $in: productIds },
      } as QueryFilter<TProduct>);
    }

    if (or.length === 0) return [];

    return await this.model
      .find({
        ...this.getTenantFilter(),
        $or: or,
      })
      .lean();
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

  async markReviewed(id: string, userId: string) {
    return this.model
      .findOneAndUpdate(
        {
          _id: id,
          ...this.getTenantFilter(),
          deleted_at: null,
        },
        {
          $set: {
            needs_review: false,
            review_issues: [],
            reviewed_at: new Date(),
            reviewed_by: userId,
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        }
      )
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
    filter?: QueryFilter<TProduct>,
    sort: Record<string, 1 | -1> = { created_at: -1 }
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
        .sort(sort)
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
   * Count products
   */
  async count() {
    return await this.model.countDocuments({
      ...this.getTenantFilter(),
    });
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
