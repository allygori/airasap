/**
 * Order Repository
 * Handles all order database operations with multi-tenancy support
 * Using Mongoose v9
 */

import { saveJson } from '@/lib/file/save-json';
import { BaseRepository } from '../base.repository';
import { OrderModel, TOrder } from './order.model';
import {
  QueryFilter,
  AnyBulkWriteOperation,
} from 'mongoose';

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
  async findByPlatform(platform: string) {
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
    populate?: string
  ) {
    const skip = (page - 1) * limit;

    let query = this.model.find({
      ...filter,
      ...this.getTenantFilter(),
    });

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
  async countByPlatform(platform: string) {
    return await this.model.countDocuments({
      ...this.getTenantFilter(),
      platform,
      deleted_at: null,
    });
  }

  /**
   * Enrich order data with released income data from shopee xlsx
   */
  async enrichWithReleasedIncome(
    // operations: AnyBulkWriteOperation<(typeof OrderModel)[]>
    orders: any[]
  ) {
    // console.log(
    //   'Repository enrichWithReleasedIncome orders:',
    //   JSON.stringify(orders, null, 2)
    // );

    saveJson(
      `.data/json-logs/enrich-with-released-fund.json`,
      orders
    );

    const operations: AnyBulkWriteOperation<
      typeof OrderModel
    >[] = orders.map((item) => {
      const itemsMap = (item.items || []).reduce(
        (acc: any, n: any, idx: number) => {
          console.log({ acc, n, idx });
          const { product } = n;
          acc[`items.${idx}.product`] = product._id;
          acc[`items.${idx}.processing_fee`] =
            n.orderProcessingFee;
          return acc;
        },
        {}
      );

      console.log(
        'Repository enrichWithReleasedIncome itemsMap:',
        JSON.stringify(itemsMap, null, 2)
      );

      return {
        updateOne: {
          filter: { order_id: item.orderId },
          update: {
            $set: {
              fee: {
                admin_fee: item.adminFee,
                processing_fee: item.orderProcessingFee,
                affiliate_fee: item.amsCommissionFee,
                service_fee: item.serviceFee,
                shipping_saver_program_fee:
                  item.shippingSaverProgramFee,
                transaction_fee: item.transactionFee,
                campaign_fee: item.campaignFee,
                auto_top_up_fee_from_income:
                  item.autoTopUpFeeFromIncome,
                return_shipping_fee: item.returnShippingFee,
                return_to_sender_shipping_fee:
                  item.returnToSenderShippingFee,
                shipping_fee_refund: item.shippingFeeRefund,
              },
              released_amount: item.totalIncome,
              shipping_fee_paid_by_buyer:
                item.shippingFeePaidByBuyer || 0,
              shipping_fee_discount_by_logistics:
                item.shippingFeeDiscountByLogistics || 0,
              shipping_fee_forwarded_by_shopee:
                item.shippingFeeForwardedByShopee || 0,
              free_shipping_promo_from_seller:
                item.freeShippingPromoFromSeller || 0,
              compensation: item.compensation || 0,
              enriched_at: new Date().toISOString(),
              ...itemsMap,

              // admin_fee: item.adminFee,
              // order_process_fee: item.orderProcessingFee,
              // affiliate_fee: item.amsCommissionFee,
              // campaign_fee: item.campaignFee,
              // voucher_fee: {
              //   type: Number,
              //   alias: 'voucherFee',
              // },
              // shipping_fee: {
              //   type: Number,
              //   alias: 'shippingFee',
              // },
              // other_fee: {
              //   type: Number,
              //   alias: 'otherFee',
              // },
              // return_shipping_fee: {
              //   type: Number,
              //   alias: 'returnShippingFee',
              // },
              // released_amount: {
              //   type: Number,
              //   alias: 'releasedAmount',
              // },
              // net_amount: {
              //   type: Number,
              //   alias: 'netAmount',
              // },
            },
          },
          upsert: true,
        },
      };
    });

    return await this.model.bulkWrite(operations);
  }

  /**
   * Enrich order data with released income data from shopee xlsx
   */
  async enrichWithReleasedIncome2(
    operations: AnyBulkWriteOperation<TOrder>[]
  ) {
    return await this.model.bulkWrite(operations);
  }

  /**
   * Bulk write
   */
  async bulkWrite(
    operations: AnyBulkWriteOperation<typeof OrderModel>[]
  ) {
    return await this.model.bulkWrite(operations);
  }
}
