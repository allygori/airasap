import incomeReader from './income/reader';
import incomeParser from './income/parser/index';
import orderReader from './order/reader';
import orderParser from './order/parser';
import { formatReportData } from './formatter';

export default function generateProfitIntelligenceReport(
  incomeBuffer: ArrayBuffer,
  incomeFilename: string,
  orderBuffer?: ArrayBuffer,
  orderFilename?: string
) {
  // 1. Read and parse Completed Orders Excel if provided
  let completedOrdersMap;
  if (orderBuffer) {
    const orderData = orderReader(orderBuffer);
    completedOrdersMap = orderParser(orderData.rows);
  }

  // 2. Read Income Excel
  const { worksheets, raw_data } =
    incomeReader(incomeBuffer);

  // 3. Parse and merge data
  const parsed = incomeParser(
    raw_data,
    completedOrdersMap as any
  );

  // 4. Format and return final report schema
  return formatReportData(
    parsed,
    worksheets,
    raw_data,
    incomeBuffer,
    incomeFilename,
    orderBuffer,
    orderFilename
  );
}
