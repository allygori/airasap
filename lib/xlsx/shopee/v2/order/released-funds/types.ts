import { type ParsedIncomeRow } from './worksheets/income';
import { type ParsedSellerFeeRow } from './worksheets/seller-fee';

// type OrderItem = Pick<ParsedIncomeRow, "productId" | "productName" | "productPrice" | "shippingCostPaidToLogistics" | "freeShippingFromShopee" | >
export type ParsedOrderItem = Omit<
  ParsedIncomeRow,
  'orderId' | 'username' | 'buyerPayment'
>;

export type ParsedOrder = ParsedIncomeRow &
  Partial<ParsedSellerFeeRow> & {
    items: ParsedOrderItem[];
  };

// export type OrderItem = {
//   productId: string;
//   name: string;
//   variationName: string;
//   quantity: number;
//   originalPrice: number;
//   discountedPrice: number;
// };

// export type Order = {
//   // number: number;
//   id: string;
//   username: string;
//   createdAt: Date;
//   releasedAt?: Date;
//   completedAt?: Date | null;
//   paymentMethod: string;
//   originalPrice: number;
//   totalDiscount: number;
//   voucherCode: string;
//   sellerVouchers?: [
//     {
//       code?: string;
//       value?: number;
//     },
//   ];
//   sellerCoFundVouchers?: [
//     {
//       code?: string;
//       value?: number;
//     },
//   ];
//   adminFee: number;
//   serviceFee: number;
//   transactionFee: number;
//   processFee: number;
//   campaignFee: number;
//   income: number;
//   logisticService: string;
//   items?: OrderItem[];
// };
