import parseSummarySheet from './summary';
import parseIncomeSheet from './income';
import parseSellerFeeSheet from './seller-fee';

type RawIncomeData = {
  summary_rows?: unknown[][];
  seller_fee_rows?: unknown[][];
  income_rows?: unknown[][];
};

export default function parser(
  rawData: RawIncomeData,
  _completedOrdersMap?: unknown
): any {
  return {
    summary: parseSummarySheet(rawData.summary_rows || []),
    income: parseIncomeSheet(rawData.income_rows || []),
    sellerFee: parseSellerFeeSheet(
      rawData.seller_fee_rows || []
    ),
  };
}
