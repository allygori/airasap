import {
  shopeeV1OrderCompletedParser,
  type ParsedOrderRow,
} from '@/lib/xlsx/shopee/v1/order/completed';
import { shopeeV2OrderCompletedParser } from '@/lib/xlsx/shopee/v2/order/completed';
import { ORDER_PLATFORMS } from '@/constant/order-platform';
import { SHOPEE_ORDER_STATUS } from '@/constant/order/shopee/status';
import type { MassUploadResponseDTO } from '../order.dto';
import type { OrderRepository } from '../order.repository';
import type { OrderService } from '../order.service';
import {
  calculateOrderItemFinancials,
  cleanOrderItemFinancialFields,
  getBuyerUsername,
} from './utils';
import {
  matchProductAndVariant,
  resolveProductCost,
} from './product-matching';

export type ShopeeCompletedOrderImporterDependencies = {
  repository: OrderRepository;
  productService: import('@/modules/products/product.service').ProductService;
  tenantContext: ConstructorParameters<
    typeof OrderService
  >[0];
};

export async function massUploadEnrichWithOrderCompletedShopeeV1(
  dependencies: ShopeeCompletedOrderImporterDependencies,
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
    const orderResults: MassUploadResponseDTO['order_results'] =
      [];
    const products =
      await dependencies.productService.getProductsForOrderMatching(
        {
          names: orders
            .map((order) => String(order.productName || ''))
            .filter(Boolean),
          parentSkus: orders
            .map((order) => String(order.parentSku || ''))
            .filter(Boolean),
          childSkus: orders
            .map((order) =>
              String(order.skuReferenceNumber || '')
            )
            .filter(Boolean),
        }
      );
    for (const [orderId, group] of ordersMap.entries()) {
      const order = group[0] || {};
      const existingOrder =
        await dependencies.repository.findByOrderId(
          orderId
        );
      const existingItems = existingOrder?.items || [];
      const enrichments = existingOrder?.enrichments || [];

      if (existingOrder) {
        // Existing orders may contain edits from the UI/API. Only update
        // the completed timestamp and append this enrichment atomically;
        // never replace items or other user-managed fields here.
        const updateResult =
          await dependencies.repository.bulkWrite([
            {
              updateOne: {
                filter: {
                  _id: existingOrder._id,
                  enrichments: {
                    $not: {
                      $elemMatch: {
                        kind: 'completed',
                        file: fileId,
                      },
                    },
                  },
                },
                update: {
                  $set: {
                    completed_at: order.orderCompletionTime
                      ? String(order.orderCompletionTime)
                      : undefined,
                  },
                  $addToSet: {
                    enrichments: {
                      kind: 'completed',
                      file: fileId,
                      enriched_by:
                        dependencies.tenantContext.userId,
                      enriched_at: new Date(),
                    },
                  },
                },
              },
            },
          ]);
        if (updateResult.modifiedCount > 0) {
          updatedCount++;
        }
        orderResults.push({
          order_id: orderId,
          status:
            updateResult.modifiedCount > 0
              ? 'updated'
              : 'ignored',
          message:
            updateResult.modifiedCount > 0
              ? 'Data order completed diperbarui tanpa menimpa perubahan manual.'
              : 'Enrichment completed sudah pernah diproses untuk file ini.',
        });
        continue;
      }

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
        const match = matchProductAndVariant(products, {
          productName: item.productName,
          variationName: item.variationName,
          parentSku: item.parentSku,
          childSku: item.skuReferenceNumber,
        });
        const cost = resolveProductCost(
          match.variant ||
            (match.product?.variants?.length === 1
              ? match.product.variants[0]
              : undefined),
          order.orderCreationTime
        );
        const financials = calculateOrderItemFinancials({
          priceAfterDiscount,
          quantity,
          returnedQuantity,
          subtotal: Number(item.orderSubtotal || 0),
          productCostUnit: cost.productCost,
        });

        return cleanOrderItemFinancialFields({
          ...existingItem,
          product:
            match.product?._id || existingItem?.product,
          product_id:
            match.product?.product_id ||
            existingItem?.product_id,
          variation_id:
            match.variant?.variant_id ||
            existingItem?.variation_id,
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
          product_match_status: match.productMatchStatus,
          cogs_status: cost.cogsStatus,
          ...financials,
        });
      });

      const orderSubtotal = orderItems.reduce(
        (acc: number, curr) => {
          return acc + Number(curr.subtotal);
        },
        0
      );
      const totalProductCost = orderItems.reduce(
        (acc, item) => acc + (item.total_product_cost || 0),
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
      //   enriched_by: dependencies.tenantContext.userId,
      //   enriched_at: new Date(),
      // };

      enrichments.push({
        kind: 'completed',
        file: fileId,
        enriched_by: dependencies.tenantContext.userId,
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
        username: getBuyerUsername(order),
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
        voucher_borne_by_seller: order.voucherBorneBySeller,
        voucher_borne_by_shopee: order.voucherBorneByShopee,
        voucher_code: order.voucherCode || null,
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
      //   await dependencies.repository.create(payload);
      //   createdCount++;
      // }

      // if (existingOrder) {
      //   await dependencies.repository.update(
      //     existingOrder._id.toString(),
      //     // payload
      //     {
      //       status:
      //         Object.values(SHOPEE_ORDER_STATUS).find(
      //           (s: { label: string }) =>
      //             s.label === order.orderStatus
      //         )?.value ?? null,
      //       completed_at: order.orderCompletionTime,
      //     }
      //   );
      //   updatedCount++;
      // } else {
      //   await dependencies.repository.create(payload);
      //   createdCount++;
      // }

      await dependencies.repository.create(payload);
      createdCount++;
      orderResults.push({
        order_id: orderId,
        status: 'created',
      });
    }

    return {
      created_count: createdCount,
      updated_count: updatedCount,
      total_rows: orders.length,
      total_orders: ordersMap.size,
      order_results: orderResults,
    };
  } catch (error: any) {
    throw new Error(
      `Gagal memproses mass upload order: ${error.message}`
    );
  }
}
