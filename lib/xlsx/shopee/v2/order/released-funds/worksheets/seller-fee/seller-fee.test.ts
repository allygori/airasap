import fs from 'fs';
import path from 'path';
import incomeParser from './index';

// How to run: pnpm test:watch -- lib/xlsx/shopee/v2/order/released-funds/worksheets/seller-fee/seller-fee.test.ts
describe('Shopee Released Funds (v2) Worksheet "Seller Fee"', () => {
  const excelPath = path.join(
    process.cwd(),
    '.data/2026/2026-07--july--released-funds--20260701_20260731.xlsx'
  );

  const buffer = fs.readFileSync(excelPath);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );

  const result = incomeParser(arrayBuffer);

  it('should parse worksheet from shopee released funds excel', () => {
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].number).toBe(1);
    expect(result[result.length - 1].number).toBe(105);

    expect(result[0]).toEqual(
      expect.objectContaining({
        orderId: '260727RNY3KX17',
        platformFee: -5748,
        GOXFee: -2998,
      })
    );
  });

  it('should match gratis ongkir xtra fee to -22032', () => {
    const rowData = result[7];
    expect(rowData.GOXFee).toBe(-22032);
  });
});
