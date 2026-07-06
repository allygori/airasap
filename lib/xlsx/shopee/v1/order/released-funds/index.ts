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
  // console.log(JSON.stringify([...ordersMap], null, 2));
  // console.log(JSON.stringify([...productIds], null, 2));

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

  // return { summary, income, sellerFee };
  return { orders, productIds: [...productIds] };
}
