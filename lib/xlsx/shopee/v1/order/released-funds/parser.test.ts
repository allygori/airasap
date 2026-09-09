import fs from 'fs';
import path from 'path';
import reader from './reader';
import parser from './parser';

// How to run: pnpm test -- lib/xlsx/shopee/v1/order/released-funds/parser.test.ts
describe('Shopee Released Funds Parser v1', () => {
  const excelPath = path.join(
    process.cwd(),
    '.data/2026/orders/2026-04--april--released-funds--20260401_20260430.xlsx'
  );

  it('should parse all worksheets from income released excel', () => {
    const buffer = fs.readFileSync(excelPath);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );

    const { raw_data } = reader(arrayBuffer);
    const result = parser(raw_data);

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
        value: 1693110,
      })
    );

    expect(Array.isArray(result.income)).toBe(true);
    expect(result.income.length).toBe(16);
    expect(result.income[0]).toEqual(
      expect.objectContaining({
        orderId: '260421DBBWYGAW',
        buyerUsername: 'yusrianas15',
        buyerPaymentMethod: 'Saldo ShopeePay',
        originalProductPrice: 64900,
        totalProductDiscount: -14927,
        shippingCostPaidByBuyer: 24000,
        freeShippingFromShopee: 15000,
        shippingCostForwardedByShopee: -39000,
        totalIncome: 44225,
        courierName: 'SPX Standard',
      })
    );

    expect(Array.isArray(result.sellerFee)).toBe(true);
    expect(result.sellerFee.length).toBe(41);
    expect(result.sellerFee[0]).toEqual(
      expect.objectContaining({
        number: 1,
        rowType: 'Order',
        orderId: '26032792XER8VH',
        productId: '-',
        productName: '-',
        orderProcessingFee: -1250,
      })
    );
  });
});
