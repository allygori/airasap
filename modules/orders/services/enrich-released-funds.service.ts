import Fuse from 'fuse.js';
import { AnyBulkWriteOperation } from 'mongoose';
import { getReleasedFundsVersion } from '@/lib/xlsx/shopee/order/released-funds';
import releasedFundsV1parser from '@/lib/xlsx/shopee/v1/order/released-funds';
import releasedFundsV2parser from '@/lib/xlsx/shopee/v2/order/released-funds';
import type { ProductService } from '@/modules/products/product.service';
import type { StoreService } from '@/modules/stores/store.service';
import type { TOrder } from '../order.model';
import type { OrderRepository } from '../order.repository';
import type { OrderService } from '../order.service';
import {
  applyReleasedFundsFinancialsToItems,
  calculateOrderItemFinancials,
  calculateReleasedFundsAmount,
  cleanOrderItemFinancialFields,
  toNumber,
  valueOrEmpty,
} from './utils';
import {
  matchProductAndVariant,
  resolveProductCost,
} from './product-matching';

export type ReleasedFundsImporterDependencies = {
  repository: OrderRepository;
  productService: ProductService;
  storeService: StoreService;
  tenantContext: ConstructorParameters<
    typeof OrderService
  >[0];
};

type ReleasedFundsVersion = 1 | 2;
type ParsedReleasedFundsOrder = Record<string, any>;

const CALCULATED_FINANCIAL_FIELDS = [
  'product_cost',
  'final_quantity',
  'total_product_cost',
  'gross_sales',
  'net_sales',
  'gross_profit',
  'net_profit',
  'processing_fee',
];

function removeCalculatedFinancialFields(
  item: Record<string, any>
) {
  const cleanItem = { ...item };

  for (const field of CALCULATED_FINANCIAL_FIELDS) {
    delete cleanItem[field];
  }

  return cleanItem;
}

function getOrderItems(order: ParsedReleasedFundsOrder) {
  return Array.isArray(order.items) ? order.items : [];
}

function getProductCost(
  products: any[],
  productId: unknown,
  item: Record<string, any>,
  orderCreatedAt: unknown
) {
  const match = matchProductAndVariant(products, {
    productId,
    productName: item.product_name,
    variationName: item.variation_name,
    parentSku: item.parent_sku,
    childSku: item.child_sku,
  });
  const cost = resolveProductCost(
    match.variant ||
      (match.product?.variants?.length === 1
        ? match.product.variants[0]
        : undefined),
    orderCreatedAt
  );

  return {
    product: match.product,
    productMatchStatus: match.productMatchStatus,
    cogsStatus: cost.cogsStatus,
    productCost: toNumber(cost.productCost),
  };
}

function buildReleasedFundsFee(
  order: ParsedReleasedFundsOrder,
  version: ReleasedFundsVersion
) {
  return {
    admin_fee: order.adminFee,
    processing_fee: order.orderProcessingFee,
    affiliate_fee:
      toNumber(order.AMSCommissionFee) +
      toNumber(order.AMSServiceFee) +
      (version === 1
        ? toNumber(order.amsCommissionFee)
        : 0),
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
      version === 1
        ? order.returnToSenderShippingFee
        : order.returnToSellerFee ||
          order.returnToSenderShippingFee,
    shipping_fee_refund: order.shippingFeeRefund,
  };
}

async function buildItemsForOrder(
  order: ParsedReleasedFundsOrder,
  existingItems: Record<string, any>[],
  products: any[],
  version: ReleasedFundsVersion,
  orderCreatedAt: unknown
) {
  const sourceItems = getOrderItems(order);
  const searchIndex = new Fuse(sourceItems, {
    keys: ['productName'],
    includeScore: true,
  });

  const items: Record<string, any>[] = [];

  for (const existingItem of existingItems) {
    const baseItem =
      removeCalculatedFinancialFields(existingItem);
    const productName = String(
      baseItem.product_name || ''
    ).trim();
    const match = productName
      ? searchIndex.search(productName)[0]?.item
      : undefined;
    const releasedItem = (match || {}) as Record<
      string,
      any
    >;
    const productId = releasedItem.productId;
    const {
      product,
      productCost,
      productMatchStatus,
      cogsStatus,
    } = getProductCost(
      products,
      productId,
      baseItem,
      orderCreatedAt
    );

    if (productName && !match) {
      console.warn(
        `[OrderService.enrichWithReleasedFunds] item for ${productName} not found`
      );
    }

    const quantity = toNumber(baseItem.quantity);
    const returnedQuantity = toNumber(
      baseItem.returned_quantity
    );
    const financials = calculateOrderItemFinancials({
      priceAfterDiscount: toNumber(
        baseItem.price_after_discount
      ),
      quantity,
      returnedQuantity,
      subtotal: toNumber(baseItem.subtotal),
      productCostUnit: productCost,
    });

    const rebuiltItem = cleanOrderItemFinancialFields({
      ...baseItem,
      product: product?._id
        ? String(product._id)
        : baseItem.product,
      ...(version === 2 && productId
        ? { product_id: productId }
        : {}),
      product_match_status: productMatchStatus,
      cogs_status: cogsStatus,
      processing_fee: toNumber(
        releasedItem.orderProcessingFee
      ),
      ...financials,
    });

    items.push(rebuiltItem);
  }

  return items;
}

async function processReleasedFundsOrders(
  dependencies: ReleasedFundsImporterDependencies,
  orders: ParsedReleasedFundsOrder[],
  productIds: string[],
  fileId: string,
  version: ReleasedFundsVersion
) {
  const releasedItems = orders.flatMap(getOrderItems);
  const products =
    await dependencies.productService.getProductsForOrderMatching(
      {
        productIds,
        names: releasedItems
          .map((item) => String(item.productName || ''))
          .filter(Boolean),
        parentSkus: releasedItems
          .map((item) => String(item.parentSku || ''))
          .filter(Boolean),
        childSkus: releasedItems
          .map((item) =>
            String(item.skuReferenceNumber || '')
          )
          .filter(Boolean),
      }
    );
  const operations: AnyBulkWriteOperation<TOrder>[] = [];

  for (const order of orders) {
    const orderId = String(order.orderId);
    const existingOrder =
      await dependencies.repository.findByOrderId(orderId);

    if (!existingOrder) {
      console.warn(
        `[OrderService.enrichWithReleasedFunds] Order ID: ${orderId} not found`
      );
      continue;
    }

    const existingItems = (existingOrder.items || []).map(
      (item: any) => ({ ...item })
    );
    const items = await buildItemsForOrder(
      order,
      existingItems,
      products,
      version,
      existingOrder.placed_at
    );
    const releasedFundsAmount =
      calculateReleasedFundsAmount(order);
    const itemsWithReleasedFunds =
      applyReleasedFundsFinancialsToItems(
        items,
        releasedFundsAmount
      );

    const enrichments = [
      ...(existingOrder.enrichments || []),
      {
        kind: 'released-funds',
        file: fileId,
        enriched_by: dependencies.tenantContext.userId,
        enriched_at: new Date(),
      },
    ];

    const $set: Record<string, any> = {
      items: itemsWithReleasedFunds,
      fee: buildReleasedFundsFee(order, version),
      released_funds: releasedFundsAmount,
      shipping_cost_paid_by_buyer: toNumber(
        order.shippingCostPaidByBuyer
      ),
      shipping_cost_discount_by_logistics: toNumber(
        order.shippingCostDiscountFromLogistics
      ),
      shipping_cost_forwarded_by_shopee: toNumber(
        order.shippingCostForwardedByShopee
      ),
      free_shipping_from_shopee: toNumber(
        order.freeShippingFromShopee
      ),
      free_shipping_promo_from_seller: toNumber(
        order.freeShippingPromoFromSeller
      ),
      compensation: toNumber(order.compensation),
      voucher_code: valueOrEmpty(order.voucherCode) || null,
      total_product_cost: itemsWithReleasedFunds.reduce(
        (sum, item) =>
          sum + toNumber(item.total_product_cost),
        0
      ),
      total_gross_sales: items.reduce(
        (sum, item) => sum + toNumber(item.gross_sales),
        0
      ),
      total_net_sales: itemsWithReleasedFunds.reduce(
        (sum, item) => sum + toNumber(item.net_sales),
        0
      ),
      total_gross_profit: itemsWithReleasedFunds.reduce(
        (sum, item) => sum + toNumber(item.gross_profit),
        0
      ),
      total_net_profit: itemsWithReleasedFunds.reduce(
        (sum, item) => sum + toNumber(item.net_profit),
        0
      ),
      released_funds_at: order.releasedFundDate,
      enrichments,
    };

    operations.push({
      updateOne: {
        filter: { order_id: orderId },
        update: { $set },
        upsert: true,
      },
    });
  }

  return dependencies.repository.bulkWrite(operations);
}

export async function enrichWithReleasedFunds(
  dependencies: ReleasedFundsImporterDependencies,
  fileBuffer: ArrayBuffer,
  fileId: string
) {
  const version = await getReleasedFundsVersion(fileBuffer);

  if (version < 0) {
    throw new Error(
      'Format tidak sesuai: Laporan Dana Dilepas tidak ditemukan.'
    );
  }

  const currentStore =
    await dependencies.storeService.getCurrentStore();

  if (!currentStore) {
    throw new Error('Toko saat ini tidak ditemukan');
  }

  try {
    if (version === 1) {
      const { orders, productIds } =
        await releasedFundsV1parser(fileBuffer);

      if (!orders?.length) {
        console.warn(
          'Tidak ada data order yang valid di file Excel.'
        );
        return true;
      }

      return processReleasedFundsOrders(
        dependencies,
        orders,
        productIds,
        fileId,
        1
      );
    }

    const { orders, productIds } =
      await releasedFundsV2parser(fileBuffer);

    if (!orders?.length) {
      console.warn(
        'Tidak ada data order yang valid di file Excel.'
      );
      return true;
    }

    return processReleasedFundsOrders(
      dependencies,
      orders,
      productIds,
      fileId,
      2
    );
  } catch (error: any) {
    throw new Error(
      `Gagal melengkapi data order: ${error.message}`
    );
  }
}
