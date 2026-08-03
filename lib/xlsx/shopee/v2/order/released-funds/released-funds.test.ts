import fs from 'fs';
import path from 'path';
import releasedFundsParser from './index';

// How to run: pnpm test:watch -- lib/xlsx/shopee/v2/order/released-funds/released-funds.test.ts
describe('Shopee Released Funds (v2)', () => {
  const excelPath = path.join(
    process.cwd(),
    '.data/2026/2026-07--july--released-funds--20260701_20260731.xlsx'
  );

  const buffer = fs.readFileSync(excelPath);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );

  const { version, orders } =
    releasedFundsParser(arrayBuffer);

  console.log('length', orders.length);

  it('should parse excel file from shopee released funds excel', () => {
    expect(version).toBe(2);
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBe(105);
    expect(orders[0].number).toBe(1);
    expect(orders[0].orderId).toBe('260728TDY6TYGG');
  });

  it('should match order with gratis ongkir xtra fee to -22032', () => {
    const order = orders[5];
    expect(order.GOXFee).toBe(-22032);
  });
});
