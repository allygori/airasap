import {
  matchProductAndVariant,
  resolveProductCost,
} from './product-matching';

describe('product matching and COGS resolution', () => {
  const products = [
    {
      product_id: 'product-1',
      parent_sku: 'PARENT-1',
      name: 'Nama Terbaru',
      name_history: ['Nama Lama'],
      variants: [
        {
          variant_id: 'variant-1',
          child_sku: 'CHILD-1',
          name: 'Merah',
          name_history: ['Red'],
          default_cost: 15000,
          costs: [
            {
              effective_from: '2025-01-01T00:00:00.000Z',
              cogs_unit: 10000,
            },
            {
              effective_from: '2026-01-01T00:00:00.000Z',
              cogs_unit: 12000,
            },
          ],
        },
      ],
    },
  ];

  it('matches product and variant using historical names', () => {
    const result = matchProductAndVariant(products, {
      productName: 'Nama Lama',
      variationName: 'Red',
    });

    expect(result.product?.product_id).toBe('product-1');
    expect(result.variant?.variant_id).toBe('variant-1');
    expect(result.productMatchStatus).toBe('matched');
    expect(result.matchMethod).toBe('history');
  });

  it('prefers SKU matching over names', () => {
    const result = matchProductAndVariant(products, {
      productName: 'Nama yang berbeda',
      parentSku: 'PARENT-1',
      childSku: 'CHILD-1',
    });

    expect(result.productMatchStatus).toBe('matched');
    expect(result.matchMethod).toBe('sku');
    expect(result.variant?.child_sku).toBe('CHILD-1');
  });

  it('selects the latest COGS effective on the order date', () => {
    const result = resolveProductCost(
      products[0].variants[0],
      '2026-06-01T00:00:00.000Z'
    );

    expect(result).toEqual({
      productCost: 12000,
      cogsStatus: 'resolved',
    });
  });

  it('falls back to default cost but remains unresolved', () => {
    const result = resolveProductCost(
      products[0].variants[0],
      '2024-06-01T00:00:00.000Z'
    );

    expect(result).toEqual({
      productCost: 15000,
      cogsStatus: 'unresolved',
    });
  });
});
