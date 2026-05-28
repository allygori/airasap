import crypto from 'crypto';
import {
  calculateCRC32,
  detectMimeTypeByAB,
  size,
} from '@/lib/file';
import {
  ParserResult,
  WorksheetsMap,
  RawIncomeData,
} from './types';
import { Order } from './income/types';

export function extractSellerInfoFromSummary(
  summaryRows: unknown[][]
) {
  let username = 'unknown';
  let fromDate = new Date();
  let toDate = new Date();

  for (const row of summaryRows) {
    if (row && row.length >= 2) {
      const label = String(row[0]).toLowerCase();
      const val = row[1];
      if (label.includes('username') && val) {
        username = String(val).trim();
      } else if (label.includes('dari') && val) {
        const d = new Date(String(val));
        if (!isNaN(d.getTime())) fromDate = d;
      } else if (label.includes('ke') && val) {
        const d = new Date(String(val));
        if (!isNaN(d.getTime())) toDate = d;
      }
    }
  }

  return { username, fromDate, toDate };
}

export function formatReportData(
  parsed: ParserResult,
  worksheets: WorksheetsMap,
  rawData: RawIncomeData,
  incomeBuffer: ArrayBuffer,
  incomeFilename: string,
  orderBuffer?: ArrayBuffer,
  orderFilename?: string
) {
  const sid = crypto.randomBytes(4).toString('hex');

  // Extract Seller Username and Report Period from Summary Sheet
  const summaryRows = rawData.summary_rows || [];
  const { username, fromDate, toDate } =
    extractSellerInfoFromSummary(summaryRows);

  const incomeChecksum = calculateCRC32(incomeBuffer);
  const sourceFiles = [
    {
      file_type: 'income',
      original_name: incomeFilename,
      size: size(incomeBuffer),
      mime_type: detectMimeTypeByAB(incomeBuffer),
      checksum: incomeChecksum,
      storage_provider: 'local',
    },
  ];

  if (orderBuffer && orderFilename) {
    sourceFiles.push({
      file_type: 'order',
      original_name: orderFilename,
      size: size(orderBuffer),
      mime_type: detectMimeTypeByAB(orderBuffer),
      checksum: calculateCRC32(orderBuffer),
      storage_provider: 'local',
    });
  }

  // Create object matching ToolMarketplaceIncomeReportSchema
  return {
    sid,
    platform: 'shopee',
    report_type: 'income_released',
    parser_version: 'shopee-income-v1',
    seller: {
      username,
    },
    period: {
      from: fromDate,
      to: toDate,
    },
    source_pair: {
      income_checksum: incomeChecksum,
      order_checksum: orderBuffer
        ? calculateCRC32(orderBuffer)
        : undefined,
    },
    products: parsed.products.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      cogs: p.cogs || 0,
    })),
    orders: parsed.income.orders.map((o: Order) => ({
      id: o.id,
      username: o.username,
      createdAt: o.createdAt,
      releasedAt: o.releasedAt || null,
      completedAt: o.completedAt || null,
      paymentMethod: o.paymentMethod,
      logisticService: o.logisticService,
      income: o.income,
      originalPrice: o.originalPrice,
      totalDiscount: o.totalDiscount,
      fees: {
        admin: Math.abs(o.adminFee || 0),
        service: Math.abs(o.serviceFee || 0),
        transaction: Math.abs(o.transactionFee || 0),
        process: Math.abs(o.processFee || 0),
        campaign: Math.abs(o.campaignFee || 0),
      },
      items: (o.items || []).map((item) => ({
        productId: item.productId,
        name: item.name,
        variationName: item.variationName || '',
        quantity: item.quantity,
        originalPrice: item.originalPrice,
        discountedPrice: item.discountedPrice,
      })),
    })),
    order_diff: parsed.orderDiff,
    summary: {
      total_income: parsed.income.grossSales,
      released_amount: parsed.income.netPayout,
      total_expense: {
        total: Object.values(parsed.income.fees).reduce(
          (total: number, value: number) => total + value,
          0
        ),
        admin_and_service_fee: {
          items: parsed.income.fees,
        },
      },
    },
    source_files: sourceFiles,
    extra: {
      summary_data: parsed.summary,
      total_discount: parsed.income.totalDiscount,
    },
  };
}
