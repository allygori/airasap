/**
 * Order Repository
 * Handles all order database operations with multi-tenancy support
 * Using Mongoose v9
 */

import {
  QueryFilter,
  AnyBulkWriteOperation,
} from 'mongoose';
import { saveJson } from '@/lib/file/save-json';
import { BaseRepository } from '../base.repository';
import { OrderModel, TOrder } from './order.model';
import { type OrderPlatform } from '@/constant/order-platform';

export class OrderRepository extends BaseRepository<TOrder> {
  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
  }) {
    super(OrderModel, tenantContext);
  }

  /**
   * Find orders by platform
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
   * Find active orders only
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
   * Search orders by name or order_id
   */
  async search(query: string) {
    return await this.model
      .find({
        ...this.getTenantFilter(),
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { order_id: { $regex: query, $options: 'i' } },
        ],
        deleted_at: null,
      })
      .lean();
  }

  // /**
  //  * Find order by _id (mongodb identifier)
  //  * @TODO enable
  //  */
  // async findById(id: string) {
  //   return await this.model
  //     .findOne({
  //       ...this.getTenantFilter(),
  //       _id: id,
  //       deleted_at: null,
  //     })
  //     .lean();
  // }

  /**
   * Find order by order_id (unique identifier)
   */
  async findByOrderId(orderId: string, populate?: string) {
    let query = this.model.findOne({
      ...this.getTenantFilter(),
      order_id: orderId,
      deleted_at: null,
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
   * Soft delete order by setting deleted_at
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
   * Restore soft-deleted order
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
   * Bulk update order status
   */
  async bulkUpdateStatus(
    orderIds: string[],
    isActive: boolean
  ) {
    return await this.model.updateMany(
      {
        _id: { $in: orderIds },
        ...this.getTenantFilter(),
        deleted_at: null,
      },
      { $set: { is_active: isActive } }
    );
  }

  /**
   * Get orders with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    filter?: QueryFilter<TOrder>,
    sort?: string,
    populate?: string
  ) {
    const skip = (page - 1) * limit;

    let query = this.model.find({
      ...filter,
      ...this.getTenantFilter(),
    });

    // if (sort) {
    //   const sorts = sort
    //     .split(',')
    //     .map((f) => f.trim());
    //   sorts.forEach((field) => {
    //     query = query.sort(field) as any;
    //   });
    // }

    const sortObj: Record<string, 1 | -1> = {};
    if (sort) {
      for (const field of sort.split(',')) {
        const trimmed = field.trim();
        if (trimmed.startsWith('-')) {
          sortObj[trimmed.slice(1)] = -1;
        } else {
          sortObj[trimmed] = 1;
        }
      }

      // console.log(JSON.stringify(sortObj, null, 2));

      query.sort(sortObj);
    }

    if (populate) {
      const fields = populate
        .split(',')
        .map((f) => f.trim());
      fields.forEach((field) => {
        query = query.populate(field) as any;
      });
    }

    const [data, total] = await Promise.all([
      query.skip(skip).limit(limit).lean(),
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
   * Count orders by platform
   */
  async countByPlatform(platform: OrderPlatform) {
    return await this.model.countDocuments({
      ...this.getTenantFilter(),
      platform,
      deleted_at: null,
    });
  }

  /**
   * Bulk write
   */
  async bulkWrite(
    operations: AnyBulkWriteOperation<TOrder>[]
  ) {
    return await this.model.bulkWrite(operations);
  }
}
