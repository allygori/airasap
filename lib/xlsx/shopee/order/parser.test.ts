import fs from 'fs';
import path from 'path';
import reader from './reader';
import parser from './parser';

// How to run: pnpm test:watch -- lib/xlsx/shopee/order/parser.test.ts
describe('Shopee Order Parser v3', () => {
  const excelPath = path.join(
    process.cwd(),
    '.data/tool-marketplace-income-report/Order.completed.20260501_20260522.xlsx'
  );

  it('should parse the mock excel file correctly with v3 field mapping', () => {
    const buffer = fs.readFileSync(excelPath);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );

    const { rows } = reader(arrayBuffer);
    const result = parser(rows);

    // console.log('result', result);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    const testOrderId = '260504GXEAWVCJ';
    const order = result.find(
      (row) => row.orderId === testOrderId
    );

    expect(order).toBeDefined();
    expect(order?.orderId).toBe(testOrderId);
    expect(order?.orderStatus).toBe('Selesai');
    expect(order?.productName).toBeDefined();
    expect(order?.quantity).toBeGreaterThan(0);
    expect(order?.totalPayment).toBeGreaterThan(0);
  });

  it('should throw an error when No. Pesanan column is missing', () => {
    const invalidRows = [
      ['Invalid Column 1', 'Invalid Column 2'],
      ['Value 1', 'Value 2'],
    ];
    expect(() => parser(invalidRows)).toThrow(
      'Format tidak sesuai: Kolom No. Pesanan tidak ditemukan di Laporan Pesanan.'
    );
  });
});
