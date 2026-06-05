import parseSummarySheet from '../summary';
import parseIncomeSheet from '../parser';
import parseSellerFeeSheet from '../seller-fee';
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
  item: any,
  feeItems: SellerFeeItem[] | undefined
) {
  return String(
    findSellerFeeProductId(feeItems, item.product_name) ||
      item.sku_reference_number ||
      item.parent_sku ||
      item.product_name
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
  completedOrdersMap?: Map<string, any>
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
      .filter(
        (order) => !incomeOrderIds.has(order.order_id)
      )
      .map((order) => ({
        id: order.order_id,
        username: order.username,
        status: order.status,
        createdAt: order.order_created_at,
        paidAt: order.paidAt,
        completedAt: order.order_completed_at,
        totalPayment: order.total_payment,
        itemCount: order.items.length,
        quantity: order.items.reduce(
          (total: number, item: any) =>
            total + item.quantity,
          0
        ),
        productNames: Array.from(
          new Set(
            order.items.map(
              (item: any) => item.product_name
            )
          )
        ).slice(0, 5) as string[],
      })),
  };

  // Merge income orders with completed orders details
  for (const incomeOrder of income.orders) {
    const completedOrder = completedOrdersMap?.get(
      incomeOrder.id
    );
    const feeItems = sellerFeeOrders[incomeOrder.id];

    if (completedOrder) {
      incomeOrder.completedAt =
        completedOrder.order_completed_at;
      incomeOrder.items = completedOrder.items.map(
        (item: any) => {
          const baseProductId = getProductId(
            item,
            feeItems
          );
          const productKey = makeProductKey(
            baseProductId,
            item.variation_name
          );

          return {
            productId: baseProductId,
            name: item.product_name,
            variationName: item.variation_name,
            key: productKey,
            quantity: item.quantity,
            originalPrice: item.original_price,
            discountedPrice: item.price_after_discount,
          };
        }
      );

      // Add to global products mapping with correct quantity
      for (const item of completedOrder.items) {
        const baseProductId = getProductId(item, feeItems);
        const displayName = item.variation_name
          ? `${item.product_name} (${item.variation_name})`
          : item.product_name;

        addProduct(productsMap, {
          id: baseProductId,
          name: displayName,
          variationName: item.variation_name || '',
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
