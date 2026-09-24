import {
  ProductRepository,
  type ProductInventorySourceRecord,
} from './product.repository';

/**
 * Narrow, read-only catalog boundary for organization-scoped inventory setup.
 * Omitting storeId intentionally includes all stores in the organization.
 */
export class ProductInventorySourceService {
  private readonly repository: ProductRepository;

  constructor(context: { organizationId: string }) {
    this.repository = new ProductRepository(context);
  }

  listActiveInventorySources(input: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{
    records: ProductInventorySourceRecord[];
    total: number;
  }> {
    return this.repository.listActiveInventorySources(
      input
    );
  }

  getActiveInventorySourceById(
    id: string
  ): Promise<ProductInventorySourceRecord | null> {
    return this.repository.findActiveInventorySourceById(
      id
    );
  }
}
