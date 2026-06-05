import fs from 'fs';
import path from 'path';
import reader from './reader';
import parser from './parser';

describe('Shopee Order Parser v2', () => {
  const excelPath = path.join(
    process.cwd(),
    '.data/tool-marketplace-income-report/Order.completed.20260501_20260522.xlsx'
  );

  it('should parse the mock excel file correctly with v2 db mapping', () => {
    const buffer = fs.readFileSync(excelPath);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );

    const { rows } = reader(arrayBuffer);
    const result = parser(rows);

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBeGreaterThan(0);

    const testOrderId = '260504GXEAWVCJ';
    expect(result.has(testOrderId)).toBe(true);

    const order = result.get(testOrderId)!;
    expect(order.order_id).toBe(testOrderId);
    expect(order.status).toBe('Selesai');
    expect(order.items.length).toBeGreaterThan(0);
    expect(order.items[0].product_name).toBeDefined();
    expect(order.items[0].quantity).toBeGreaterThan(0);
    expect(order.total_payment).toBeGreaterThan(0);
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
