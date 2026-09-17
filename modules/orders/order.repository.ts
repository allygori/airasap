/**
 * Order Repository
 * Handles all order database operations with multi-tenancy support
 * Using Mongoose v9
 */

import {
  QueryFilter,
  AnyBulkWriteOperation,
  ClientSession,
} from 'mongoose';
import { BaseRepository } from '../base.repository';
import { OrderModel, TOrder } from './order.model';
import { type OrderPlatform } from '@/constant/order-platform';
import { type QueryOptions } from '@/lib/api/query-builder';

type OrderAccountingState = {
  accounting_status: 'pending' | 'posted' | 'blocked';
  accounting_error?: string | null;
  accounting_block_reason?: string | null;
  accounting_last_attempt_at?: Date;
  accounting_attempt_count?: number;
  accounting_journal_entry?: string;
  accounting_inventory_movements?: string[];
  accounting_posted_at?: Date;
};

export class OrderRepository extends BaseRepository<TOrder> {
  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
  }) {
    super(OrderModel, tenantContext);
  }

  async findById(id: string, populate?: string) {
    let query = this.model
      .findOne({
        _id: id,
        ...this.getTenantFilter(),
      })
      .select('+store');

    if (populate) {
      const fields = populate
        .split(',')
        .map((field) => field.trim());
      fields.forEach((field) => {
        query = query.populate(field);
      });
    }

    return query.lean();
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

  async findAccountingCandidates(limit = 50) {
    return this.model
      .find({
        ...this.getTenantFilter(),
        is_active: true,
        status: 'selesai',
        $or: [
          {
            accounting_status: {
              $in: ['pending', 'blocked'],
            },
          },
          { accounting_status: { $exists: false } },
        ],
        $and: [
          {
            $or: [
              { deleted_at: null },
              { deleted_at: { $exists: false } },
            ],
          },
        ],
      })
      .sort({ completed_at: 1, placed_at: 1, _id: 1 })
      .limit(limit)
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
        query = query.populate(field);
      });
    }

    return await query.lean();
  }

  async updateAccountingState(
    id: string,
    state: OrderAccountingState,
    session?: ClientSession
  ) {
    return await this.model
      .findOneAndUpdate(
        {
          ...this.getTenantFilter(),
          _id: id,
        },
        {
          $set: {
            accounting_status: state.accounting_status,
            ...(state.accounting_error !== undefined
              ? { accounting_error: state.accounting_error }
              : {}),
            ...(state.accounting_block_reason !== undefined
              ? {
                  accounting_block_reason:
                    state.accounting_block_reason,
                }
              : {}),
            ...(state.accounting_last_attempt_at
              ? {
                  accounting_last_attempt_at:
                    state.accounting_last_attempt_at,
                }
              : {}),
            ...(state.accounting_attempt_count !== undefined
              ? {
                  accounting_attempt_count:
                    state.accounting_attempt_count,
                }
              : {}),
            ...(state.accounting_journal_entry
              ? {
                  accounting_journal_entry:
                    state.accounting_journal_entry,
                }
              : {}),
            ...(state.accounting_inventory_movements
              ? {
                  accounting_inventory_movements:
                    state.accounting_inventory_movements,
                }
              : {}),
            ...(state.accounting_posted_at
              ? {
                  accounting_posted_at:
                    state.accounting_posted_at,
                }
              : {}),
          },
          ...(state.accounting_status === 'posted'
            ? {
                $unset: {
                  accounting_error: 1,
                  accounting_block_reason: 1,
                },
              }
            : {}),
        },
        {
          new: true,
          runValidators: true,
          ...(session ? { session } : {}),
        }
      )
      .lean();
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
    populate?: string,
    search?: string,
    searchField?: string
  ) {
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
    } else {
      sortObj.placed_at = -1;
    }

    const queryOptions: QueryOptions = {
      page,
      limit,
      sort: sortObj,
      search,
      searchField,
      filters: {},
    };

    return super.findWithQueryOptions(queryOptions, {
      baseFilter: filter,
      searchFields: [
        'order_id',
        'username',
        'items.product_name',
        'tracking_number',
      ],
      populate: populate
        ? populate.split(',').map((field) => field.trim())
        : undefined,
    });
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
    const tenantFilter = this.getTenantFilter();
    const scopedOperations = operations.map((operation) => {
      if ('insertOne' in operation) {
        return {
          insertOne: {
            ...operation.insertOne,
            document: {
              ...operation.insertOne.document,
              organization:
                this.tenantContext.organizationId,
              ...(this.tenantContext.storeId && {
                store: this.tenantContext.storeId,
              }),
            },
          },
        } as unknown as AnyBulkWriteOperation<TOrder>;
      }

      if ('updateOne' in operation) {
        return {
          updateOne: {
            ...operation.updateOne,
            filter: {
              ...operation.updateOne.filter,
              ...tenantFilter,
            },
          },
        } as unknown as AnyBulkWriteOperation<TOrder>;
      }

      if ('updateMany' in operation) {
        return {
          updateMany: {
            ...operation.updateMany,
            filter: {
              ...operation.updateMany.filter,
              ...tenantFilter,
            },
          },
        } as unknown as AnyBulkWriteOperation<TOrder>;
      }

      if ('replaceOne' in operation) {
        return {
          replaceOne: {
            ...operation.replaceOne,
            filter: {
              ...operation.replaceOne.filter,
              ...tenantFilter,
            },
            replacement: {
              ...operation.replaceOne.replacement,
              organization:
                this.tenantContext.organizationId,
              ...(this.tenantContext.storeId && {
                store: this.tenantContext.storeId,
              }),
            },
          },
        } as unknown as AnyBulkWriteOperation<TOrder>;
      }

      if ('deleteOne' in operation) {
        return {
          deleteOne: {
            ...operation.deleteOne,
            filter: {
              ...operation.deleteOne.filter,
              ...tenantFilter,
            },
          },
        } as AnyBulkWriteOperation<TOrder>;
      }

      if ('deleteMany' in operation) {
        return {
          deleteMany: {
            ...operation.deleteMany,
            filter: {
              ...operation.deleteMany.filter,
              ...tenantFilter,
            },
          },
        } as AnyBulkWriteOperation<TOrder>;
      }

      return operation;
    });

    return await this.model.bulkWrite(scopedOperations);
  }

  // async unsetDeprecatedItemProfitField() {
  //   return await this.model.updateMany(
  //     {
  //       ...this.getTenantFilter(),
  //       'items.profit': { $exists: true },
  //     },
  //     {
  //       $unset: {
  //         'items.$[].profit': '',
  //       },
  //     }
  //   );
  // }
}
