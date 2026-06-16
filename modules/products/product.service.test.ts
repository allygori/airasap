import fs from 'fs';
import path from 'path';
import { ProductService } from './product.service';
import parseMassProductsExcel from '@/lib/xlsx/shopee/product';

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

  it('should parse the mock excel file correctly with field mapping', async () => {
    const buffer = fs.readFileSync(excelPath);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    // const products =
    //   await parseMassProductsExcel(arrayBuffer);

    const result =
      await productService.massUploadShopeeProducts(
        arrayBuffer
      );

    // console.log(products);

    expect(true).toBe(true);
    expect(result.total_rows).toBe(231);
    expect(result.total_products).toBe(29);

    // productService.massUploadShopeeProducts()

    // const buffer = fs.readFileSync(excelPath);
    // const arrayBuffer = buffer.buffer.slice(
    //   buffer.byteOffset,
    //   buffer.byteOffset + buffer.byteLength
    // );

    // const { rows } = reader(arrayBuffer);
    // const result = parser(rows);

    // // console.log('result', result);

    // expect(Array.isArray(result)).toBe(true);
    // expect(result.length).toBeGreaterThan(0);

    // const testProductId = '58060912956';
    // const product = result.find(
    //   (row) => row.productId === testProductId
    // );

    // // console.log('product', product);

    // expect(product).toBeDefined();
    // expect(product?.productId).toBe(testProductId);
    // expect(product?.productName).toBeDefined();
    // expect(product?.price).toBeGreaterThan(0);
    // expect(product?.minimumPurchaseAmount).toBeGreaterThan(
    //   0
    // );
  });
});
