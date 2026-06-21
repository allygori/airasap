/**
 * Order Service
 * Handles business logic for order operations
 */

import { OrderRepository } from './order.repository';
import {
  CreateOrderDTO,
  UpdateOrderDTO,
  OrderFilterDTO,
  BulkUpdateStatusDTO,
  MassUploadResponseDTO,
} from './order.dto';
import parseMassOrdersExcel, {
  ParsedOrderRow,
} from '@/lib/xlsx/shopee/order';
import parseReleasedIncomeExcel from '@/lib/xlsx/shopee/released-income';
import { ProductService } from '../products/product.service';
import { PLATFORMS_KV } from '../constant';

export class OrderService {
  private repository: OrderRepository;
  private productService: ProductService;

  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
  }) {
    this.repository = new OrderRepository(tenantContext);
    this.productService = new ProductService(tenantContext);
  }

  /**
   * Get all orders
   */
  async getAll() {
    try {
      return await this.repository.findAll({
        deleted_at: null,
      });
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil daftar order: ${error.message}`
      );
    }
  }

  /**
   * Get orders with pagination and filtering
   */
  async getWithPagination(filter: OrderFilterDTO) {
    try {
      const queryFilter: any = { deleted_at: null };

      if (filter.search) {
        const searchRegex = {
          $regex: filter.search,
          $options: 'i',
        };
        queryFilter.$or = [
          { name: searchRegex },
          { order_id: searchRegex },
        ];
      }

      return await this.repository.findWithPagination(
        filter.page || 1,
        filter.limit || 10,
        queryFilter
      );
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil order dengan pagination: ${error.message}`
      );
    }
  }

  /**
   * Get order by ID
   */
  async getById(id: string) {
    try {
      const order = await this.repository.findById(id);
      if (!order) {
        throw new Error('Order tidak ditemukan');
      }
      return order;
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil detail order: ${error.message}`
      );
    }
  }

  /**
   * Get order by order_id (unique identifier)
   */
  async getByOrderId(orderId: string) {
    try {
      const order =
        await this.repository.findByOrderId(orderId);
      if (!order) {
        throw new Error(
          `Order dengan ID ${orderId} tidak ditemukan`
        );
      }
      return order;
    } catch (error: any) {
      throw new Error(
        `Gagal mencari order: ${error.message}`
      );
    }
  }

  /**
   * Create new order
   */
  async create(dto: CreateOrderDTO) {
    try {
      // Validasi order_id unik
      const existingOrder =
        await this.repository.findByOrderId(dto.order_id);
      if (existingOrder) {
        throw new Error(
          `Order dengan ID '${dto.order_id}' sudah ada`
        );
      }

      const newOrder = await this.repository.create({
        ...dto,
      });

      return newOrder;
    } catch (error: any) {
      throw new Error(
        `Gagal membuat order: ${error.message}`
      );
    }
  }

  /**
   * Update order
   */
  async update(id: string, dto: UpdateOrderDTO) {
    try {
      const order = await this.repository.findById(id);
      if (!order) {
        throw new Error(
          'Order tidak ditemukan untuk diperbarui'
        );
      }

      // Jika order_id diubah, validasi keunikan
      if (dto.order_id && dto.order_id !== order.order_id) {
        const existingOrder =
          await this.repository.findByOrderId(dto.order_id);
        if (existingOrder) {
          throw new Error(
            `Order dengan ID '${dto.order_id}' sudah ada`
          );
        }
      }

      // Hitung finalPrice untuk setiap variant jika ada
      const dataToUpdate = { ...dto };
      // if (dataToUpdate.variants) {
      //   dataToUpdate.variants = dataToUpdate.variants.map(
      //     (variant) => ({
      //       ...variant,
      //       finalPrice:
      //         variant.price -
      //         (variant.price * variant.discount) / 100,
      //     })
      //   );
      // }

      const updatedOrder = await this.repository.update(
        id,
        dataToUpdate
      );

      if (!updatedOrder) {
        throw new Error('Gagal memperbarui order');
      }

      return updatedOrder;
    } catch (error: any) {
      throw new Error(
        `Gagal memperbarui order: ${error.message}`
      );
    }
  }

  /**
   * Soft delete order
   */
  async remove(id: string) {
    try {
      const order = await this.repository.findById(id);
      if (!order) {
        throw new Error(
          'Order tidak ditemukan untuk dihapus'
        );
      }

      const deletedOrder =
        await this.repository.softDelete(id);

      if (!deletedOrder) {
        throw new Error('Gagal menghapus order');
      }

      return deletedOrder;
    } catch (error: any) {
      throw new Error(
        `Gagal menghapus order: ${error.message}`
      );
    }
  }

  /**
   * Restore soft-deleted order
   */
  async restore(id: string) {
    try {
      const order = await this.repository.findById(id);
      if (!order) {
        throw new Error('Order tidak ditemukan');
      }

      const restoredOrder =
        await this.repository.restore(id);

      if (!restoredOrder) {
        throw new Error('Gagal memulihkan order');
      }

      return restoredOrder;
    } catch (error: any) {
      throw new Error(
        `Gagal memulihkan order: ${error.message}`
      );
    }
  }

  /**
   * Get orders by platform
   */
  async getByPlatform(platform: string) {
    try {
      return await this.repository.findByPlatform(platform);
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil order dari platform: ${error.message}`
      );
    }
  }

  /**
   * Get active orders only
   */
  async getActive() {
    try {
      return await this.repository.findActive();
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil order aktif: ${error.message}`
      );
    }
  }

  /**
   * Search orders
   */
  async search(query: string) {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      return await this.repository.search(query);
    } catch (error: any) {
      throw new Error(
        `Gagal mencari order: ${error.message}`
      );
    }
  }

  /**
   * Bulk update order status
   */
  async bulkUpdateStatus(dto: BulkUpdateStatusDTO) {
    try {
      const result = await this.repository.bulkUpdateStatus(
        dto.order_ids,
        dto.is_active
      );

      if (result.modifiedCount === 0) {
        throw new Error(
          'Tidak ada order yang berhasil diperbarui'
        );
      }

      return {
        success: true,
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} order berhasil diperbarui`,
      };
    } catch (error: any) {
      throw new Error(
        `Gagal memperbarui status order: ${error.message}`
      );
    }
  }

  // /**
  //  * Mass upload shopee orders
  //  * @param fileBuffer
  //  * @returns
  //  */
  // async massUploadShopeeProducts(
  //   fileBuffer: ArrayBuffer
  // ): Promise<MassUploadResponseDTO> {
  //   try {
  //     const orders =
  //       await parseMassProductsExcel(fileBuffer);

  //     if (orders.length === 0) {
  //       throw new Error(
  //         'Tidak ada data order yang valid di file Excel.'
  //       );
  //     }

  //     const ordersMap = new Map<
  //       string,
  //       ParsedOrderRow[]
  //     >();
  //     for (const order of orders) {
  //       const orderId = String(order.orderId);

  //       if (!ordersMap.has(orderId)) {
  //         ordersMap.set(orderId, []);
  //       }
  //       ordersMap.get(orderId)!.push(order);
  //     }

  //     let createdCount = 0;
  //     let updatedCount = 0;

  //     for (const [
  //       orderId,
  //       group,
  //     ] of ordersMap.entries()) {
  //       const variants = group.map((item) => ({
  //         variant_id: item.variantId,
  //         name: item.variantName || item.orderName || '-',
  //         key: `${orderId}::${item.variantId || '-'}`,
  //         price: item.price,
  //         // quantity: item.quantity ?? 0,
  //         discount: 0,
  //         finalPrice: 0,
  //         parent_sku: item.parentSKU,
  //         sku: item.SKU,
  //         gtin: item.GTIN,
  //       }));
  //       const existingOrder =
  //         await this.repository.findByProductId(orderId);
  //       const payload = {
  //         platform: PLATFORMS_KV.shopee,
  //         name: group[0]?.orderName || '',
  //         order_id: orderId,
  //         key: orderId,
  //         variants,
  //         is_active: true,
  //       };
  //       if (existingOrder) {
  //         await this.repository.update(
  //           existingOrder._id.toString(),
  //           payload
  //         );
  //         updatedCount++;
  //       } else {
  //         await this.repository.create(payload);
  //         createdCount++;
  //       }
  //     }

  //     return {
  //       created_count: createdCount,
  //       updated_count: updatedCount,
  //       total_rows: orders.length,
  //       total_orders: ordersMap.size,
  //     };
  //   } catch (error: any) {
  //     throw new Error(
  //       `Gagal memproses mass upload order: ${error.message}`
  //     );
  //   }
  // }

  /**
   * Mass upload shopee orders
   * @param fileBuffer
   * @returns
   */
  async massUploadShopeeOrders(
    fileBuffer: ArrayBuffer
  ): Promise<MassUploadResponseDTO> {
    try {
      const orders = await parseMassOrdersExcel(fileBuffer);

      if (orders.length === 0) {
        throw new Error(
          'Tidak ada data order yang valid di file Excel.'
        );
      }

      const ordersMap = new Map<string, ParsedOrderRow[]>();
      const productNames = new Set<string>();
      for (const order of orders) {
        const orderId = String(order.orderId);

        if (!ordersMap.has(orderId)) {
          ordersMap.set(orderId, []);
        }
        ordersMap.get(orderId)!.push(order);
        productNames.add(String(order.productName));
      }

      const products =
        await this.productService.getProductsByNames([
          ...productNames,
        ]);

      let createdCount = 0;
      let updatedCount = 0;

      for (const [orderId, group] of ordersMap.entries()) {
        const order = group[0] || {};

        const orderItems = group.map((item) => ({
          // product: {
          //   type: Types.ObjectId,
          //   ref: 'Product',
          //   required: true,
          //   alias: 'productId',
          // },
          parent_sku: item.parentSku,
          sku_reference_number: item.skuReferenceNumber,
          product_name: item.productName,
          variation_name: item.variationName,
          // product_key: {
          //   type: String,
          //   alias: 'productKey',
          // },
          original_price: item.originalPrice,
          price_after_discount: item.priceAfterDiscount,
          quantity: item.quantity,
          returned_quantity: item.returnedQuantity,
          // cogs: {
          //   type: Number,
          // },
        }));

        const existingOrder =
          await this.repository.findByOrderId(orderId);

        const payload = {
          // organization: {
          //   type: Types.ObjectId,
          //   ref: 'Organization',
          //   required: true,
          //   alias: 'organizationId',
          // },
          // store: {
          //   type: Types.ObjectId,
          //   ref: 'Store',
          //   required: true,
          //   alias: 'storeId',
          // },
          platform: PLATFORMS_KV.shopee,
          order_id: orderId,
          status: order.orderStatus,
          cancellation_return_status:
            order.cancellationReturnStatus,
          username: order.buyerUsername,
          number_of_products_ordered:
            order.numberOfProductsOrdered,
          total_payment: order.totalPayment,
          payment_method: order.paymentMethod,
          paid_at: order.paymentTimeCompleted,
          order_subtotal: order.orderSubtotal,
          total_discount: order.totalDiscount,
          discount_from_seller: order.discountFromSeller,
          discount_from_shopee: order.discountFromShopee,
          voucher_borne_by_seller:
            order.voucherBorneBySeller,
          voucher_borne_by_shopee:
            order.voucherBorneByShopee,
          coin_cashback: order.coinCashback,
          bundle_deal: order.bundleDeal,
          bundle_deal_discount_from_shopee:
            order.bundleDealDiscountFromShopee,
          bundle_deal_discount_from_seller:
            order.bundleDealDiscountFromSeller,
          shopee_coin_offset: order.shopeeCoinOffset,
          credit_card_discount: order.creditCardDiscount,
          shipping_option: order.shippingOption,
          estimated_shipping_fee:
            order.estimatedShippingFee,
          shipping_fee_paid_by_buyer:
            order.shippingFeePaidByBuyer,
          estimated_shipping_fee_discount:
            order.estimatedShippingFeeDiscount,
          product_weight: order.productWeight,
          total_weight: order.totalWeight,
          receiver_name: order.receiverName,
          phone_number: order.phoneNumber,
          address: {
            street: order.deliveryAddress,
            city: order.cityRegency,
            province: order.province,
          },
          buyer_note: order.buyerNote,
          note: order.note,
          items: orderItems,
          // admin_fee: {
          //   type: Number,
          //   alias: 'adminFee',
          // },
          // order_process_fee: {
          //   type: Number,
          //   alias: 'orderProcessFee',
          // },
          // affiliate_fee: {
          //   type: Number,
          //   alias: 'affiliateFee',
          // },
          // campaign_fee: {
          //   type: Number,
          //   alias: 'campaignFee',
          // },
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
          shipping_arranged_at: order.shippingTimeArranged,
          order_created_at: order.orderCreationTime,
          // order_released_at: {
          //   type: Date,
          //   alias: 'orderReleasedAt',
          // },
          order_completed_at: order.orderCompletionTime,
          // deleted_at: {
          //   type: Date,
          //   alias: 'deletedAt',
          // },
        };

        if (existingOrder) {
          await this.repository.update(
            existingOrder._id.toString(),
            payload
          );
          updatedCount++;
        } else {
          await this.repository.create(payload);
          createdCount++;
        }
      }

      return {
        created_count: createdCount,
        updated_count: updatedCount,
        total_rows: orders.length,
        total_orders: ordersMap.size,
      };
    } catch (error: any) {
      throw new Error(
        `Gagal memproses mass upload order: ${error.message}`
      );
    }
  }

  /**
   * Enrich order data with released income data from shopee xlsx
   */
  async enrichWithReleasedIncome(fileBuffer: ArrayBuffer) {
    try {
      const { orders, productIds } =
        await parseReleasedIncomeExcel(fileBuffer);

      if ((orders || []).length === 0) {
        throw new Error(
          'Tidak ada data order yang valid di file Excel.'
        );
      }

      const products =
        await this.productService.getByMultipleIds(
          productIds
        );

      // console.log({ products });

      const temp = [];
      for (const order of orders) {
        // const orderId = order.orderId;
        // for (let j = 0; j < (order.items || []).length; j++)
        for (const item of order.items || []) {
          const items = [];
          const product = products.find(
            (p) => p.product_id === item.productId
          );
          if (product) {
            items.push({
              ...item,
              product,
              // product: product._id.toString(),
            });
          }

          temp.push({ ...order, items });
        }
      }

      // const operations = orders.map((item) => ({
      //   updateOne: {
      //     filter: { externalId: item.id },
      //     update: {
      //       $set: {
      //         // name: item.name,
      //         // updatedAt: new Date()
      //         fee: {
      //           admin_fee: item.adminFee,
      //           order_processing_fee:
      //             item.orderProcessingFee,
      //           affiliate_fee: item.amsCommissionFee,
      //           service_fee: item.serviceFee,
      //           shipping_saver_program_fee:
      //             item.shippingSaverProgramFee,
      //           transaction_fee: item.transactionFee,
      //           campaign_fee: item.campaignFee,
      //           auto_top_up_fee_from_income:
      //             item.autoTopUpFeeFromIncome,
      //           return_shipping_fee: item.returnShippingFee,
      //           return_to_sender_shipping_fee:
      //             item.returnToSenderShippingFee,
      //           shipping_fee_refund: item.shippingFeeRefund,
      //         },

      //         // admin_fee: item.adminFee,
      //         // order_process_fee: item.orderProcessingFee,
      //         // affiliate_fee: item.amsCommissionFee,
      //         // campaign_fee: item.campaignFee,
      //         // voucher_fee: {
      //         //   type: Number,
      //         //   alias: 'voucherFee',
      //         // },
      //         // shipping_fee: {
      //         //   type: Number,
      //         //   alias: 'shippingFee',
      //         // },
      //         // other_fee: {
      //         //   type: Number,
      //         //   alias: 'otherFee',
      //         // },
      //         // return_shipping_fee: {
      //         //   type: Number,
      //         //   alias: 'returnShippingFee',
      //         // },
      //         // released_amount: {
      //         //   type: Number,
      //         //   alias: 'releasedAmount',
      //         // },
      //         // net_amount: {
      //         //   type: Number,
      //         //   alias: 'netAmount',
      //         // },
      //       },
      //     },
      //     upsert: true,
      //   },
      // }));

      const result =
        await this.repository.enrichWithReleasedIncome(
          // operations
          temp
        );

      // const result = await MyModel.bulkWrite(operations);

      // if (orders.length === 0) {
      //   throw new Error(
      //     'Tidak ada data order yang valid di file Excel.'
      //   );
      // }

      // const ordersMap = new Map<string, ParsedOrderRow[]>();
      // const productNames = new Set<string>();
      // for (const order of orders) {
      //   const orderId = String(order.orderId);

      //   if (!ordersMap.has(orderId)) {
      //     ordersMap.set(orderId, []);
      //   }
      //   ordersMap.get(orderId)!.push(order);
      //   productNames.add(String(order.productName));
      // }

      // const products =
      //   await this.productService.getProductsByNames([
      //     ...productNames,
      //   ]);

      // let createdCount = 0;
      // let updatedCount = 0;

      // for (const [orderId, group] of ordersMap.entries()) {
      //   const order = group[0] || {};

      //   const orderItems = group.map((item) => ({
      //     // product: {
      //     //   type: Types.ObjectId,
      //     //   ref: 'Product',
      //     //   required: true,
      //     //   alias: 'productId',
      //     // },
      //     parent_sku: item.parentSku,
      //     sku_reference_number: item.skuReferenceNumber,
      //     product_name: item.productName,
      //     variation_name: item.variationName,
      //     // product_key: {
      //     //   type: String,
      //     //   alias: 'productKey',
      //     // },
      //     original_price: item.originalPrice,
      //     price_after_discount: item.priceAfterDiscount,
      //     quantity: item.quantity,
      //     returned_quantity: item.returnedQuantity,
      //     // cogs: {
      //     //   type: Number,
      //     // },
      //   }));

      //   const existingOrder =
      //     await this.repository.findByOrderId(orderId);

      //   const payload = {
      //     // organization: {
      //     //   type: Types.ObjectId,
      //     //   ref: 'Organization',
      //     //   required: true,
      //     //   alias: 'organizationId',
      //     // },
      //     // store: {
      //     //   type: Types.ObjectId,
      //     //   ref: 'Store',
      //     //   required: true,
      //     //   alias: 'storeId',
      //     // },
      //     platform: PLATFORMS_KV.shopee,
      //     order_id: orderId,
      //     status: order.orderStatus,
      //     cancellation_return_status:
      //       order.cancellationReturnStatus,
      //     username: order.buyerUsername,
      //     number_of_products_ordered:
      //       order.numberOfProductsOrdered,
      //     total_payment: order.totalPayment,
      //     payment_method: order.paymentMethod,
      //     paid_at: order.paymentTimeCompleted,
      //     order_subtotal: order.orderSubtotal,
      //     total_discount: order.totalDiscount,
      //     discount_from_seller: order.discountFromSeller,
      //     discount_from_shopee: order.discountFromShopee,
      //     voucher_borne_by_seller:
      //       order.voucherBorneBySeller,
      //     voucher_borne_by_shopee:
      //       order.voucherBorneByShopee,
      //     coin_cashback: order.coinCashback,
      //     bundle_deal: order.bundleDeal,
      //     bundle_deal_discount_from_shopee:
      //       order.bundleDealDiscountFromShopee,
      //     bundle_deal_discount_from_seller:
      //       order.bundleDealDiscountFromSeller,
      //     shopee_coin_offset: order.shopeeCoinOffset,
      //     credit_card_discount: order.creditCardDiscount,
      //     shipping_option: order.shippingOption,
      //     estimated_shipping_fee:
      //       order.estimatedShippingFee,
      //     shipping_fee_paid_by_buyer:
      //       order.shippingFeePaidByBuyer,
      //     estimated_shipping_fee_discount:
      //       order.estimatedShippingFeeDiscount,
      //     product_weight: order.productWeight,
      //     total_weight: order.totalWeight,
      //     receiver_name: order.receiverName,
      //     phone_number: order.phoneNumber,
      //     address: {
      //       street: order.deliveryAddress,
      //       city: order.cityRegency,
      //       province: order.province,
      //     },
      //     buyer_note: order.buyerNote,
      //     note: order.note,
      //     items: orderItems,
      //     // admin_fee: {
      //     //   type: Number,
      //     //   alias: 'adminFee',
      //     // },
      //     // order_process_fee: {
      //     //   type: Number,
      //     //   alias: 'orderProcessFee',
      //     // },
      //     // affiliate_fee: {
      //     //   type: Number,
      //     //   alias: 'affiliateFee',
      //     // },
      //     // campaign_fee: {
      //     //   type: Number,
      //     //   alias: 'campaignFee',
      //     // },
      //     // voucher_fee: {
      //     //   type: Number,
      //     //   alias: 'voucherFee',
      //     // },
      //     // shipping_fee: {
      //     //   type: Number,
      //     //   alias: 'shippingFee',
      //     // },
      //     // other_fee: {
      //     //   type: Number,
      //     //   alias: 'otherFee',
      //     // },
      //     // return_shipping_fee: {
      //     //   type: Number,
      //     //   alias: 'returnShippingFee',
      //     // },
      //     // released_amount: {
      //     //   type: Number,
      //     //   alias: 'releasedAmount',
      //     // },
      //     // net_amount: {
      //     //   type: Number,
      //     //   alias: 'netAmount',
      //     // },
      //     shipping_arranged_at: order.shippingTimeArranged,
      //     order_created_at: order.orderCreationTime,
      //     // order_released_at: {
      //     //   type: Date,
      //     //   alias: 'orderReleasedAt',
      //     // },
      //     order_completed_at: order.orderCompletionTime,
      //     // deleted_at: {
      //     //   type: Date,
      //     //   alias: 'deletedAt',
      //     // },
      //   };

      //   if (existingOrder) {
      //     await this.repository.update(
      //       existingOrder._id.toString(),
      //       payload
      //     );
      //     updatedCount++;
      //   } else {
      //     await this.repository.create(payload);
      //     createdCount++;
      //   }
      // }

      return result;
    } catch (error: any) {
      throw new Error(
        `Gagal memproses enrich order data: ${error.message}`
      );
    }
  }

  /**
   * Count orders by platform
   */
  async countByPlatform(platform: string) {
    try {
      return await this.repository.countByPlatform(
        platform
      );
    } catch (error: any) {
      throw new Error(
        `Gagal menghitung order: ${error.message}`
      );
    }
  }
}
