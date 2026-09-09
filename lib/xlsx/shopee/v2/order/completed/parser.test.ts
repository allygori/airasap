import fs from 'fs';
import path from 'path';
import reader from './reader';
import parser from './parser';

// How to run: pnpm test:watch -- lib/xlsx/shopee/v2/order/completed/parser.test.ts
describe('Shopee Order Completed Parser', () => {
  const excelPath = path.join(
    process.cwd(),
    '.data/2026/orders/2026-07--july--order-completed--20260701_20260731.xlsx'
  );

  it('should parse the mock excel file correctly with field mapping', () => {
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

    const testOrderId = '260702K6URJJD6';
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
