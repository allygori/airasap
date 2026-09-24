import type {
  FinanceInventoryAdjustmentItemOptionDTO,
  FinanceInventoryAdjustmentLocationOptionDTO,
} from '@/modules/finance/client';
import { createFinanceStockAdjustmentFormSchema } from './finance-stock-adjustment.schema';

const items: FinanceInventoryAdjustmentItemOptionDTO[] = [
  {
    id: '507f1f77bcf86cd799439011',
    sku: 'SKU-1',
    name: 'Produk dengan nilai',
    unit: 'pcs',
    track_value: true,
  },
  {
    id: '507f1f77bcf86cd799439012',
    sku: 'SKU-2',
    name: 'Produk quantity saja',
    unit: 'pcs',
    track_value: false,
  },
];

const locations: FinanceInventoryAdjustmentLocationOptionDTO[] =
  [
    {
      id: '507f1f77bcf86cd799439013',
      code: 'MAIN',
      name: 'Gudang utama',
    },
  ];

const validValues = {
  item_id: items[0].id,
  location_id: locations[0].id,
  direction: 'increase',
  reason: 'stock_count',
  quantity: '2',
  unit_cost: '25000',
  transaction_date: '2026-09-24',
  notes: '',
};

describe('createFinanceStockAdjustmentFormSchema', () => {
  it('requires unit cost only when the selected item tracks value', () => {
    const schema = createFinanceStockAdjustmentFormSchema(
      items,
      locations
    );

    expect(
      schema.safeParse({
        ...validValues,
        unit_cost: '',
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        ...validValues,
        item_id: items[1].id,
        unit_cost: '',
      }).success
    ).toBe(true);
  });

  it('rejects adding stock for damage or loss', () => {
    const schema = createFinanceStockAdjustmentFormSchema(
      items,
      locations
    );

    expect(
      schema.safeParse({
        ...validValues,
        reason: 'damage',
      }).success
    ).toBe(false);
  });
});
