import { Types } from 'mongoose';
import type { QueryOptions } from '@/lib/api/query-builder';
import { InventoryItemRepository } from '@/modules/inventory/items/inventory-item.repository';
import { ProductRepository } from '@/modules/products/product.repository';
import type {
  CreateInventoryItemMappingDTO,
  InventoryItemMappingBaseDTO,
  UpdateInventoryItemMappingDTO,
} from './inventory-item-mapping.dto';
import { InventoryItemMappingRepository } from './inventory-item-mapping.repository';

type InventoryItemMappingContext = {
  organizationId: string;
  storeId?: string;
};

const getVariantKey = (variantId?: string) =>
  variantId?.trim() || '__product__';

export class InventoryItemMappingService {
  private readonly repository: InventoryItemMappingRepository;
  private readonly itemRepository: InventoryItemRepository;
  private readonly productRepository: ProductRepository;

  constructor(context: InventoryItemMappingContext) {
    this.repository = new InventoryItemMappingRepository(
      context
    );
    this.itemRepository = new InventoryItemRepository(
      context
    );
    this.productRepository = new ProductRepository(context);
  }

  getWithPagination(
    query: QueryOptions & {
      is_active?: boolean;
      product?: string;
      inventory_item?: string;
      mapping_method?: InventoryItemMappingBaseDTO['mapping_method'];
    }
  ) {
    return this.repository.findWithMappings(query, query);
  }

  getById(id: string) {
    return this.repository.findMappingById(id);
  }

  findActiveByProductVariant(
    productId: string,
    variantId?: string,
    session?: Parameters<
      InventoryItemMappingRepository['findActiveByProductVariant']
    >[2]
  ) {
    return this.repository.findActiveByProductVariant(
      productId,
      variantId,
      session
    );
  }

  async create(dto: CreateInventoryItemMappingDTO) {
    const references = await this.validateReferences(
      dto.product,
      dto.inventory_item
    );
    return this.repository.createMapping({
      product: references.product._id,
      variant_id: dto.variant_id,
      variant_key: getVariantKey(dto.variant_id),
      inventory_item: references.inventoryItem._id,
      mapping_method: dto.mapping_method,
      is_active: dto.is_active,
      notes: dto.notes,
    });
  }

  async update(
    id: string,
    dto: UpdateInventoryItemMappingDTO
  ) {
    const current =
      await this.repository.findMappingById(id);
    if (!current) return null;

    const productId =
      dto.product ?? String(current.product._id);
    const inventoryItemId =
      dto.inventory_item ??
      String(current.inventory_item._id);
    const references = await this.validateReferences(
      productId,
      inventoryItemId
    );
    const variantId =
      dto.variant_id === undefined
        ? current.variant_id
        : dto.variant_id;

    return this.repository.updateMapping(id, {
      product: references.product._id,
      variant_id: variantId,
      variant_key: getVariantKey(variantId),
      inventory_item: references.inventoryItem._id,
      ...(dto.mapping_method === undefined
        ? {}
        : { mapping_method: dto.mapping_method }),
      ...(dto.is_active === undefined
        ? {}
        : { is_active: dto.is_active }),
      ...(dto.notes === undefined
        ? {}
        : { notes: dto.notes }),
    });
  }

  archive(id: string) {
    return this.repository.archiveMapping(id);
  }

  private async validateReferences(
    productId: string,
    inventoryItemId: string
  ) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new Error('Product ID tidak valid.');
    }
    if (!Types.ObjectId.isValid(inventoryItemId)) {
      throw new Error('Inventory item ID tidak valid.');
    }

    const [product, inventoryItem] = await Promise.all([
      this.productRepository.findById(productId),
      this.itemRepository.findItemById(inventoryItemId),
    ]);
    if (!product) {
      throw new Error(
        'Product tidak ditemukan pada store/organization aktif.'
      );
    }
    if (!inventoryItem) {
      throw new Error(
        'Inventory item tidak ditemukan pada organization aktif.'
      );
    }
    if (!inventoryItem.is_active) {
      throw new Error(
        'Inventory item yang dipetakan harus berstatus aktif.'
      );
    }
    if (inventoryItem.item_type !== 'merchandise') {
      throw new Error(
        'Product mapping harus menunjuk inventory item bertipe merchandise.'
      );
    }

    return { product, inventoryItem };
  }
}
