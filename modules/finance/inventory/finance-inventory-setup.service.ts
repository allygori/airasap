import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import { FinanceLifecycleService } from '../finance-lifecycle.service';
import { ProductInventorySourceService } from '@/modules/products';
import type { ProductInventorySourceRecord } from '@/modules/products';
import type {
  FinanceInventorySetupActionInputDTO,
  FinanceInventorySetupActionResponseDTO,
  FinanceInventorySetupProductOptionDTO,
  FinanceInventorySetupQueryDTO,
  FinanceInventorySetupResponseDTO,
} from './finance-inventory.dto';
import {
  FinanceInventorySetupActionResponseSchema,
  FinanceInventorySetupActionSchema,
  FinanceInventorySetupQuerySchema,
  FinanceInventorySetupResponseSchema,
} from './finance-inventory.schema';
import {
  FinanceInventoryItemRepository,
  type CreateFinanceInventoryItemRecord,
  type FinanceInventoryItemPersistenceRecord,
} from './finance-inventory-item.repository';
import {
  FinanceInventoryLocationRepository,
  type FinanceInventoryLocationPersistenceRecord,
} from './finance-inventory-location.repository';
import {
  FinanceInventoryMappingRepository,
  type FinanceInventoryMappingPersistenceRecord,
} from './finance-inventory-mapping.repository';

type FinanceInventorySetupLifecyclePort = Pick<
  FinanceLifecycleService,
  'getState' | 'assertOwner'
>;

type FinanceInventorySetupItemRepositoryPort = Pick<
  FinanceInventoryItemRepository,
  | 'listActive'
  | 'findBySku'
  | 'findBySourceKey'
  | 'findActiveById'
  | 'findActiveByIds'
  | 'createInventoryItem'
  | 'ensureInventoryItemFromProduct'
>;

type FinanceInventorySetupLocationRepositoryPort = Pick<
  FinanceInventoryLocationRepository,
  'listActive' | 'ensureDefaultLocation'
>;

type FinanceInventorySetupMappingRepositoryPort = Pick<
  FinanceInventoryMappingRepository,
  'listActiveForProductIds' | 'upsertActive'
>;

type FinanceInventorySetupProductPort = Pick<
  ProductInventorySourceService,
  | 'listActiveInventorySources'
  | 'getActiveInventorySourceById'
>;

const toSetupItem = (
  item: FinanceInventoryItemPersistenceRecord
) => ({
  id: String(item._id),
  sku: item.sku,
  name: item.name,
  item_type: item.item_type,
  unit: item.unit,
  track_quantity: item.track_quantity,
  track_value: item.track_value,
});

const toSetupLocation = (
  location: FinanceInventoryLocationPersistenceRecord
) => ({
  id: String(location._id),
  code: location.code,
  name: location.name,
});

const variantKey = (variantId?: string) =>
  variantId ?? '__product__';

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 11000;

type FlattenedProductOption = {
  key: string;
  product_id: string;
  product_name: string;
  platform?: ProductInventorySourceRecord['platform'];
  variant_id?: string;
  variant_name?: string;
  sku: string | null;
};

const flattenProductOptions = (
  product: ProductInventorySourceRecord
): FlattenedProductOption[] => {
  if (product.has_variation) {
    return product.variants
      .filter(
        (variant) =>
          variant.variant_id.length > 0 &&
          variant.variant_id.trim() === variant.variant_id
      )
      .map((variant) => ({
        key: `${String(product._id)}:${variant.variant_id}`,
        product_id: String(product._id),
        product_name: product.name,
        platform: product.platform,
        variant_id: variant.variant_id,
        variant_name: variant.name,
        sku: variant.child_sku?.trim() || null,
      }));
  }

  return [
    {
      key: `${String(product._id)}:__product__`,
      product_id: String(product._id),
      product_name: product.name,
      platform: product.platform,
      sku: product.parent_sku?.trim() || null,
    },
  ];
};

type ProductPreparationResult = {
  product_id: string;
  product_name: string;
  variant_id?: string;
  variant_name?: string;
  sku: string | null;
  status: 'prepared' | 'already_mapped' | 'needs_review';
  review_reason?:
    | 'missing_sku'
    | 'duplicate_source_sku'
    | 'existing_inventory_sku'
    | 'source_item_unavailable';
  matched_item?: { id: string; name: string };
};

export class FinanceInventorySetupService {
  private readonly lifecycle: FinanceInventorySetupLifecyclePort;
  private readonly itemRepository: FinanceInventorySetupItemRepositoryPort;
  private readonly locationRepository: FinanceInventorySetupLocationRepositoryPort;
  private readonly mappingRepository: FinanceInventorySetupMappingRepositoryPort;
  private readonly productService: FinanceInventorySetupProductPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      lifecycle?: FinanceInventorySetupLifecyclePort;
      itemRepository?: FinanceInventorySetupItemRepositoryPort;
      locationRepository?: FinanceInventorySetupLocationRepositoryPort;
      mappingRepository?: FinanceInventorySetupMappingRepositoryPort;
      productService?: FinanceInventorySetupProductPort;
    }
  ) {
    assertFinanceTenant(context);
    this.lifecycle =
      dependencies?.lifecycle ??
      new FinanceLifecycleService(context);
    this.itemRepository =
      dependencies?.itemRepository ??
      new FinanceInventoryItemRepository(context);
    this.locationRepository =
      dependencies?.locationRepository ??
      new FinanceInventoryLocationRepository(context);
    this.mappingRepository =
      dependencies?.mappingRepository ??
      new FinanceInventoryMappingRepository(context);
    // Finance inventory is organization-scoped. Omitting storeId intentionally
    // makes catalog products from all organization stores available here.
    this.productService =
      dependencies?.productService ??
      new ProductInventorySourceService({
        organizationId: context.organizationId,
      });
  }

  async getSetup(
    input: FinanceInventorySetupQueryDTO | unknown = {}
  ): Promise<FinanceInventorySetupResponseDTO> {
    await this.assertSetupAccess();
    const query =
      FinanceInventorySetupQuerySchema.parse(input);
    const [productPage, itemPage, locations] =
      await Promise.all([
        this.productService.listActiveInventorySources({
          page: query.page,
          limit: query.limit,
          search: query.search,
        }),
        this.itemRepository.listActive({
          page: 1,
          limit: 100,
          search: query.item_search,
        }),
        this.locationRepository.listActive(),
      ]);

    const productIds = productPage.records.map((product) =>
      String(product._id)
    );
    const mappings =
      await this.mappingRepository.listActiveForProductIds(
        productIds
      );
    const mappedItemIds = mappings.map((mapping) =>
      String(mapping.inventory_item)
    );
    const mappedItems =
      await this.itemRepository.findActiveByIds(
        mappedItemIds
      );
    const itemById = new Map(
      mappedItems.map((item) => [String(item._id), item])
    );
    const mappingByProductVariant = new Map<
      string,
      FinanceInventoryMappingPersistenceRecord
    >();
    for (const mapping of mappings) {
      mappingByProductVariant.set(
        `${String(mapping.product)}:${mapping.variant_key}`,
        mapping
      );
    }

    const productOptions: FinanceInventorySetupProductOptionDTO[] =
      productPage.records.flatMap((product) =>
        flattenProductOptions(product).map((option) => {
          const optionVariantId =
            'variant_id' in option
              ? option.variant_id
              : undefined;
          const exactMapping = mappingByProductVariant.get(
            `${option.product_id}:${variantKey(optionVariantId)}`
          );
          const inheritedMapping = optionVariantId
            ? mappingByProductVariant.get(
                `${option.product_id}:__product__`
              )
            : undefined;
          const mapping = exactMapping ?? inheritedMapping;
          const mappedItem = mapping
            ? itemById.get(String(mapping.inventory_item))
            : undefined;

          return {
            ...option,
            mapped_inventory_item: mappedItem
              ? toSetupItem(mappedItem)
              : null,
          };
        })
      );
    const defaultLocation = locations.find(
      (location) => location.code === 'MAIN'
    );

    return FinanceInventorySetupResponseSchema.parse({
      product_options: productOptions,
      product_pagination: {
        page: query.page,
        limit: query.limit,
        total: productPage.total,
        total_pages: Math.ceil(
          productPage.total / query.limit
        ),
      },
      inventory_items: itemPage.records.map(toSetupItem),
      inventory_item_pagination: {
        page: 1,
        limit: 100,
        total: itemPage.total,
        total_pages: Math.ceil(itemPage.total / 100),
      },
      default_location: defaultLocation
        ? toSetupLocation(defaultLocation)
        : null,
    });
  }

  async perform(
    input: FinanceInventorySetupActionInputDTO | unknown
  ): Promise<FinanceInventorySetupActionResponseDTO> {
    await this.assertSetupAccess();
    const action =
      FinanceInventorySetupActionSchema.parse(input);

    if (action.action === 'ensure_default_location') {
      const location =
        await this.locationRepository.ensureDefaultLocation();
      return FinanceInventorySetupActionResponseSchema.parse(
        {
          action: action.action,
          location: toSetupLocation(location),
        }
      );
    }

    if (action.action === 'create_manual') {
      const location =
        await this.locationRepository.ensureDefaultLocation();
      const item = await this.createItem({
        sku: action.sku,
        name: action.name,
        item_type: action.item_type,
        unit: action.unit,
        track_quantity: action.track_quantity,
        track_value: action.track_value,
      });

      return FinanceInventorySetupActionResponseSchema.parse(
        {
          action: action.action,
          item: toSetupItem(item),
          location: toSetupLocation(location),
        }
      );
    }

    if (action.action === 'prepare_from_products') {
      return this.prepareFromProducts(action);
    }

    const product =
      await this.productService.getActiveInventorySourceById(
        action.product_id
      );
    if (!product) {
      throw new FinanceDomainError(
        'Produk aktif tidak ditemukan pada organisasi ini.',
        'FINANCE_INVENTORY_PRODUCT_NOT_FOUND'
      );
    }
    const selected = this.getSelectedProduct(
      product,
      action.variant_id
    );
    const location =
      await this.locationRepository.ensureDefaultLocation();

    if (action.action === 'map_product') {
      const item = await this.itemRepository.findActiveById(
        action.inventory_item_id
      );
      if (
        !item ||
        item.item_type !== 'merchandise' ||
        !item.track_quantity
      ) {
        throw new FinanceDomainError(
          'Pilih item merchandise aktif yang melacak quantity.',
          'FINANCE_INVENTORY_MAPPING_ITEM_INVALID'
        );
      }

      await this.saveMapping({
        product_id: String(product._id),
        ...(selected.variant_id
          ? { variant_id: selected.variant_id }
          : {}),
        inventory_item_id: String(item._id),
      });

      return FinanceInventorySetupActionResponseSchema.parse(
        {
          action: action.action,
          item: toSetupItem(item),
          location: toSetupLocation(location),
          mapping_created: true,
        }
      );
    }

    const sku = action.sku?.trim() || selected.sku;
    if (!sku) {
      throw new FinanceDomainError(
        'SKU wajib diisi karena produk ini belum memiliki SKU sumber.',
        'FINANCE_INVENTORY_ITEM_SKU_REQUIRED'
      );
    }
    const itemName =
      action.name?.trim() ||
      (selected.variant_name
        ? `${product.name} — ${selected.variant_name}`
        : product.name);
    const existingMapping = await this.mappingRepository
      .listActiveForProductIds([String(product._id)])
      .then((records) =>
        records.find(
          (record) =>
            record.variant_key ===
            variantKey(selected.variant_id)
        )
      );
    if (existingMapping) {
      throw new FinanceDomainError(
        'Produk atau variasi ini sudah dipetakan. Gunakan aksi hubungkan ke item yang sudah ada untuk mengganti tujuan mapping.',
        'FINANCE_INVENTORY_PRODUCT_ALREADY_MAPPED'
      );
    }

    const item = await this.createItem({
      sku,
      name: itemName,
      item_type: 'merchandise',
      unit: action.unit,
      track_quantity: action.track_quantity,
      track_value: action.track_value,
    });
    await this.saveMapping({
      product_id: String(product._id),
      ...(selected.variant_id
        ? { variant_id: selected.variant_id }
        : {}),
      inventory_item_id: String(item._id),
    });

    return FinanceInventorySetupActionResponseSchema.parse({
      action: action.action,
      item: toSetupItem(item),
      location: toSetupLocation(location),
      mapping_created: true,
    });
  }

  private async createItem(
    data: CreateFinanceInventoryItemRecord
  ): Promise<FinanceInventoryItemPersistenceRecord> {
    const existing = await this.itemRepository.findBySku(
      data.sku
    );
    if (existing) {
      throw new FinanceDomainError(
        existing.is_active
          ? 'SKU ini sudah digunakan. Hubungkan produk ke item Finance yang sudah ada, atau gunakan SKU lain.'
          : 'SKU ini pernah dipakai oleh item nonaktif. Gunakan SKU lain agar histori tetap jelas.',
        'FINANCE_INVENTORY_ITEM_SKU_CONFLICT'
      );
    }

    try {
      return await this.itemRepository.createInventoryItem(
        data
      );
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new FinanceDomainError(
          'SKU ini sudah digunakan oleh item Finance lain.',
          'FINANCE_INVENTORY_ITEM_SKU_CONFLICT'
        );
      }
      throw error;
    }
  }

  private async saveMapping(data: {
    product_id: string;
    variant_id?: string;
    inventory_item_id: string;
    mapping_method?: 'manual_setup' | 'auto_product_setup';
  }): Promise<void> {
    try {
      await this.mappingRepository.upsertActive(data);
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new FinanceDomainError(
          'Mapping produk ini baru saja dibuat. Muat ulang halaman dan periksa item yang terhubung.',
          'FINANCE_INVENTORY_PRODUCT_ALREADY_MAPPED'
        );
      }
      throw error;
    }
  }

  private async prepareFromProducts(
    input: Extract<
      FinanceInventorySetupActionInputDTO,
      { action: 'prepare_from_products' }
    >
  ): Promise<FinanceInventorySetupActionResponseDTO> {
    const productPage =
      await this.productService.listActiveInventorySources({
        page: input.page,
        limit: input.limit,
        search: input.search,
      });
    const options = productPage.records.flatMap(
      flattenProductOptions
    );
    const productIds = [
      ...new Set(
        options.map((option) => option.product_id)
      ),
    ];
    const existingMappings =
      await this.mappingRepository.listActiveForProductIds(
        productIds
      );
    const mappingKeys = new Set(
      existingMappings.map(
        (mapping) =>
          `${String(mapping.product)}:${mapping.variant_key}`
      )
    );
    const skuCounts = new Map<string, number>();
    for (const option of options) {
      if (!option.sku) continue;
      const normalizedSku = option.sku.toLowerCase();
      skuCounts.set(
        normalizedSku,
        (skuCounts.get(normalizedSku) ?? 0) + 1
      );
    }

    const results: ProductPreparationResult[] = [];
    let defaultLocation:
      | FinanceInventoryLocationPersistenceRecord
      | undefined;

    const addResult = (
      option: FlattenedProductOption,
      result: Pick<
        ProductPreparationResult,
        'status' | 'review_reason' | 'matched_item'
      >
    ) => {
      results.push({
        product_id: option.product_id,
        product_name: option.product_name,
        ...(option.variant_id
          ? { variant_id: option.variant_id }
          : {}),
        ...(option.variant_name
          ? { variant_name: option.variant_name }
          : {}),
        sku: option.sku,
        ...result,
      });
    };

    for (const option of options) {
      const key = `${option.product_id}:${variantKey(
        option.variant_id
      )}`;
      const inheritedProductMapping = option.variant_id
        ? mappingKeys.has(
            `${option.product_id}:__product__`
          )
        : false;
      if (mappingKeys.has(key) || inheritedProductMapping) {
        addResult(option, { status: 'already_mapped' });
        continue;
      }

      if (!option.sku) {
        addResult(option, {
          status: 'needs_review',
          review_reason: 'missing_sku',
        });
        continue;
      }

      if (
        (skuCounts.get(option.sku.toLowerCase()) ?? 0) > 1
      ) {
        addResult(option, {
          status: 'needs_review',
          review_reason: 'duplicate_source_sku',
        });
        continue;
      }

      const sourceKey = `${option.product_id}:${variantKey(
        option.variant_id
      )}`;
      let item =
        await this.itemRepository.findBySourceKey(
          sourceKey
        );
      if (
        item &&
        (!item.is_active ||
          item.item_type !== 'merchandise' ||
          !item.track_quantity)
      ) {
        addResult(option, {
          status: 'needs_review',
          review_reason: 'source_item_unavailable',
          matched_item: {
            id: String(item._id),
            name: item.name,
          },
        });
        continue;
      }

      if (!item) {
        const matchingSku =
          await this.itemRepository.findBySku(option.sku);
        if (matchingSku) {
          addResult(option, {
            status: 'needs_review',
            review_reason: 'existing_inventory_sku',
            matched_item: {
              id: String(matchingSku._id),
              name: matchingSku.name,
            },
          });
          continue;
        }

        const itemName = option.variant_name
          ? `${option.product_name} — ${option.variant_name}`
          : option.product_name;
        try {
          item =
            await this.itemRepository.ensureInventoryItemFromProduct(
              {
                source_key: sourceKey,
                sku: option.sku,
                name: itemName,
                item_type: 'merchandise',
                unit: 'pcs',
                track_quantity: true,
                track_value: true,
              }
            );
        } catch (error: unknown) {
          if (!isDuplicateKeyError(error)) throw error;
          const conflictingSku =
            await this.itemRepository.findBySku(option.sku);
          if (!conflictingSku) throw error;
          addResult(option, {
            status: 'needs_review',
            review_reason: 'existing_inventory_sku',
            matched_item: {
              id: String(conflictingSku._id),
              name: conflictingSku.name,
            },
          });
          continue;
        }
      }

      defaultLocation ??=
        await this.locationRepository.ensureDefaultLocation();
      await this.saveMapping({
        product_id: option.product_id,
        ...(option.variant_id
          ? { variant_id: option.variant_id }
          : {}),
        inventory_item_id: String(item._id),
        mapping_method: 'auto_product_setup',
      });
      addResult(option, { status: 'prepared' });
    }

    const summary = {
      prepared: results.filter(
        (result) => result.status === 'prepared'
      ).length,
      already_mapped: results.filter(
        (result) => result.status === 'already_mapped'
      ).length,
      needs_review: results.filter(
        (result) => result.status === 'needs_review'
      ).length,
    };

    return FinanceInventorySetupActionResponseSchema.parse({
      action: 'prepare_from_products',
      summary,
      results,
    });
  }

  private getSelectedProduct(
    product: ProductInventorySourceRecord,
    variantId?: string
  ):
    | {
        variant_id?: undefined;
        variant_name?: undefined;
        sku: string | null;
      }
    | {
        variant_id: string;
        variant_name: string;
        sku: string | null;
      } {
    if (!product.has_variation) {
      if (variantId) {
        throw new FinanceDomainError(
          'Variasi produk tidak ditemukan.',
          'FINANCE_INVENTORY_VARIANT_NOT_FOUND'
        );
      }
      return {
        sku: product.parent_sku?.trim() || null,
      };
    }

    const variant = product.variants.find(
      (record) => record.variant_id === variantId
    );
    if (!variant) {
      throw new FinanceDomainError(
        'Pilih variasi produk yang valid sebelum membuat mapping.',
        'FINANCE_INVENTORY_VARIANT_NOT_FOUND'
      );
    }

    return {
      variant_id: variant.variant_id,
      variant_name: variant.name,
      sku: variant.child_sku?.trim() || null,
    };
  }

  private async assertSetupAccess(): Promise<void> {
    const state = await this.lifecycle.getState();
    if (state.status === 'active') return;
    if (state.status === 'in_progress') {
      await this.lifecycle.assertOwner();
      return;
    }
    throw new FinanceDomainError(
      'Finance inventory setup tersedia setelah onboarding Finance dimulai.',
      'FINANCE_NOT_ACTIVE'
    );
  }
}
