import reader from './reader';
import parser from './parser';
import {
  ParsedIncomeRow,
  ParsedSellerFeeRow,
} from './types';

export * from './parser';
export * from './map';
export * from './types';

export default function parse(buffer: ArrayBuffer) {
  const data = reader(buffer);
  const { summary, income, sellerFee } = parser(
    data?.raw_data
  );

  // Map seller fee worksheet row by order id
  const ordersMap = new Map<string, ParsedSellerFeeRow[]>();
  // const productNames = new Set<string>();
  const productIds = new Set<string>();
  for (const item of sellerFee) {
    const orderId = String(item.orderId);

    if (!ordersMap.has(orderId)) {
      ordersMap.set(orderId, []);
    }
    ordersMap.get(orderId)!.push(item);
    // productNames.add(String(item.productName));
    if (item.productId !== '-') {
      productIds.add(String(item.productId));
    }
  }
  console.log(JSON.stringify([...ordersMap], null, 2));
  console.log(JSON.stringify([...productIds], null, 2));

  const orders = [];
  for (const order of income) {
    const orderId = order.orderId;
    const items = ordersMap.get(orderId) ?? [];

    orders.push({
      ...order,
      items: items.filter(
        (n) => String(n.rowType).toLowerCase() === 'sku'
      ),
    });
  }

  console.log(JSON.stringify(orders, null, 2));

  // console.log({ summary, income, sellerFee });

  // // Map income row by order id
  // const ordersMap = new Map<string, ParsedIncomeRow[]>();
  // // const productNames = new Set<string>();
  // for (const item of income) {
  //   const orderId = String(item.orderId);

  //   if (!ordersMap.has(orderId)) {
  //     ordersMap.set(orderId, []);
  //   }
  //   ordersMap.get(orderId)!.push(item);
  //   // productNames.add(String(item.productName));
  // }

  // for (const [orderId, group] of ordersMap.entries()) {
  //   console.log(
  //     `Order ID=${orderId}, length=${group.length}`
  //   );
  // }

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

  // return { summary, income, sellerFee };
  return { orders, productIds: [...productIds] };
}
