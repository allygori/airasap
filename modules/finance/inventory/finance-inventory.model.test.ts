import { FinanceInventoryItemModel } from './finance-inventory-item.model';
import { FinanceInventoryLocationModel } from './finance-inventory-location.model';
import { FinanceInventoryMappingModel } from './finance-inventory-mapping.model';
import { FinanceInventoryMovementModel } from './finance-inventory-movement.model';
import { FinanceInventoryReservationModel } from './finance-inventory-reservation.model';

describe('Finance inventory collection ownership', () => {
  it('uses Finance-owned collections for inventory persistence', () => {
    expect(
      FinanceInventoryItemModel.collection.collectionName
    ).toBe('finance_inventory_items');
    expect(
      FinanceInventoryLocationModel.collection
        .collectionName
    ).toBe('finance_inventory_locations');
    expect(
      FinanceInventoryMappingModel.collection.collectionName
    ).toBe('finance_inventory_item_mappings');
    expect(
      FinanceInventoryMovementModel.collection
        .collectionName
    ).toBe('finance_inventory_movements');
    expect(
      FinanceInventoryReservationModel.collection
        .collectionName
    ).toBe('finance_inventory_reservations');
  });

  it('uses a tenant-scoped unique source identity only for auto-prepared items', () => {
    expect(
      FinanceInventoryItemModel.schema.indexes()
    ).toContainEqual([
      { organization: 1, source_key: 1 },
      expect.objectContaining({
        unique: true,
        partialFilterExpression: {
          source_key: { $type: 'string' },
        },
      }),
    ]);
  });
});
