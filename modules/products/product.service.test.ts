import fs from 'fs';
import path from 'path';
import { ProductService } from './product.service';

// How to run: pnpm test:watch -- modules/products/product.service.test.ts
describe('Product Service inside Modules', () => {
  const productService = new ProductService({
    organizationId: '0000000',
    storeId: '1111111',
  });

  const excelPath = path.join(
    process.cwd(),
    '.data/mass_update_sales_info.xlsx'
  );

  it('should parse the mock excel file correctly and insert/update products', async () => {
    const buffer = fs.readFileSync(excelPath);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    const result =
      await productService.massUploadShopeeProducts(
        arrayBuffer
      );

    expect(true).toBe(true);
    expect(result.total_rows).toBe(231);
    expect(result.total_products).toBe(29);
  });
});
