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
import { shopeeV2OrderCompletedParser } from '@/lib/xlsx/shopee/v2/order/completed';
import { shopeeV2AllOrderParser } from '@/lib/xlsx/shopee/v2/order/all';
import releasedFundsV1parser from '@/lib/xlsx/shopee/v1/order/released-funds';
import releasedFundsV2parser from '@/lib/xlsx/shopee/v2/order/released-funds';
import { ProductService } from '../products/product.service';
import { StoreService } from '@/modules/stores/store.service';
import {
  ORDER_PLATFORMS,
  OrderPlatform,
} from '@/constant/order-platform';
import { SHOPEE_ORDER_STATUS } from '@/constant/order/shopee/status';

// import { saveJson } from '@/lib/file/save-json';
import { AnyBulkWriteOperation } from 'mongoose';
import { TOrder } from './order.model';
import { parseToISOStringWithTimezone } from '@/lib/utils/date';
import {
  getReleasedFunds,
  getReleasedFundsVersion,
} from '@/lib/xlsx/shopee/order/released-funds';
import { saveJson } from '@/lib/file/save-json';

export class OrderService {
  private tenantContext;
  private repository: OrderRepository;
  private productService: ProductService;
  private storeService: StoreService;

  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
    userId?: string;
  }) {
    this.tenantContext = tenantContext;
    this.repository = new OrderRepository(tenantContext);
    this.productService = new ProductService(tenantContext);
    this.storeService = new StoreService(tenantContext);
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

  private calculateOrderItemFinancials(args: {
    priceAfterDiscount?: number;
    quantity?: number;
    returnedQuantity?: number;
    subtotal?: number;
    productCostUnit?: number;
    processingFee?: number;
  }) {
    const quantity = Number(args.quantity || 0);
    const returnedQuantity = Number(
      args.returnedQuantity || 0
    );
    const finalQuantity = Math.max(
      quantity - returnedQuantity,
      0
    );
    const priceAfterDiscount = Number(
      args.priceAfterDiscount || 0
    );
    const grossSales =
      Number(args.subtotal || 0) ||
      priceAfterDiscount * quantity;
    const productCost = Number(args.productCostUnit || 0);
    const totalProductCost = productCost * finalQuantity;
    const grossProfit = grossSales - totalProductCost;
    const netSales = grossSales;
    const netProfit = grossProfit;

    return {
      product_cost: productCost,
      total_product_cost: totalProductCost,
      gross_sales: grossSales,
      net_sales: netSales,
      gross_profit: grossProfit,
      net_profit: netProfit,
      profit:
        finalQuantity > 0 ? netProfit / finalQuantity : 0,
    };
  }

  private getBuyerUsername(order: Record<string, any>) {
    return order.buyerUsername || order.username || '';
  }

  private toNumber(value: unknown) {
    return typeof value === 'number' &&
      Number.isFinite(value)
      ? value
      : Number(value || 0) || 0;
  }

  private calculateReleasedFundsAmount(
    order: Record<string, any>
  ) {
    const explicitAmount =
      order.releasedFundsAmount ?? order.totalIncome;

    if (
      explicitAmount !== undefined &&
      explicitAmount !== null &&
      this.toNumber(explicitAmount) !== 0
    ) {
      return this.toNumber(explicitAmount);
    }

    const productIncome =
      order.productPrice ?? order.originalProductPrice ?? 0;

    return [
      productIncome,
      order.totalProductDiscount,
      order.refundToBuyer,
      order.refundToBuyerAmount,
      order.buyerRefund,
      order.buyerRefundAmount,
      order.shippingCostPaidByBuyer,
      order.shippingCostPaidToLogistics,
      order.shippingCostDiscountFromLogistics,
      order.shippingCostDiscountByLogistics,
      order.freeShippingFromShopee,
      order.shippingCostForwardedByShopee,
      order.returnShippingFee,
      order.returnToSellerFee,
      order.returnToSenderShippingFee,
      order.shippingFeeRefund,
      order.sellerSponsoredVoucher,
      order.sellerSponsoredCoinCashback,
      order.productDiscountFromShopee,
      order.sellerSponsoredCoFundVoucher,
      order.sellerSponsoredCoFundCoinCashback,
      order.adminFee,
      order.orderProcessingFee,
      order.GOXFee,
      order.shippingSaverProgramFee,
      order.AMSServiceFee,
      order.serviceFee,
      order.campaignFee,
      order.AMSCommissionFee,
      order.amsCommissionFee,
      order.autoTopUpFeeFromIncome,
      order.otherFee,
      order.premium,
      order.transactionFee,
      order.fbsFee,
      order.taxPPH22,
      order.importDutyVatIncomeTax,
      order.compensation,
      order.freeShippingPromoFromSeller,
      order.proRatedRedeemedCoinForReturn,
      order.proRatedShopeeVoucherForReturn,
      order.proRatedBankPaymentPromotionForReturn,
      order.proRatedShopeePaymentPromotionForReturn,
    ].reduce((sum, value) => sum + this.toNumber(value), 0);
  }

  private hasReleasedFundsComponents(
    order: Record<string, any>
  ) {
    return [
      order.releasedFundsAmount,
      order.totalIncome,
      order.productPrice,
      order.originalProductPrice,
    ].some((value) => this.toNumber(value) !== 0);
  }

  private applyReleasedFundsFinancialsToItems(
    items: Record<string, any>[],
    releasedFundsAmount: number
  ): Record<string, any>[] {
    const totalGrossSales = items.reduce(
      (sum, item) => sum + this.toNumber(item.gross_sales),
      0
    );

    return items.map((item) => {
      const itemReleasedFunds =
        this.hasReleasedFundsComponents(item) ||
        totalGrossSales === 0
          ? this.calculateReleasedFundsAmount(item)
          : Math.round(
              (releasedFundsAmount *
                this.toNumber(item.gross_sales)) /
                totalGrossSales
            );
      const totalProductCost = this.toNumber(
        item.total_product_cost
      );
      const finalQuantity = Math.max(
        this.toNumber(item.quantity) -
          this.toNumber(item.returned_quantity),
        0
      );
      const netProfit =
        itemReleasedFunds - totalProductCost;

      return {
        ...item,
        net_sales: itemReleasedFunds,
        net_profit: netProfit,
        profit:
          finalQuantity > 0 ? netProfit / finalQuantity : 0,
      };
    });
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
   * Overwrite order
   */
  async overwrite(id: string, dto: UpdateOrderDTO) {
    try {
      // console.log(
      //   `overwrite: ${id}`,
      //   JSON.stringify(dto, null, 2)
      // );

      const data = { ...dto };
      data.items = (data?.items || []).map((item) => {
        const productCost = item.product_cost || 0;
        const financials =
          this.calculateOrderItemFinancials({
            priceAfterDiscount:
              item?.price_after_discount || 0,
            quantity: item.quantity || 0,
            returnedQuantity: item.returned_quantity || 0,
            subtotal: item.subtotal || 0,
            productCostUnit: productCost,
            processingFee: item.processing_fee || 0,
          });

        return {
          ...item,
          ...financials,
        };
      });
      data.total_product_cost = data.items.reduce(
        (acc, item) => acc + (item.total_product_cost || 0),
        0
      );
      data.total_gross_sales = data.items.reduce(
        (acc, item) => acc + (item.gross_sales || 0),
        0
      );
      data.total_net_sales = data.items.reduce(
        (acc, item) => acc + (item.net_sales || 0),
        0
      );
      data.total_gross_profit = data.items.reduce(
        (acc, item) => acc + (item.gross_profit || 0),
        0
      );
      data.total_net_profit = data.items.reduce(
        (acc, item) => acc + (item.net_profit || 0),
        0
      );
      // data.total_profit = data.total_net_profit;
      // data.total_net_profit = data.total_profit;

      const updatedOrder = await this.repository.overwrite(
        id,
        data
      );

      if (!updatedOrder) {
        throw new Error('Gagal memperbarui order');
      }

      return updatedOrder;

      // return true;
    } catch (error: any) {
      console.error(
        `[OrderService.overwrite] error: `,
        error
      );
      throw new Error(
        `Gagal memperbarui order: ${error.message}`
      );
    }

    // try {
    //   const order = await this.repository.findById(id);
    //   if (!order) {
    //     throw new Error(
    //       'Order tidak ditemukan untuk diperbarui'
    //     );
    //   }

    //   // Jika order_id diubah, validasi keunikan
    //   if (dto.order_id && dto.order_id !== order.order_id) {
    //     const existingOrder =
    //       await this.repository.findByOrderId(dto.order_id);
    //     if (existingOrder) {
    //       throw new Error(
    //         `Order dengan ID '${dto.order_id}' sudah ada`
    //       );
    //     }
    //   }

    //   // Hitung finalPrice untuk setiap variant jika ada
    //   const dataToUpdate = { ...dto };
    //   // if (dataToUpdate.variants) {
    //   //   dataToUpdate.variants = dataToUpdate.variants.map(
    //   //     (variant) => ({
    //   //       ...variant,
    //   //       finalPrice:
    //   //         variant.price -
    //   //         (variant.price * variant.discount) / 100,
    //   //     })
    //   //   );
    //   // }

    //   const updatedOrder = await this.repository.update(
    //     id,
    //     dataToUpdate
    //   );

    //   if (!updatedOrder) {
    //     throw new Error('Gagal memperbarui order');
    //   }

    //   return updatedOrder;
    // } catch (error: any) {
    //   throw new Error(
    //     `Gagal memperbarui order: ${error.message}`
    //   );
    // }
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
      let orders: any[];
      try {
        orders = await shopeeV2AllOrderParser(fileBuffer);
      } catch {
        orders = await shopeeV1AllOrderParser(fileBuffer);
      }

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

      // console.log('productNames', productNames);

      const products =
        await this.productService.getProductsByNames([
          ...productNames,
        ]);

      // saveJson('.data/json-logs/all-order-products.json', {
      //   productNames,
      //   products,
      // });

      let createdCount = 0;
      let updatedCount = 0;
      for (const [orderId, group] of ordersMap.entries()) {
        const order = group[0] || {};

        // console.log(
        //   `${order.id} - products`,
        //   JSON.stringify(products, null, 2)
        // );
        // console.log(JSON.stringify(order, null, 2));
        // console.log(
        //   `Place at: ${parseToISOStringWithTimezone(
        //     order.orderCreationTime,
        //     timezone
        //   )}`
        // );

        const orderItems = group.map((item) => {
          const productName = (
            String(item.productName) || ''
          ).trim();
          const variantName = (
            String(item.variationName) || ''
          ).trim();
          const originalPrice = item.originalPrice
            ? Number(item.originalPrice)
            : 0;
          const priceAfterDiscount = item.priceAfterDiscount
            ? Number(item.priceAfterDiscount)
            : 0;
          // prettier-ignore
          const discountPercentage =
            originalPrice > 0
              ? ((originalPrice - priceAfterDiscount) /
                  originalPrice) *
                100
              : 0;

          // console.log(
          //   `[${order.id}] Discount: ${discount}`
          // );

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

          const variant = (product?.variants || []).find(
            (v) =>
              v.name === variantName ||
              v.name === productName
          );

          if (!variant) {
            console.warn(
              `[OrderService.massUploadAllOrderShopeeV1] Variant name: ${variantName} or Product Name ${productName} not found`
            );
          }

          // console.log(
          //   `[OrderService.massUploadAllOrderShopeeV1] ${order.id} variant`,
          //   JSON.stringify(variant, null, 2)
          // );
          const productCost =
            product?.variants?.length === 1
              ? product?.variants[0]?.default_cost || 0
              : variant?.default_cost || 0;

          // console.log({
          //   variant,
          //   productCost,
          //   variants: product?.variants,
          //   product,
          // });
          const quantity = item?.quantity
            ? Number(item.quantity)
            : 1;
          const returnedQuantity = item?.returnedQuantity
            ? Number(item.returnedQuantity)
            : 0;
          // add new field in model: final_quantity
          const financials =
            this.calculateOrderItemFinancials({
              priceAfterDiscount,
              quantity,
              returnedQuantity,
              subtotal: Number(item.orderSubtotal || 0),
              productCostUnit: productCost,
            });

          return {
            product: product?._id,
            // prettier-ignore
            // estimated_profit: (Number(item.orderSubtotal) - totalProductCost),
            parent_sku: item.parentSku,
            child_sku: item.skuReferenceNumber,
            product_id: product?.product_id,
            product_name: item.productName,
            variation_id: variant?.variant_id,
            variation_name: item.variationName,
            original_price: originalPrice,
            discount_percentage: discountPercentage,
            price_after_discount: priceAfterDiscount,
            quantity: quantity,
            subtotal: item.orderSubtotal,
            returned_quantity: item.returnedQuantity,
            ...financials,
          };
        });

        const orderSubtotal = orderItems.reduce(
          (acc: number, curr) => {
            return acc + Number(curr.subtotal);
          },
          0
        );
        const totalProductCost = orderItems.reduce(
          (acc, item) =>
            acc + (item.total_product_cost || 0),
          0
        );
        const totalGrossSales = orderItems.reduce(
          (acc, item) => acc + (item.gross_sales || 0),
          0
        );
        const totalNetSales = orderItems.reduce(
          (acc, item) => acc + (item.net_sales || 0),
          0
        );
        const totalGrossProfit = orderItems.reduce(
          (acc, item) => acc + (item.gross_profit || 0),
          0
        );
        const totalNetProfit = orderItems.reduce(
          (acc, item) => acc + (item.net_profit || 0),
          0
        );

        // const totalFee = Object.values()

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
          username: this.getBuyerUsername(order),
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
          // released_funds: {
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
          total_product_cost: totalProductCost,
          // estimated_total_profit: orderItems.reduce(
          //   (acc, n) => acc + n.estimated_profit,
          //   0
          // ),
          total_gross_sales: totalGrossSales,
          total_net_sales: totalNetSales,
          total_gross_profit: totalGrossProfit,
          // total_profit: totalNetProfit,
          total_net_profit: totalNetProfit,
          enrichments: [],
          other_variable_cost: [],
        };

        const existingOrder =
          await this.repository.findByOrderId(orderId);

        if (!existingOrder) {
          await this.repository.create(payload);
          createdCount++;
        }

        // if (existingOrder) {
        //   await this.repository.update(
        //     existingOrder._id.toString(),
        //     payload
        //   );
        //   updatedCount++;
        // } else {
        //   await this.repository.create(payload);
        //   createdCount++;
        // }
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
    fileBuffer: ArrayBuffer,
    fileId: string
  ): Promise<MassUploadResponseDTO> {
    try {
      let orders: any[];
      try {
        orders =
          await shopeeV2OrderCompletedParser(fileBuffer);
      } catch {
        orders =
          await shopeeV1OrderCompletedParser(fileBuffer);
      }

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
        const existingOrder =
          await this.repository.findByOrderId(orderId);
        const existingItems = existingOrder?.items || [];

        const orderItems = group.map((item, index) => {
          // const product = products.find((p: { variants: [] }) => p.variants.find((variant)))
          // const product = products.find((prd) => prd.product_id === order.product)
          const existingItem = existingItems[index];

          const originalPrice = item.originalPrice
            ? Number(item.originalPrice)
            : 0;
          const priceAfterDiscount = item.priceAfterDiscount
            ? Number(item.priceAfterDiscount)
            : 0;
          // prettier-ignore
          const discount =
            originalPrice > 0
              ? ((originalPrice - priceAfterDiscount) /
                  originalPrice) *
                100
              : 0;
          const quantity = item.quantity
            ? Number(item.quantity)
            : existingItem?.quantity || 0;
          const returnedQuantity = item.returnedQuantity
            ? Number(item.returnedQuantity)
            : existingItem?.returned_quantity || 0;
          const financials =
            this.calculateOrderItemFinancials({
              priceAfterDiscount,
              quantity,
              returnedQuantity,
              subtotal: Number(item.orderSubtotal || 0),
              productCostUnit:
                existingItem?.product_cost || 0,
              processingFee:
                existingItem?.processing_fee || 0,
            });

          return {
            ...existingItem,
            // Don't update product and product_cost?
            parent_sku: item.parentSku,
            child_sku: item.skuReferenceNumber,
            product_name: item.productName,
            // variation_id: variant?.variant_id,
            variation_name: item.variationName,
            original_price: originalPrice,
            discount_percentage: discount,
            price_after_discount: priceAfterDiscount,
            quantity,
            subtotal: item.orderSubtotal,
            returned_quantity: returnedQuantity,
            ...financials,
          };
        });

        const orderSubtotal = orderItems.reduce(
          (acc: number, curr) => {
            return acc + Number(curr.subtotal);
          },
          0
        );
        const totalProductCost = orderItems.reduce(
          (acc, item) =>
            acc + (item.total_product_cost || 0),
          0
        );
        const totalGrossSales = orderItems.reduce(
          (acc, item) => acc + (item.gross_sales || 0),
          0
        );
        const totalNetSales = orderItems.reduce(
          (acc, item) => acc + (item.net_sales || 0),
          0
        );
        const totalGrossProfit = orderItems.reduce(
          (acc, item) => acc + (item.gross_profit || 0),
          0
        );
        const totalNetProfit = orderItems.reduce(
          (acc, item) => acc + (item.net_profit || 0),
          0
        );

        // const enrichment = {
        //   type: 'completed',
        //   file: fileId,
        //   enriched_by: this.tenantContext.userId,
        //   enriched_at: new Date(),
        // };

        const enrichments =
          existingOrder?.enrichments || [];
        enrichments.push({
          kind: 'completed',
          file: fileId,
          enriched_by: this.tenantContext.userId,
          enriched_at: new Date(),
        });

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
          username: this.getBuyerUsername(order),
          number_of_products_ordered:
            order.numberOfProductsOrdered,
          total_payment: order.totalPayment,
          payment_method: order.paymentMethod,
          paid_at: order.paymentTimeCompleted,
          order_subtotal: orderSubtotal,
          total_product_cost: totalProductCost,
          total_gross_sales: totalGrossSales,
          total_net_sales: totalNetSales,
          total_gross_profit: totalGrossProfit,
          // total_profit: totalNetProfit,
          total_net_profit: totalNetProfit,
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
          // released_funds: {
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
          enrichments: enrichments,
          // deleted_at: {
          //   type: Date,
          //   alias: 'deletedAt',
          // },
        };

        // if (!existingOrder) {
        //   await this.repository.create(payload);
        //   createdCount++;
        // }

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
  async enrichWithReleasedFunds(
    fileBuffer: ArrayBuffer,
    fileId: string
  ) {
    const v1 = async (ab: ArrayBuffer) => {
      try {
        const { orders, productIds } =
          await releasedFundsV1parser(ab);

        if ((orders || []).length === 0) {
          // throw new Error(
          //   'Tidak ada data order yang valid di file Excel.'
          // );
          console.warn(
            'Tidak ada data order yang valid di file Excel.'
          );
          return true;
        }
        const store =
          await this.storeService.getCurrentStore();

        if (!store) {
          throw new Error(`Toko saat ini tidak ditemukan`);
        }

        const timezone = store?.timezone;
        const products =
          await this.productService.getByMultipleIds(
            productIds
          );

        const operations: AnyBulkWriteOperation<TOrder>[] =
          [];
        for await (const order of orders) {
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
                  `[OrderService.enrichWithReleasedFunds v2] fuse result for ${productName} not found`
                );
              }
            } else {
              console.warn(
                `[OrderService.enrichWithReleasedFunds v2] fuse search cancelled, orderObjItem.productName is empty`
              );
            }

            const product = products.find(
              (p) => p.product_id === item?.productId
            );

            const name =
              orderObjItem?.variation_name ||
              orderObjItem?.product_name;
            const variant = (product?.variants || []).find(
              (v) => v.name === name
            );
            const productCost =
              product?.variants?.length === 1
                ? product?.variants[0]?.default_cost || 0
                : variant?.default_cost || 0;

            orderObjItem.product = product?._id
              ? String(product._id)
              : undefined;
            orderObjItem.product_cost = productCost;
            orderObjItem.processing_fee =
              item?.orderProcessingFee || 0;
            const financials =
              this.calculateOrderItemFinancials({
                priceAfterDiscount:
                  orderObjItem?.price_after_discount || 0,
                quantity: orderObjItem?.quantity || 0,
                returnedQuantity:
                  orderObjItem?.returned_quantity || 0,
                subtotal: orderObjItem?.subtotal || 0,
                productCostUnit: productCost,
                processingFee:
                  orderObjItem.processing_fee || 0,
              });
            Object.assign(orderObjItem, financials);
            // orderObjItem.product_cost =
            //   defaultCost?.default_cost || 0;
            // orderObjItem.product_cost = product // find correct variant and get default_cost

            totalProductCost =
              totalProductCost +
              (orderObjItem.total_product_cost || 0);

            items.push(orderObjItem);
          }

          const enrichments = orderObj?.enrichments || [];
          enrichments.push({
            kind: 'released-funds',
            file: fileId,
            enriched_by: this.tenantContext.userId,
            enriched_at: new Date(),
          });

          const releasedFundsAmount =
            this.calculateReleasedFundsAmount(order);
          const itemsWithReleasedFunds =
            this.applyReleasedFundsFinancialsToItems(
              items,
              releasedFundsAmount
            );

          $set.items = itemsWithReleasedFunds;
          $set.fee = {
            admin_fee: order.adminFee,
            processing_fee: order.orderProcessingFee,
            affiliate_fee:
              this.toNumber(order.amsCommissionFee) +
              this.toNumber(order.AMSCommissionFee) +
              this.toNumber(order.AMSServiceFee),
            gox_fee: order.GOXFee,
            service_fee: order.serviceFee,
            shipping_saver_program_fee:
              order.shippingSaverProgramFee,
            transaction_fee: order.transactionFee,
            campaign_fee: order.campaignFee,
            other_fee: order.otherFee,
            premium_fee: order.premium,
            fbs_fee: order.fbsFee,
            tax_pph22: order.taxPPH22,
            import_duty_vat_income_tax:
              order.importDutyVatIncomeTax,
            auto_top_up_fee_from_income:
              order.autoTopUpFeeFromIncome,
            return_shipping_fee: order.returnShippingFee,
            return_to_sender_shipping_fee:
              order.returnToSenderShippingFee,
            shipping_fee_refund: order.shippingFeeRefund,
          };
          $set.released_funds = releasedFundsAmount;
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
          $set.total_gross_sales = items.reduce(
            (acc, item) => acc + (item.gross_sales || 0),
            0
          );
          $set.total_net_sales =
            itemsWithReleasedFunds.reduce(
              (acc, item) => acc + (item.net_sales || 0),
              0
            );
          $set.total_gross_profit =
            itemsWithReleasedFunds.reduce(
              (acc, item) => acc + (item.gross_profit || 0),
              0
            );
          $set.total_net_profit =
            itemsWithReleasedFunds.reduce(
              (acc, item) => acc + (item.net_profit || 0),
              0
            );
          // $set.total_profit = $set.total_net_profit;
          $set.released_funds_at = order.releasedFundDate;
          $set.enrichments = enrichments;

          // $set.enriched_at = new Date();
          // $set.enriched_at = parseToISOStringWithTimezone(
          //   new Date(),
          //   timezone
          // );

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
    };

    const v2 = async (ab: ArrayBuffer) => {
      try {
        const { orders, productIds } =
          await releasedFundsV2parser(ab);

        console.log({ length: orders.length, productIds });

        if ((orders || []).length === 0) {
          // throw new Error(
          //   'Tidak ada data order yang valid di file Excel.'
          // );
          console.warn(
            'Tidak ada data order yang valid di file Excel.'
          );
          return true;
        }
        const store =
          await this.storeService.getCurrentStore();

        if (!store) {
          throw new Error(`Toko saat ini tidak ditemukan`);
        }

        const products =
          await this.productService.getByMultipleIds(
            productIds
          );
        const operations: AnyBulkWriteOperation<TOrder>[] =
          [];

        // saveJson(
        //   '.data/json-logs/debug-released-funds-orders--v1.json',
        //   orders
        // );

        for (const order of orders) {
          const orderObj =
            await this.repository.findByOrderId(
              String(order.orderId)
            );

          console.log({ orderObjId: orderObj?.order_id });

          if (!orderObj) {
            console.warn(
              `[OrderService.enrichWithReleasedFunds v2] Order ID: ${order.orderId} not found`
            );
            continue;
          }

          /**
           * @TODO update order, requirements create parser for all and completed order v2. Flow need changed!
           */
          const orderObjItems = orderObj?.items || [];
          const $set: Record<string, any> = {};
          const items = [];
          let totalProductCost = 0;

          // for loop items?
          for (let i = 0; i < orderObjItems.length; i++) {
            const orderObjItem = orderObjItems[i];
            const productName = (
              orderObjItem.product_name || ''
            ).trim();

            type ItemFromExcel = {
              number: number;
              // rowType: string;
              // orderId: string;
              productId: string;
              productName: string;
              productPrice: number;
              adminFee: number;
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
                  `[OrderService.enrichWithReleasedFunds v2] fuse result for ${productName} not found`
                );
              }
            } else {
              console.warn(
                `[OrderService.enrichWithReleasedFunds v2] fuse search cancelled, orderObjItem.productName is empty`
              );
            }
            const product = products.find(
              (p) => p.product_id === item?.productId
            );

            // const product = await this.productService.getProductByProductId();

            const name =
              orderObjItem?.variation_name ||
              orderObjItem?.product_name;
            const variant = (product?.variants || []).find(
              (v) => v.name === name
            );
            const productCost =
              product?.variants?.length === 1
                ? product?.variants[0]?.default_cost || 0
                : variant?.default_cost || 0;

            orderObjItem.product = product?._id
              ? String(product._id)
              : undefined;
            orderObjItem.product_id = item?.productId;
            orderObjItem.product_cost = productCost;
            orderObjItem.processing_fee =
              item?.orderProcessingFee || 0;
            const financials =
              this.calculateOrderItemFinancials({
                priceAfterDiscount:
                  orderObjItem?.price_after_discount || 0,
                quantity: orderObjItem?.quantity || 0,
                returnedQuantity:
                  orderObjItem?.returned_quantity || 0,
                subtotal: orderObjItem?.subtotal || 0,
                productCostUnit: productCost,
                processingFee:
                  orderObjItem.processing_fee || 0,
              });
            Object.assign(orderObjItem, financials);
            // orderObjItem.product_cost =
            //   defaultCost?.default_cost || 0;
            // orderObjItem.product_cost = product // find correct variant and get default_cost

            totalProductCost =
              totalProductCost +
              (orderObjItem.total_product_cost || 0);

            items.push(orderObjItem);
          }

          const sellerSponsoredVoucher =
            order.sellerSponsoredVoucher
              ? Number(order.sellerSponsoredVoucher)
              : 0;
          const sellerSponsoredCoinCashback =
            order.sellerSponsoredCoinCashback
              ? Number(order.sellerSponsoredCoinCashback)
              : 0;
          const productDiscountFromShopee =
            order.productDiscountFromShopee
              ? Number(order.productDiscountFromShopee)
              : 0;
          const sellerSponsoredCoFundVoucher =
            order.sellerSponsoredCoFundVoucher
              ? Number(order.sellerSponsoredCoFundVoucher)
              : 0;
          const sellerSponsoredCoFundCoinCashback =
            order.sellerSponsoredCoFundCoinCashback
              ? Number(
                  order.sellerSponsoredCoFundCoinCashback
                )
              : 0;
          const totalVouchersAndDiscounts =
            sellerSponsoredVoucher +
            sellerSponsoredCoinCashback +
            productDiscountFromShopee +
            sellerSponsoredCoFundVoucher +
            sellerSponsoredCoFundCoinCashback;

          const adminFee = order.adminFee
            ? Number(order.adminFee)
            : 0;
          const orderProcessingFee =
            order.orderProcessingFee
              ? Number(order.orderProcessingFee)
              : 0;
          const totalPlatformFee =
            adminFee + orderProcessingFee;

          const totalGOXFee = order.GOXFee
            ? Number(order.GOXFee)
            : 0;

          const AMSServiceFee = order.AMSServiceFee
            ? Number(order.AMSServiceFee)
            : 0;
          const campaignFee = order.campaignFee
            ? Number(order.campaignFee)
            : 0;
          const AMSCommissionFee = order.AMSCommissionFee
            ? Number(order.AMSCommissionFee)
            : 0;
          const autoTopUpFeeFromIncome =
            order.autoTopUpFeeFromIncome
              ? Number(order.autoTopUpFeeFromIncome)
              : 0;
          const totalPromotionFee =
            AMSServiceFee +
            campaignFee +
            AMSCommissionFee +
            autoTopUpFeeFromIncome;

          const otherFee = order.otherFee
            ? Number(order.otherFee)
            : 0;
          const transactionFee = order.transactionFee
            ? Number(order.transactionFee)
            : 0;
          const fbsFee = order.fbsFee
            ? Number(order.fbsFee)
            : 0;
          const taxPPH22 = order.taxPPH22
            ? Number(order.taxPPH22)
            : 0;
          const totalOtherFee =
            otherFee + transactionFee + fbsFee + taxPPH22;

          const enrichments = orderObj?.enrichments || [];
          enrichments.push({
            kind: 'released-funds',
            file: fileId,
            enriched_by: this.tenantContext.userId,
            enriched_at: new Date(),
          });

          const releasedFundsAmount =
            this.calculateReleasedFundsAmount(order);
          const itemsWithReleasedFunds =
            this.applyReleasedFundsFinancialsToItems(
              items,
              releasedFundsAmount
            );

          $set.items = itemsWithReleasedFunds;
          $set.fee = {
            admin_fee: order.adminFee,
            processing_fee: order.orderProcessingFee,
            affiliate_fee:
              this.toNumber(order.AMSCommissionFee) +
              this.toNumber(order.AMSServiceFee),
            gox_fee: order.GOXFee,
            service_fee: order.serviceFee,
            shipping_saver_program_fee: (order as any)
              .shippingSaverProgramFee,
            transaction_fee: order.transactionFee,
            campaign_fee: order.campaignFee,
            other_fee: order.otherFee,
            premium_fee: (order as any).premium,
            fbs_fee: order.fbsFee,
            tax_pph22: order.taxPPH22,
            import_duty_vat_income_tax: (order as any)
              .importDutyVatIncomeTax,
            auto_top_up_fee_from_income:
              order.autoTopUpFeeFromIncome,
            return_shipping_fee: order.returnShippingFee,
            return_to_sender_shipping_fee:
              order.returnToSellerFee ||
              (order as any).returnToSenderShippingFee,
            shipping_fee_refund: order.shippingFeeRefund,
          };

          // const releasedFundsAmount =
          //   Number(order.productPrice) +
          //   (totalVouchersAndDiscounts +
          //     totalPlatformFee +
          //     totalGOXFee +
          //     totalPromotionFee +
          //     totalOtherFee);

          console.log({
            orderId: orderObj.order_id,
            releasedFundsAmount,
            productPrice: order.productPrice,
            totalVouchersAndDiscounts,
            totalPlatformFee,
            totalGOXFee,
            totalPromotionFee,
            totalOtherFee,
          });
          $set.released_funds = releasedFundsAmount || 0;
          $set.shipping_cost_paid_by_buyer =
            order.shippingCostPaidByBuyer || 0;
          $set.shipping_cost_discount_by_logistics =
            order.shippingCostDiscountFromLogistics || 0;
          // $set.shipping_cost_forwarded_by_shopee =
          //   order.shippingCostForwardedByShopee || 0;
          $set.free_shipping_promo_from_seller =
            order.freeShippingPromoFromSeller || 0;
          $set.compensation = order.compensation || 0;
          $set.voucher_code = order.voucherCode || null;
          $set.total_product_cost = totalProductCost || 0;
          $set.total_gross_sales = items.reduce(
            (acc, item) => acc + (item.gross_sales || 0),
            0
          );
          $set.total_net_sales =
            itemsWithReleasedFunds.reduce(
              (acc, item) => acc + (item.net_sales || 0),
              0
            );
          $set.total_gross_profit =
            itemsWithReleasedFunds.reduce(
              (acc, item) => acc + (item.gross_profit || 0),
              0
            );
          $set.total_net_profit =
            itemsWithReleasedFunds.reduce(
              (acc, item) => acc + (item.net_profit || 0),
              0
            );
          // $set.total_profit = $set.total_net_profit;
          $set.released_funds_at = order.releasedFundDate;
          $set.enrichments = enrichments;
          // $set.enriched_at = new Date();
          // $set.enriched_at = parseToISOStringWithTimezone(
          //   new Date(),
          //   timezone
          // );

          // console.log(JSON.stringify($set, null, 2));

          operations.push({
            updateOne: {
              filter: { order_id: String(order.orderId) },
              update: { $set },
              upsert: true,
            },
          });
        }

        const result =
          await this.repository.bulkWrite(operations);

        return result;
      } catch (error: any) {
        throw new Error(
          `Gagal melengkapi data order: ${error.message}`
        );
      }

      // totalProductCost = 0;
      // }
    };

    try {
      const version =
        await getReleasedFundsVersion(fileBuffer);

      console.log(`version: ${version}`);

      if (version < 0) {
        throw new Error(
          `Format tidak sesuai: Laporan Dana Dilepas tidak ditemukan.`
        );
      }

      // return parser(fileBuffer);
      if (version === 1) {
        return v1(fileBuffer);
      }

      return v2(fileBuffer);
    } catch (error) {
      throw error;
    }
  }
}
