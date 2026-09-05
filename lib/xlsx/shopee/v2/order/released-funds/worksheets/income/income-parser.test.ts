import fs from 'fs';
import path from 'path';
import incomeParser from './index';

// How to run: pnpm test:watch -- lib/xlsx/shopee/v2/order/released-funds/worksheets/income/income-parser.test.ts
describe('Shopee Released Funds (v2) Worksheet "Penghasilan"', () => {
  const excelPath = path.join(
    process.cwd(),
    '.data/2026/orders/2026-07--july--released-funds--20260701_20260731.xlsx'
  );

  const buffer = fs.readFileSync(excelPath);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );

  const result = incomeParser(arrayBuffer);

  it('should parse penghasilan worksheet from shopee released funds excel', () => {
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].number).toBe(1);
    expect(result[result.length - 1].number).toBe(230);

    expect(result[0]).toEqual(
      expect.objectContaining({
        orderId: '260728TDY6TYGG',
        productPrice: 637000,
        buyerPayment: 635873,
        // buyerPaymentMethod: 'Online Payment',
        // originalProductPrice: 130000,
        // totalProductDiscount: -66300,
        // totalIncome: 56717,
        // courierName: 'SPX Standard',
      })
    );
  });

  it('should match gratis ongkir xtra fee to -22032', () => {
    const rowData = result[13];
    expect(rowData.GOXFee).toBe(-22032);
  });
});
