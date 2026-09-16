import type { QueryOptions } from '@/lib/api/query-builder';
import type {
  InventoryItemBaseDTO,
  CreateInventoryItemDTO,
  UpdateInventoryItemDTO,
} from './inventory-item.dto';
import { InventoryItemRepository } from './inventory-item.repository';

type InventoryItemContext = {
  organizationId: string;
  storeId?: string;
};

export class InventoryItemService {
  private readonly repository: InventoryItemRepository;

  constructor(context: InventoryItemContext) {
    this.repository = new InventoryItemRepository(context);
  }

  getWithPagination(
    query: QueryOptions & {
      item_type?: InventoryItemBaseDTO['item_type'];
      is_active?: boolean;
    }
  ) {
    return this.repository.findWithQueryOptions(query, {
      searchFields: ['sku', 'name', 'description'],
      baseFilter: {
        ...(query.item_type
          ? { item_type: query.item_type }
          : {}),
        ...(query.is_active !== undefined
          ? { is_active: query.is_active }
          : {}),
      },
    });
  }

  getById(id: string) {
    return this.repository.findById(id);
  }

  create(dto: CreateInventoryItemDTO) {
    return this.repository.create(dto);
  }

  async update(id: string, dto: UpdateInventoryItemDTO) {
    return this.repository.updateItem(id, dto);
  }

  archive(id: string) {
    return this.repository.archiveItem(id);
  }
}
