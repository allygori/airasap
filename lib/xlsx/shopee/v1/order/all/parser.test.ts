import fs from 'fs';
import path from 'path';
import reader from './reader';
import parser from './parser';

// How to run: pnpm test:watch -- lib/xlsx/shopee/order/all/parser.test.ts
describe('Shopee All Order Parser', () => {
  const excelPath = path.join(
    process.cwd(),
    '.data/2026/2026-06--june-order-all--20260601_20260630.xlsx'
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

    const testOrderId = '26060234FPM7HD';
    const order = result.find(
      (row) => row.id === testOrderId
    );

    expect(order).toBeDefined();
    expect(order?.id).toBe(testOrderId);
    expect(order?.status).toBe('Selesai');
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
      'Format tidak sesuai: Kolom No. Pesanan tidak ditemukan di file "Laporan Semua Pesanan".'
    );
  });
});
