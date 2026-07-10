/**
 * Order Service
 * Handles business logic for order operations
 */

import Fuse from 'fuse.js';
import { OrderRepository } from './order.repository';
import {
  CreateOrderDTO,
  UpdateOrderDTO,
  OrderFilterDTO,
  BulkUpdateStatusDTO,
  MassUploadResponseDTO,
} from './order.dto';
import {
  shopeeV1OrderCompletedParser,
  ParsedOrderRow,
} from '@/lib/xlsx/shopee/v1/order/completed';
import {
  shopeeV1AllOrderParser,
  type ParsedAllOrderRow,
} from '@/lib/xlsx/shopee/v1/order/all';
import parseReleasedIncomeExcel from '@/lib/xlsx/shopee/v1/order/released-funds';
import { ProductService } from '../products/product.service';
import {
  ORDER_PLATFORMS,
  OrderPlatform,
} from '@/constant/order-platform';
import { SHOPEE_ORDER_STATUS } from '@/constant/order/shopee/status';

// import { saveJson } from '@/lib/file/save-json';
import { AnyBulkWriteOperation } from 'mongoose';
import { TOrder } from './order.model';

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
   * HELPERS
   */

  private getCancelledBy(text: string) {
    if (text.includes('Dibatalkan oleh Pembeli')) {
      return 'buyer';
    } else if (
      text.includes(
        'Dibatalkan secara otomatis oleh sistem Shopee'
      )
    ) {
      return 'system';
    } else if (
      text.includes('Dibatalkan') &&
      text.toLowerCase().includes('penjual')
    ) {
      return 'seller';
    } else if (text.includes('Dibatalkan')) {
      return 'unknown';
    } else {
      return null;
    }
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
      const queryFilter: any = {
        // ...filter,
        deleted_at: null,
      };

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

      // if (filter.sort) {
      //   // queryFilter.sort = (filter.sort.slice(',').)
      //   queryFilter.sort = filter.sort;
      // }

      return await this.repository.findWithPagination(
        filter.page || 1,
        filter.limit || 10,
        queryFilter,
        filter.sort,
        filter.populate
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
  async getById(id: string, populate?: string) {
    try {
      const order = await this.repository.findById(
        id,
        populate
      );
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
   * Get order by order_id (unique identifier from marketplace platform)
   */
  async getByOrderId(orderId: string, populate?: string) {
    try {
      const order = await this.repository.findByOrderId(
        orderId,
        populate
      );
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
  async getByPlatform(platform: OrderPlatform) {
    try {
      return await this.repository.findByPlatform(platform);
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil order dari platform: ${error.message}`
      );
    }
  }

  /**
   * Count orders by platform
   */
  async countByPlatform(platform: OrderPlatform) {
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

  /**
   * Mass upload all order from shopee
   * @param fileBuffer
   * @returns
   */
  async massUploadAllOrderShopeeV1(
    fileBuffer: ArrayBuffer
  ): Promise<MassUploadResponseDTO> {
    try {
      const orders =
        await shopeeV1AllOrderParser(fileBuffer);

      if (orders.length === 0) {
        throw new Error(
          'Tidak ada data order yang valid di file Excel.'
        );
      }

      const ordersMap = new Map<
        string,
        ParsedAllOrderRow[]
      >();
      const productNames = new Set<string>();
      for (const order of orders) {
        const orderId = String(order.id);
        const productName = String(order.productName);

        if (!ordersMap.has(orderId)) {
          ordersMap.set(orderId, []);
        }
        ordersMap.get(orderId)!.push(order);
        productNames.add(productName);
      }

      const products =
        await this.productService.getProductsByNames([
          ...productNames,
        ]);

      let createdCount = 0;
      let updatedCount = 0;
      for (const [orderId, group] of ordersMap.entries()) {
        const order = group[0] || {};

        const orderItems = group.map((item) => {
          const productName = (
            String(item.productName) || ''
          ).trim();
          const originalPrice = item.originalPrice
            ? Number(item.originalPrice)
            : 0;
          const priceAfterDiscount = item.priceAfterDiscount
            ? Number(item.priceAfterDiscount)
            : 0;
          const discount =
            (priceAfterDiscount / originalPrice) * 100;

          let product;
          if (productName !== '') {
            const fuseResult = new Fuse(products, {
              keys: ['name'],
              includeScore: true,
            }).search(productName);

            if (fuseResult.length > 0) {
              product = fuseResult[0].item;
            } else {
              console.warn(
                `[OrderService.massUploadAllOrderShopeeV1] fuse result for ${productName} not found`
              );
            }
          } else {
            console.warn(
              `[OrderService.massUploadAllOrderShopeeV1] fuse search cancelled, productName is empty`
            );
          }

          const variantCost = (
            product?.variants || []
          ).find((v) => v.name === productName);
          const productCost =
            product?.variants?.length === 1
              ? product?.variants[0]?.default_cost || 0
              : variantCost?.default_cost || 0;
          const quantity = item?.quantity
            ? Number(item.quantity)
            : 1;
          const returnedQuantity = item?.returnedQuantity
            ? Number(item.returnedQuantity)
            : 0;
          // add new field in model: final_quantity
          const finalQuantity = quantity - returnedQuantity;

          return {
            product: product?._id,
            product_cost: productCost * finalQuantity,
            parent_sku: item.parentSku,
            sku_reference_number: item.skuReferenceNumber,
            product_name: item.productName,
            variation_name: item.variationName,
            original_price: originalPrice,
            discount: discount,
            price_after_discount: priceAfterDiscount,
            quantity: quantity,
            subtotal: item.orderSubtotal,
            returned_quantity: item.returnedQuantity,
          };
        });

        const existingOrder =
          await this.repository.findByOrderId(orderId);

        const orderSubtotal = orderItems.reduce(
          (acc: number, curr) => {
            return acc + Number(curr.subtotal);
          },
          0
        );

        const payload = {
          platform: ORDER_PLATFORMS.shopee.value,
          order_id: orderId,
          status:
            Object.values(SHOPEE_ORDER_STATUS).find(
              (s: { label: string }) =>
                s.label === order.status
            )?.value ?? null,
          cancelled_by: this.getCancelledBy(
            String(order.cancellationReason)
          ),
          cancellation_reason: order.cancellationReason,
          cancellation_return_status:
            order.cancellationReturnStatus,
          username: order.buyerUsername,
          number_of_products_ordered:
            order.numberOfProductsOrdered,
          total_payment: order.totalPayment,
          payment_method: order.paymentMethod,
          paid_at: order.paymentTimeCompleted,
          order_subtotal: orderSubtotal,
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
          estimated_shipping_cost:
            order.estimatedShippingCosts,
          shipping_cost_paid_by_buyer:
            order.shippingCostPaidByBuyer,
          estimated_shipping_cost_discount:
            order.estimatedShippingCostDiscount,
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
          placed_at: order.orderCreationTime,
          // released_funds_at: {
          //   type: Date,
          //   alias: 'releasedFundDate',
          // },
          completed_at: order.orderCompletionTime,
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
   * Mass upload enriched data from shopee order completed
   * @param fileBuffer
   * @returns
   */
  async massUploadEnrichWithOrderCompletedShopeeV1(
    fileBuffer: ArrayBuffer
  ): Promise<MassUploadResponseDTO> {
    try {
      const orders =
        await shopeeV1OrderCompletedParser(fileBuffer);

      if (orders.length === 0) {
        throw new Error(
          'Tidak ada data order yang valid di file Excel.'
        );
      }

      const ordersMap = new Map<string, ParsedOrderRow[]>();
      // const productNames = new Set<string>();
      for (const order of orders) {
        const orderId = String(order.orderId);

        if (!ordersMap.has(orderId)) {
          ordersMap.set(orderId, []);
        }
        ordersMap.get(orderId)!.push(order);
        // productNames.add(String(order.productName));
      }

      let createdCount = 0;
      let updatedCount = 0;
      for (const [orderId, group] of ordersMap.entries()) {
        const order = group[0] || {};

        const orderItems = group.map((item) => {
          // const product = products.find((p: { variants: [] }) => p.variants.find((variant)))
          // const product = products.find((prd) => prd.product_id === order.product)

          const originalPrice = item.originalPrice
            ? Number(item.originalPrice)
            : 0;
          const priceAfterDiscount = item.priceAfterDiscount
            ? Number(item.priceAfterDiscount)
            : 0;
          const discount =
            (priceAfterDiscount / originalPrice) * 100;

          return {
            // Don't update product and product_cost?
            parent_sku: item.parentSku,
            sku_reference_number: item.skuReferenceNumber,
            product_name: item.productName,
            variation_name: item.variationName,
            original_price: originalPrice,
            discount: discount,
            price_after_discount: priceAfterDiscount,
            quantity: item.quantity,
            subtotal: item.orderSubtotal,
            returned_quantity: item.returnedQuantity,
          };
        });

        const existingOrder =
          await this.repository.findByOrderId(orderId);

        const orderSubtotal = orderItems.reduce(
          (acc: number, curr) => {
            return acc + Number(curr.subtotal);
          },
          0
        );

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
          platform: ORDER_PLATFORMS.shopee.value,
          order_id: orderId,
          status:
            Object.values(SHOPEE_ORDER_STATUS).find(
              (s: { label: string }) =>
                s.label === order.orderStatus
            )?.value ?? null,

          cancellation_return_status:
            order.cancellationReturnStatus,
          username: order.buyerUsername,
          number_of_products_ordered:
            order.numberOfProductsOrdered,
          total_payment: order.totalPayment,
          payment_method: order.paymentMethod,
          paid_at: order.paymentTimeCompleted,
          order_subtotal: orderSubtotal,
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
          estimated_shipping_cost:
            order.estimatedShippingCost,
          shipping_cost_paid_by_buyer:
            order.shippingCostPaidByBuyer,
          estimated_shipping_cost_discount:
            order.estimatedShippingCostDiscount,
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
          placed_at: order.orderCreationTime,
          // released_funds_at: {
          //   type: Date,
          //   alias: 'releasedFundDate',
          // },
          completed_at: order.orderCompletionTime,
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
  async enrichWithReleasedFunds(fileBuffer: ArrayBuffer) {
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

      const operations: AnyBulkWriteOperation<TOrder>[] =
        [];
      for await (const order of orders) {
        // console.log(
        //   `[OrderService.enrichWithReleasedFunds] Order ID: ${order.orderId} not found`,
        //   JSON.stringify(order, null, 2)
        // );
        const orderObj =
          await this.repository.findByOrderId(
            order.orderId
          );

        if (!orderObj) {
          console.warn(
            `[OrderService.enrichWithReleasedFunds] Order ID: ${order.orderId} not found`
          );
          continue;
        }

        const orderObjItems = orderObj?.items || [];
        const $set: Record<string, any> = {};
        const items = [];
        let totalProductCost = 0;

        for (let i = 0; i < orderObjItems.length; i++) {
          const orderObjItem = orderObjItems[i];
          const productName = (
            orderObjItem.product_name || ''
          ).trim();

          // let item: { productId: string, orderProcessingFee: number};
          // let item: Record<string, string | number>;
          type ItemFromExcel = {
            number: number;
            rowType: string;
            orderId: string;
            productId: string;
            productName: string;
            orderProcessingFee: number;
          };
          let item: ItemFromExcel | undefined;
          if (productName !== '') {
            const fuseResult = new Fuse(order.items, {
              keys: ['productName'],
              includeScore: true,
            }).search(productName);

            if (fuseResult.length > 0) {
              item = fuseResult[0].item as ItemFromExcel;
            } else {
              console.warn(
                `[OrderService.enrichWithReleasedFunds] fuse result for ${productName} not found`
              );
            }
          } else {
            console.warn(
              `[OrderService.enrichWithReleasedFunds] fuse search cancelled, orderObjItem.productName is empty`
            );
          }

          const product = products.find(
            (p) => p.product_id === item?.productId
          );

          // if (order.orderId === '2606142928J5U4') {
          //   saveJson(
          //     `.data/json-logs/debug-${order.orderId}.json`,
          //     { item, orderObjItem, product }
          //   );
          // }

          // if (order.orderId === '260623TTEVN47Y') {
          //   saveJson(
          //     `.data/json-logs/debug-${order.orderId}.json`,
          //     { item, orderObjItem, product }
          //   );
          // }

          const name =
            orderObjItem?.variation_name ||
            orderObjItem?.product_name;
          const variantCost = (
            product?.variants || []
          ).find((v) => v.name === name);
          const productCost =
            product?.variants?.length === 1
              ? product?.variants[0]?.default_cost || 0
              : variantCost?.default_cost || 0;

          orderObjItem.product = product?._id;
          orderObjItem.product_cost =
            productCost * (orderObjItem?.quantity || 1);
          orderObjItem.profit =
            (orderObjItem?.price_after_discount || 0) -
            productCost; // price_after_discount not included fees, remove?
          // orderObjItem.product_cost =
          //   defaultCost?.default_cost || 0;
          orderObjItem.processing_fee =
            item?.orderProcessingFee || 0;
          // orderObjItem.product_cost = product // find correct variant and get default_cost

          totalProductCost =
            totalProductCost + orderObjItem.product_cost;

          items.push(orderObjItem);
        }

        $set.items = items;
        $set.fee = {
          admin_fee: order.adminFee,
          processing_fee: order.orderProcessingFee,
          affiliate_fee: order.amsCommissionFee,
          service_fee: order.serviceFee,
          shipping_saver_program_fee:
            order.shippingSaverProgramFee,
          transaction_fee: order.transactionFee,
          campaign_fee: order.campaignFee,
          auto_top_up_fee_from_income:
            order.autoTopUpFeeFromIncome,
          return_shipping_fee: order.returnShippingFee,
          return_to_sender_shipping_fee:
            order.returnToSenderShippingFee,
          shipping_fee_refund: order.shippingFeeRefund,
        };
        $set.released_amount = order.totalIncome || 0;
        $set.shipping_cost_paid_by_buyer =
          order.shippingCostPaidByBuyer || 0;
        $set.shipping_cost_discount_by_logistics =
          order.shippingCostDiscountByLogistics || 0;
        $set.shipping_cost_forwarded_by_shopee =
          order.shippingCostForwardedByShopee || 0;
        $set.free_shipping_promo_from_seller =
          order.freeShippingPromoFromSeller || 0;
        $set.compensation = order.compensation || 0;
        $set.voucher_code = order.voucherCode || null;
        $set.total_product_cost = totalProductCost || 0;
        $set.total_profit =
          $set.released_amount - $set.total_product_cost;
        $set.enriched_at = new Date().toISOString();

        // console.log(JSON.stringify($set, null, 2));

        operations.push({
          updateOne: {
            filter: { order_id: order.orderId },
            update: { $set },
            upsert: true,
          },
        });

        totalProductCost = 0;
      }

      const result =
        await this.repository.bulkWrite(operations);

      return result;
    } catch (error: any) {
      throw new Error(
        `Gagal melengkapi data order: ${error.message}`
      );
    }
  }
}
