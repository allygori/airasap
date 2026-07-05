import fs from 'fs';
import path from 'path';
import reader from './reader';
import parser from './parser';

// How to run: pnpm jest -- lib/xlsx/shopee/profit-intelligence/v3/income/parser.test.ts
describe('Shopee Income Parser v3', () => {
  const excelPath = path.join(
    process.cwd(),
    '.data/tool-marketplace-income-report/Income.sudah dilepas.id.xlsx'
  );

  it('should parse all worksheets from income released excel', () => {
    const buffer = fs.readFileSync(excelPath);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );

    const { raw_data } = reader(arrayBuffer);
    const result = parser(raw_data);

    console.log('result:', result);

    expect(result.summary.metadata.sellerUsername).toBe(
      'katalis.dental'
    );
    expect(result.summary.entries.length).toBeGreaterThan(
      0
    );
    expect(
      result.summary.entries.find(
        (entry: { label: string }) =>
          entry.label === '1. Total Pendapatan'
      )
    ).toEqual(
      expect.objectContaining({
        label: '1. Total Pendapatan',
        value: 2739786,
      })
    );

    expect(Array.isArray(result.income)).toBe(true);
    expect(result.income.length).toBeGreaterThan(0);
    expect(result.income[0]).toEqual(
      expect.objectContaining({
        noOrder: '260517KK7XQP5E',
        buyerUsername: 'dipokentjono',
        buyerPaymentMethod: 'Online Payment',
        originalProductPrice: 130000,
        totalProductDiscount: -66300,
        totalIncome: 56717,
        courierName: 'SPX Standard',
      })
    );

    expect(Array.isArray(result.sellerFee)).toBe(true);
    expect(result.sellerFee.length).toBeGreaterThan(0);
    expect(result.sellerFee[0]).toEqual(
      expect.objectContaining({
        number: 1,
        rowType: 'Order',
        noOrder: '2604281E6F28GG',
        productId: '-',
        productName: '-',
        orderProcessingFee: -1250,
      })
    );
  });
});
