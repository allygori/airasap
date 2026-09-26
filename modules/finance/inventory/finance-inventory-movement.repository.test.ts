import { Types } from 'mongoose';
import { FinanceInventoryMovementRepository } from './finance-inventory-movement.repository';

class TestFinanceInventoryMovementRepository extends FinanceInventoryMovementRepository {
  getScopedTenantFields() {
    return this.getTenantFilter();
  }
}

describe('FinanceInventoryMovementRepository', () => {
  it('keeps inventory movement queries organization-scoped with an active store', () => {
    const repository =
      new TestFinanceInventoryMovementRepository({
        organizationId: '507f1f77bcf86cd799439010',
        storeId: '507f1f77bcf86cd799439012',
      });

    expect(repository.getScopedTenantFields()).toEqual({
      organization: new Types.ObjectId(
        '507f1f77bcf86cd799439010'
      ),
    });
  });
});
