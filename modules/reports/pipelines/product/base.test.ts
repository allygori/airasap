import { aggregateProductSalesReport } from './base';

const ORGANIZATION_ID = '6a64d53fb427fb66c352640a';
const STORE_ID = '6a64d540b427fb66c352640c';

// How to run: pnpm test -- modules/reports/pipelines/product/base.test.ts
describe('Product Sales Report ', () => {
  const startDate = '2026-07-31T17:00:00.000Z';
  const endDate = '2026-08-31T16:59:59.999Z';

  const pipelines = aggregateProductSalesReport({
    startDate,
    endDate,
    tenantContext: {
      organizationId: ORGANIZATION_ID,
      storeId: STORE_ID,
    },
    filterBy: 'placed_at',
    tz: 'Asia/Jakarta',
  });

  it('Should return true', async () => {
    expect(true).toBe(true);
  });

  // const orderService = new OrderService({
  //   // organizationId: '0000000',
  //   // storeId: '1111111',
  //   organizationId: '6a3167e1a6e065a4c0edc4da',
  //   storeId: '6a3167e2a6e065a4c0edc4dc',
  // });

  // const excelPath = path.join(
  //   process.cwd(),
  //   '.data/Order.completed.20260501_20260522.xlsx'
  // );

  // it('should parse the mock excel file correctly and insert/update orders', async () => {
  //   const buffer = fs.readFileSync(excelPath);
  //   const arrayBuffer = buffer.buffer.slice(
  //     buffer.byteOffset,
  //     buffer.byteOffset + buffer.byteLength
  //   );
  //   const result =
  //     await orderService.massUploadShopeeOrders(
  //       arrayBuffer
  //     );

  //   expect(true).toBe(true);
  //   expect(result.total_rows).toBe(39);
  //   expect(result.total_orders).toBe(36);
  // });
});
