import type { QueryOptions } from '@/lib/api/query-builder';
import type {
  CreateInventoryLocationDTO,
  UpdateInventoryLocationDTO,
} from './inventory-location.dto';
import { InventoryLocationRepository } from './inventory-location.repository';

type InventoryLocationContext = {
  organizationId: string;
  storeId?: string;
};

export class InventoryLocationService {
  private readonly repository: InventoryLocationRepository;

  constructor(context: InventoryLocationContext) {
    this.repository = new InventoryLocationRepository(
      context
    );
  }

  getWithPagination(
    query: QueryOptions & { is_active?: boolean }
  ) {
    return this.repository.findWithQueryOptions(query, {
      searchFields: ['code', 'name', 'description'],
      baseFilter:
        query.is_active === undefined
          ? undefined
          : { is_active: query.is_active },
    });
  }

  getById(id: string) {
    return this.repository.findById(id);
  }

  create(dto: CreateInventoryLocationDTO) {
    return this.repository.create(dto);
  }

  update(id: string, dto: UpdateInventoryLocationDTO) {
    return this.repository.updateLocation(id, dto);
  }

  archive(id: string) {
    return this.repository.archiveLocation(id);
  }
}
