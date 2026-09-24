import { createFinanceOfflineSaleFormSchema } from './finance-offline-sale-form.schema';

const product = {
  key: 'product-one',
  product_id: '0123456789abcdef01234567',
  product_name: 'Produk Satu',
  sku: 'SKU-1',
  inventory_item_id: '1123456789abcdef01234567',
  inventory_item_name: 'Produk Satu',
  inventory_sku: 'SKU-1',
  unit: 'pcs',
  available_quantity: 3,
};

const options = {
  products: [product],
  payment_accounts: [
    {
      id: '2123456789abcdef01234567',
      code: '1001',
      name: 'Kas Utama',
      subtype: 'cash' as const,
    },
  ],
};

const validSale = {
  transaction_date: '2026-09-24',
  payment_account_id: options.payment_accounts[0].id,
  reference: '',
  lines: [
    {
      line_key: 'line-one',
      product_key: product.key,
      quantity: '2',
      unit_price: '125000',
    },
  ],
};

describe('FinanceOfflineSaleFormSchema', () => {
  it('accepts a sale within available stock', () => {
    expect(
      createFinanceOfflineSaleFormSchema(options).safeParse(
        validSale
      ).success
    ).toBe(true);
  });

  it('rejects a line quantity greater than available stock', () => {
    expect(
      createFinanceOfflineSaleFormSchema(options).safeParse(
        {
          ...validSale,
          lines: [{ ...validSale.lines[0], quantity: '4' }],
        }
      ).success
    ).toBe(false);
  });

  it('rejects duplicate lines whose combined quantity exceeds stock', () => {
    expect(
      createFinanceOfflineSaleFormSchema(options).safeParse(
        {
          ...validSale,
          lines: [
            { ...validSale.lines[0], quantity: '2' },
            {
              ...validSale.lines[0],
              line_key: 'line-two',
              quantity: '2',
            },
          ],
        }
      ).success
    ).toBe(false);
  });
});
