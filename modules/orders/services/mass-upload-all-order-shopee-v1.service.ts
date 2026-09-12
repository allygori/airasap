import {
  shopeeV1AllOrderParser,
  type ParsedAllOrderRow,
} from '@/lib/xlsx/shopee/v1/order/all';
import { shopeeV2AllOrderParser } from '@/lib/xlsx/shopee/v2/order/all';
import { ORDER_PLATFORMS } from '@/constant/order-platform';
import { SHOPEE_ORDER_STATUS } from '@/constant/order/shopee/status';
import type { MassUploadResponseDTO } from '../order.dto';
import type { OrderRepository } from '../order.repository';
import type { ProductService } from '@/modules/products/product.service';
import {
  calculateOrderItemFinancials,
  getCancelledBy,
  getBuyerUsername,
} from './utils';
import {
  matchProductAndVariant,
  resolveProductCost,
} from './product-matching';

export type ShopeeAllOrderImporterDependencies = {
  repository: OrderRepository;
  productService: ProductService;
  tenantContext: {
    organizationId: string;
    storeId?: string;
    userId?: string;
  };
};

export async function massUploadAllOrderShopeeV1(
  dependencies: ShopeeAllOrderImporterDependencies,
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
    const parentSkus = new Set<string>();
    const childSkus = new Set<string>();
    for (const order of orders) {
      const orderId = String(order.id);
      const productName = String(order.productName);

      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, []);
      }
      ordersMap.get(orderId)!.push(order);
      productNames.add(productName);
      if (String(order.parentSku || '').trim()) {
        parentSkus.add(String(order.parentSku).trim());
      }
      if (String(order.skuReferenceNumber || '').trim()) {
        childSkus.add(
          String(order.skuReferenceNumber).trim()
        );
      }
    }

    // console.log('productNames', productNames);

    const products =
      await dependencies.productService.getProductsForOrderMatching(
        {
          names: [...productNames],
          parentSkus: [...parentSkus],
          childSkus: [...childSkus],
        }
      );

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

        const match = matchProductAndVariant(products, {
          productName,
          variationName: variantName,
          parentSku: item.parentSku,
          childSku: item.skuReferenceNumber,
        });
        const product = match.product;
        const variant = match.variant;
        if (match.productMatchStatus !== 'matched') {
          console.warn(
            `[OrderService.massUploadAllOrderShopeeV1] ${match.productMatchStatus} match for ${productName}`
          );
        }

        // console.log(
        //   `[OrderService.massUploadAllOrderShopeeV1] ${order.id} variant`,
        //   JSON.stringify(variant, null, 2)
        // );
        const cost = resolveProductCost(
          variant ||
            (product?.variants?.length === 1
              ? product.variants[0]
              : undefined),
          order.orderCreationTime
        );

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
        const financials = calculateOrderItemFinancials({
          priceAfterDiscount,
          quantity,
          returnedQuantity,
          subtotal: Number(item.orderSubtotal || 0),
          productCostUnit: cost.productCost,
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
          product_match_status: match.productMatchStatus,
          cogs_status: cost.cogsStatus,
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

      // const totalFee = Object.values()

      const payload = {
        platform: ORDER_PLATFORMS.shopee.value,
        order_id: orderId,
        status:
          Object.values(SHOPEE_ORDER_STATUS).find(
            (s: { label: string }) =>
              s.label === order.status
          )?.value ?? null,
        cancelled_by: getCancelledBy(
          String(order.cancellationReason)
        ),
        cancellation_reason: order.cancellationReason,
        cancellation_return_status:
          order.cancellationReturnStatus,
        username: getBuyerUsername(order),
        number_of_products_ordered:
          order.numberOfProductsOrdered,
        total_payment: order.totalPayment,
        payment_method: order.paymentMethod,
        paid_at: order.paymentTimeCompleted,
        order_subtotal: orderSubtotal,
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
        await dependencies.repository.findByOrderId(
          orderId
        );

      if (!existingOrder) {
        await dependencies.repository.create(payload);
        createdCount++;
      }

      // if (existingOrder) {
      //   await dependencies.repository.update(
      //     existingOrder._id.toString(),
      //     payload
      //   );
      //   updatedCount++;
      // } else {
      //   await dependencies.repository.create(payload);
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
