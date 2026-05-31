import parseSummarySheet from './summary';
import parseIncomeSheet from './income';
import parseSellerFeeSheet from './seller-fee';

import { ParsedOrderCompleted } from '../../order/types';
import { makeProductKey } from '../../utils';

type RawIncomeData = {
  summary_rows?: unknown[][];
  seller_fee_rows?: unknown[][];
  income_rows?: unknown[][];
};

type SellerFeeItem = {
  productId: string;
  productName: string;
};

type CompletedOrderItem =
  ParsedOrderCompleted['items'][number];

type ProductMapItem = {
  id: string;
  name: string;
  variationName: string;
  key: string;
  quantity: number;
  cogs: number;
};

function normalizeProductName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findSellerFeeProductId(
  feeItems: SellerFeeItem[] | undefined,
  productName: string
) {
  if (!feeItems || feeItems.length === 0) return '';

  const normalizedProductName =
    normalizeProductName(productName);
  const matchedFeeItem = feeItems.find(
    (item) =>
      normalizeProductName(
        String(item.productName || '')
      ) === normalizedProductName
  );

  if (matchedFeeItem?.productId) {
    return String(matchedFeeItem.productId).trim();
  }

  if (feeItems.length === 1) {
    return String(feeItems[0].productId || '').trim();
  }

  return '';
}

function getProductId(
  item: CompletedOrderItem,
  feeItems: SellerFeeItem[] | undefined
) {
  return String(
    findSellerFeeProductId(feeItems, item.productName) ||
      item.sku ||
      item.productName
  ).trim();
}

function addProduct(
  productsMap: Map<string, ProductMapItem>,
  product: {
    id: string;
    name: string;
    variationName: string;
    quantity: number;
  }
) {
  const key = makeProductKey(
    product.id,
    product.variationName
  );

  if (productsMap.has(key)) {
    productsMap.get(key)!.quantity += product.quantity;
    return;
  }

  productsMap.set(key, {
    id: product.id,
    name: product.name,
    variationName: product.variationName,
    key: key,
    quantity: product.quantity,
    cogs: 0,
  });
}

export default function parser(
  rawData: RawIncomeData,
  completedOrdersMap?: Map<string, ParsedOrderCompleted>
) {
  const summary = parseSummarySheet(
    rawData.summary_rows || []
  );
  const sellerFeeResult = parseSellerFeeSheet(
    rawData.seller_fee_rows || []
  );
  const sellerFeeOrders = (sellerFeeResult.orders ||
    {}) as Record<string, SellerFeeItem[]>;

  const income = parseIncomeSheet(
    rawData.income_rows || []
  );
  const productsMap = new Map<string, ProductMapItem>();
  const incomeOrderIds = new Set(
    income.orders.map((order) => String(order.id))
  );
  const completedOrderIds = new Set(
    completedOrdersMap?.keys() || []
  );
  const orderDiff = {
    income_only: income.orders
      .filter((order) => !completedOrderIds.has(order.id))
      .map((order) => ({
        id: order.id,
        username: order.username,
        createdAt: order.createdAt,
        releasedAt: order.releasedAt,
        income: order.income,
        originalPrice: order.originalPrice,
      })),
    order_only: Array.from(
      completedOrdersMap?.values() || []
    )
      .filter((order) => !incomeOrderIds.has(order.orderId))
      .map((order) => ({
        id: order.orderId,
        username: order.username,
        status: order.status,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        completedAt: order.completedAt,
        totalPayment: order.totalPayment,
        itemCount: order.items.length,
        quantity: order.items.reduce(
          (total, item) => total + item.quantity,
          0
        ),
        productNames: Array.from(
          new Set(
            order.items.map((item) => item.productName)
          )
        ).slice(0, 5),
      })),
  };

  // Merge income orders with completed orders details
  for (const incomeOrder of income.orders) {
    const completedOrder = completedOrdersMap?.get(
      incomeOrder.id
    );
    const feeItems = sellerFeeOrders[incomeOrder.id];

    if (completedOrder) {
      incomeOrder.completedAt = completedOrder.completedAt;
      incomeOrder.items = completedOrder.items.map(
        (item) => {
          const baseProductId = getProductId(
            item,
            feeItems
          );
          const productKey = makeProductKey(
            baseProductId,
            item.variationName
          );

          return {
            productId: baseProductId,
            name: item.productName,
            variationName: item.variationName,
            key: productKey,
            quantity: item.quantity,
            originalPrice: item.originalPrice,
            discountedPrice: item.discountedPrice,
          };
        }
      );

      // Add to global products mapping with correct quantity
      for (const item of completedOrder.items) {
        const baseProductId = getProductId(item, feeItems);
        const displayName = item.variationName
          ? `${item.productName} (${item.variationName})`
          : item.productName;

        addProduct(productsMap, {
          id: baseProductId,
          name: displayName,
          variationName: item.variationName || '',
          quantity: item.quantity,
        });
      }
    } else {
      // Fallback 1: Try to get from Seller Fee sheet
      if (feeItems && feeItems.length > 0) {
        incomeOrder.items = feeItems.map((fi) => ({
          productId: fi.productId,
          name: fi.productName,
          variationName: '',
          quantity: 1, // fallback
          originalPrice:
            incomeOrder.originalPrice / feeItems.length,
          discountedPrice:
            incomeOrder.originalPrice / feeItems.length,
        }));

        for (const fi of feeItems) {
          addProduct(productsMap, {
            id: fi.productId,
            name: fi.productName,
            variationName: '',
            quantity: 1,
          });
        }
      } else {
        // Fallback 2: General Unknown Product
        const prodId = 'unknown-product';
        incomeOrder.items = [
          {
            productId: prodId,
            name: 'Produk Tidak Teridentifikasi',
            variationName: '',
            quantity: 1,
            originalPrice: incomeOrder.originalPrice,
            discountedPrice: incomeOrder.originalPrice,
          },
        ];

        addProduct(productsMap, {
          id: prodId,
          name: 'Produk Tidak Teridentifikasi',
          variationName: '',
          quantity: 1,
        });
      }
    }
  }

  return {
    summary,
    income,
    products: Array.from(productsMap.values()),
    orderDiff,
  };
}
