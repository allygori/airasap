import fs from 'fs';
import path from 'path';
import { OrderService } from './order.service';

// How to run: pnpm test:watch -- modules/orders/order.service.test.ts
describe('Order Service', () => {
  const orderService = new OrderService({
    // organizationId: '0000000',
    // storeId: '1111111',
    organizationId: '6a3167e1a6e065a4c0edc4da',
    storeId: '6a3167e2a6e065a4c0edc4dc',
  });

  const excelPath = path.join(
    process.cwd(),
    '.data/Order.completed.20260501_20260522.xlsx'
  );

  it('should parse the mock excel file correctly and insert/update orders', async () => {
    const buffer = fs.readFileSync(excelPath);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    const result =
      await orderService.massUploadShopeeOrders(
        arrayBuffer
      );

    expect(true).toBe(true);
    expect(result.total_rows).toBe(39);
    expect(result.total_orders).toBe(36);
  });
});
