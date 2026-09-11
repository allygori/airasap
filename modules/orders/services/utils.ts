export function getCancelledBy(text: string) {
  if (text.includes('Dibatalkan oleh Pembeli'))
    return 'buyer';
  if (
    text.includes(
      'Dibatalkan secara otomatis oleh sistem Shopee'
    )
  )
    return 'system';
  if (
    text.includes('Dibatalkan') &&
    text.toLowerCase().includes('penjual')
  )
    return 'seller';
  if (text.includes('Dibatalkan')) return 'unknown';
  return null;
}

export function getBuyerUsername(
  order: Record<string, any>
) {
  return order.buyerUsername || order.username || '';
}

export function calculateOrderItemFinancials(args: {
  priceAfterDiscount?: number;
  quantity?: number;
  returnedQuantity?: number;
  subtotal?: number;
  productCostUnit?: number;
}) {
  const quantity = Number(args.quantity || 0);
  const returnedQuantity = Number(
    args.returnedQuantity || 0
  );
  const finalQuantity = Math.max(
    quantity - returnedQuantity,
    0
  );
  const priceAfterDiscount = Number(
    args.priceAfterDiscount || 0
  );
  const grossSales =
    Number(args.subtotal || 0) ||
    priceAfterDiscount * quantity;
  const productCost = Number(args.productCostUnit || 0);
  const totalProductCost = productCost * finalQuantity;
  const grossProfit = grossSales - totalProductCost;
  return {
    product_cost: productCost,
    final_quantity: finalQuantity,
    total_product_cost: totalProductCost,
    gross_sales: grossSales,
    net_sales: grossSales,
    gross_profit: grossProfit,
    net_profit: grossProfit,
  };
}

export function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : Number(value || 0) || 0;
}

export function valueOrEmpty(...values: unknown[]) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const parsed = String(value).trim();
    if (parsed !== '') return parsed;
  }
  return '';
}

export function cleanOrderItemFinancialFields(
  item: Record<string, any>
) {
  const cleanItem = { ...item };
  const fields = [
    'profit',
    'estimated_profit',
    'product_key',
    'number',
    'rowType',
    'orderId',
    'noSubmission',
    'productId',
    'productName',
    'productPrice',
    'orderCreationDate',
    'releasedFundDate',
    'releasedFundMethod',
    'orderType',
    'releasedFundsAmount',
    'refundToBuyer',
    'shippingCostPaidByBuyer',
    'shippingCostForwardedByShopee',
    'shippingCostDiscountFromLogistics',
    'shippingCostDiscountByLogistics',
    'freeShippingFromShopee',
    'returnShippingFee',
    'returnToSellerFee',
    'returnToSenderShippingFee',
    'shippingFeeRefund',
    'sellerSponsoredVoucher',
    'sellerSponsoredCoinCashback',
    'productDiscountFromShopee',
    'sellerSponsoredCoFundVoucher',
    'sellerSponsoredCoFundCoinCashback',
    'adminFee',
    'orderProcessingFee',
    'GOXFee',
    'AMSServiceFee',
    'campaignFee',
    'AMSCommissionFee',
    'amsCommissionFee',
    'autoTopUpFeeFromIncome',
    'otherFee',
    'transactionFee',
    'fbsFee',
    'taxPPH22',
    'importDutyVatIncomeTax',
    'username',
    'buyerPayment',
    'paymentMethod',
    'paymentMethodDetail',
    'installmentPlan',
    'freeShippingPromoFromSeller',
    'shippingService',
    'shippingServiceName',
    'courierName',
    'voucherCode',
    'compensation',
    'buyerRefund',
    'buyerRefundAmount',
    'proRatedRedeemedCoinForReturn',
    'proRatedShopeeVoucherForReturn',
    'proRatedBankPaymentPromotionForReturn',
    'proRatedShopeePaymentPromotionForReturn',
  ];
  for (const field of fields) delete cleanItem[field];
  return cleanItem;
}

export function calculateReleasedFundsAmount(
  order: Record<string, any>
) {
  const explicitAmount =
    order.releasedFundsAmount ?? order.totalIncome;
  if (
    explicitAmount !== undefined &&
    explicitAmount !== null &&
    toNumber(explicitAmount) !== 0
  ) {
    return toNumber(explicitAmount);
  }
  const productIncome =
    order.productPrice ?? order.originalProductPrice ?? 0;
  return [
    productIncome,
    order.totalProductDiscount,
    order.refundToBuyer,
    order.refundToBuyerAmount,
    order.buyerRefund,
    order.buyerRefundAmount,
    order.shippingCostPaidByBuyer,
    order.shippingCostPaidToLogistics,
    order.shippingCostDiscountFromLogistics,
    order.shippingCostDiscountByLogistics,
    order.freeShippingFromShopee,
    order.shippingCostForwardedByShopee,
    order.returnShippingFee,
    order.returnToSellerFee,
    order.returnToSenderShippingFee,
    order.shippingFeeRefund,
    order.sellerSponsoredVoucher,
    order.sellerSponsoredCoinCashback,
    order.productDiscountFromShopee,
    order.sellerSponsoredCoFundVoucher,
    order.sellerSponsoredCoFundCoinCashback,
    order.adminFee,
    order.orderProcessingFee,
    order.GOXFee,
    order.shippingSaverProgramFee,
    order.AMSServiceFee,
    order.serviceFee,
    order.campaignFee,
    order.AMSCommissionFee,
    order.amsCommissionFee,
    order.autoTopUpFeeFromIncome,
    order.otherFee,
    order.premium,
    order.transactionFee,
    order.fbsFee,
    order.taxPPH22,
    order.importDutyVatIncomeTax,
    order.compensation,
    order.freeShippingPromoFromSeller,
    order.proRatedRedeemedCoinForReturn,
    order.proRatedShopeeVoucherForReturn,
    order.proRatedBankPaymentPromotionForReturn,
    order.proRatedShopeePaymentPromotionForReturn,
  ].reduce((sum, value) => sum + toNumber(value), 0);
}

export function hasReleasedFundsComponents(
  order: Record<string, any>
) {
  return [
    order.releasedFundsAmount,
    order.totalIncome,
    order.productPrice,
    order.originalProductPrice,
  ].some((value) => toNumber(value) !== 0);
}

export function applyReleasedFundsFinancialsToItems(
  items: Record<string, any>[],
  releasedFundsAmount: number
) {
  const totalGrossSales = items.reduce(
    (sum, item) => sum + toNumber(item.gross_sales),
    0
  );
  return items.map((item) => {
    const itemReleasedFunds =
      hasReleasedFundsComponents(item) ||
      totalGrossSales === 0
        ? calculateReleasedFundsAmount(item)
        : Math.round(
            (releasedFundsAmount *
              toNumber(item.gross_sales)) /
              totalGrossSales
          );
    const totalProductCost = toNumber(
      item.total_product_cost
    );
    return cleanOrderItemFinancialFields({
      ...item,
      gross_profit:
        toNumber(item.gross_sales) - totalProductCost,
      net_sales: itemReleasedFunds,
      net_profit: itemReleasedFunds - totalProductCost,
    });
  });
}
