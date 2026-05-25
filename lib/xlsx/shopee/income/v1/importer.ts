import crypto from 'crypto';
import reader from './reader';
import parser from './parser';
import { calculateCRC32, detectMimeTypeByAB, size } from '@/lib/file';

export default function importer(buffer: ArrayBuffer, filename: string) {
  const { worksheets, raw_data } = reader(buffer);
  
  const parsed = parser(raw_data);
  
  const sid = crypto.randomBytes(4).toString('hex');
  
  // Create object matching ToolMarketplaceIncomeReportSchema
  return {
    sid,
    platform: 'shopee',
    report_type: 'income_released',
    parser_version: 'shopee-income-v1',
    seller: {
      username: 'unknown'
    },
    period: {
      from: new Date(),
      to: new Date()
    },
    // products: parsed.products.map(p => ({
    //   id: p.id,
    //   name: p.name,
    //   quantity: p.quantity,
    //   cogs: p.hpp
    // })),
    summary: {
      total_income: parsed.income.grossSales,
      released_amount: parsed.income.netPayout,
      total_expense: {
        total: Object.values(parsed.income.fees).reduce((a: any, b: any) => a + b, 0),
        admin_and_service_fee: {
          items: parsed.income.fees
        }
      }
    },
    worksheets,
    // raw_data: {
    //   summary_rows: raw_data.summary_rows.slice(0, 50),
    //   income_rows: parsed.income.sampleRows,
    //   seller_fee_rows: []
    // },
    source_file: {
      original_name: filename,
      size: size(buffer),
      mime_type: detectMimeTypeByAB(buffer),
      checksum: calculateCRC32(buffer),
    },
    extra: {
      summary_data: parsed.summary,
      total_discount: parsed.income.totalDiscount,
    }
  };
}
