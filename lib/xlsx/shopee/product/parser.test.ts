import fs from 'fs';
import path from 'path';
import reader from './reader';
import parser from './parser';

// How to run: pnpm test:watch -- lib/xlsx/shopee/product/parser.test.ts
describe('Shopee Mass Update Sales Info Parse Excel', () => {
  const excelPath = path.join(
    process.cwd(),
    '.data/mass_update_sales_info.xlsx'
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

    const testProductId = '58060912956';
    const product = result.find(
      (row) => row.productId === testProductId
    );

    // console.log('product', product);

    expect(product).toBeDefined();
    expect(product?.productId).toBe(testProductId);
    expect(product?.productName).toBeDefined();
    expect(product?.price).toBeGreaterThan(0);
    expect(product?.minimumPurchaseAmount).toBeGreaterThan(
      0
    );
  });

  it('should throw an error when Kode Produk column is missing', () => {
    const invalidRows = [
      ['Invalid Column 1', 'Invalid Column 2'],
      ['Value 1', 'Value 2'],
    ];
    expect(() => parser(invalidRows)).toThrow(
      'Format tidak sesuai: Kolom Kode Produk tidak ditemukan di file excel.'
    );
  });
});
