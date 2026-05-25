import parseSummarySheet from "./summary";
import parseIncomeSheet from "./income";
import parseSellerFeeSheet from "./seller-fee";

export default function parser(rawData: any) {
  const summary = parseSummarySheet(rawData.summary_rows || []);
  const { orders = [], products = [] } = parseSellerFeeSheet(rawData.seller_fee_rows || []);
  const income = parseIncomeSheet(rawData.income_rows || []);

  // console.log(orders)

  // for (const order of income.orders) {
  //   // order.products = 
  //   order.id
  // }


  // console.log({ sellerFee, income })

  // for (const orderId in orders) {
  //   const index = income.orders.findIndex(o => o.id === orderId);
  //   if (index !== -1) {
  //     income.orders[index].
  //   }
  // }

  console.log('orders', JSON.stringify(orders, null, 2));
  console.log('products', JSON.stringify(products, null, 2));
  console.log('income orders', JSON.stringify(income.orders.slice(0, 3), null, 2));




  return { summary, income, products: {} };
}