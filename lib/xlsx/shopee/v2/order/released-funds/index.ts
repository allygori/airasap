import incomeParser, {
  type ParsedIncomeRow,
} from './worksheets/income';
import sellerFeeParser from './worksheets/seller-fee';
import type { ParsedOrder, ParsedOrderItem } from './types';
// import type { Order, OrderItem } from './types';
// import { saveJson } from '@/lib/file/save-json';

// type ParsedOrder = ParsedIncomeRow &
//   Partial<ParsedSellerFeeRow> & {
//     items: ParsedIncomeRow[];
//   };

const VERSION = 2;

export default function parse(buffer: ArrayBuffer): {
  version: number;
  orders: ParsedOrder[];
} {
  const incomeRows = incomeParser(buffer);
  const sellerFeeRows = sellerFeeParser(buffer);

  // const orders = [];
  const ordersMap = new Map<string, ParsedOrder>();
  for (const row of incomeRows) {
    const rowType = String(row.rowType ?? '').toLowerCase();
    const orderId = String(row.orderId ?? '');

    if (rowType === 'order') {
      const fee = sellerFeeRows.find(
        (sf) => String(sf.orderId ?? '') === orderId
      );

      const _order = {
        ...(fee ?? {}),
        ...row,
        items: [] as ParsedIncomeRow[],
      } as ParsedOrder;

      ordersMap.set(orderId, _order);
    } else if (rowType === 'sku') {
      const existing =
        ordersMap.get(orderId) ??
        ({ items: [] as ParsedOrderItem[] } as ParsedOrder);

      existing.items.push(row as ParsedIncomeRow);
      ordersMap.set(orderId, existing);
    } else {
      console.warn(
        `Can't identified rowType: ${rowType} - ${orderId}`
      );
    }

    // let prevOrderId = orderId;

    // if (
    //   !ordersMap.has(orderId) &&
    //   rowType.toLowerCase() === 'order'
    // ) {
    //   ordersMap.set(orderId, []);
    // }

    // ordersMap.get(orderId)!.push(row);
  }

  // for (let i = 0; i < incomeRows.length; i++) {
  //   const row = incomeRows[i];
  //   const orderId = row.orderId;

  //   if (String(row.rowType).toLowerCase() === 'order') {
  //     // const order: Order = {
  //     //   id: row.orderId,
  //     //   username: row.username,
  //     //   createdAt: row.orderCreationDate,
  //     //   releasedAt: row.releasedFundDate,
  //     //   // completedAt?: row.order,
  //     //   paymentMethod: row.paymentMethod,
  //     //   originalPrice: row.productPrice,
  //     //   // totalDiscount: row.,
  //     //   voucherCode: row.voucherCode,
  //     //   // sellerVouchers?: [
  //     //   //   {
  //     //   //     code?: string,
  //     //   //     value?: number,
  //     //   //   },
  //     //   // ],
  //     //   // sellerCoFundVouchers?: [
  //     //   //   {
  //     //   //     code?: string,
  //     //   //     value?: number,
  //     //   //   },
  //     //   // ],
  //     //   // adminFee: number,
  //     //   // serviceFee: number,
  //     //   // transactionFee: number,
  //     //   // processFee: number,
  //     //   // campaignFee: number,
  //     //   // income: number,
  //     //   // logisticService: string,
  //     //   // items?: OrderItem[],
  //     // };

  //     orders.push(row);
  //     const fee = sellerFeeRows.find(
  //       (sf) => sf.orderId === orderId
  //     );
  //   } else if (
  //     String(row.rowType).toLowerCase() === 'sku'
  //   ) {
  //   } else {
  //   }
  // }

  // console.log([...ordersMap.values()]);

  // saveJson('.data/json-logs/debug-released-funds-v2.json', [
  //   ...ordersMap.values(),
  // ]);

  return {
    version: VERSION,
    orders: [...ordersMap.values()],
  };
}
