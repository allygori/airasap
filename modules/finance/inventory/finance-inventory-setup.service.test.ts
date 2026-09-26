import { Types } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import type {
  CreateFinanceInventoryItemRecord,
  FinanceInventoryItemPersistenceRecord,
  FinanceInventoryItemRepository,
} from './finance-inventory-item.repository';
import type { FinanceInventoryLocationRepository } from './finance-inventory-location.repository';
import type {
  FinanceInventoryMappingPersistenceRecord,
  FinanceInventoryMappingRepository,
  UpsertFinanceInventoryMappingRecord,
} from './finance-inventory-mapping.repository';
import type { FinanceLifecycleService } from '../finance-lifecycle.service';
import type { ProductInventorySourceService } from '@/modules/products';
import { FinanceInventorySetupService } from './finance-inventory-setup.service';

const organizationId = '507f1f77bcf86cd799439010';
const productId = new Types.ObjectId();
const itemId = new Types.ObjectId();
const locationId = new Types.ObjectId();
const variantId = 'VAR-001';

const inventoryItem = {
  _id: itemId,
  organization: new Types.ObjectId(organizationId),
  sku: 'SKU-001',
  name: 'Produk contoh',
  item_type: 'merchandise' as const,
  unit: 'pcs',
  track_quantity: true,
  track_value: true,
  is_active: true,
};

const location = {
  _id: locationId,
  organization: new Types.ObjectId(organizationId),
  code: 'MAIN',
  name: 'Gudang Utama',
  is_active: true,
};

const product = {
  _id: productId,
  product_id: 'external-product-1',
  name: 'Kaos',
  platform: 'shopee' as const,
  parent_sku: 'KAOS',
  has_variation: true,
  variants: [
    {
      variant_id: variantId,
      name: 'Hitam / M',
      child_sku: 'KAOS-HITAM-M',
    },
  ],
};

const makeService = (overrides?: {
  lifecycle?: Partial<FinanceLifecycleService>;
  itemRepository?: Partial<FinanceInventoryItemRepository>;
  locationRepository?: Partial<FinanceInventoryLocationRepository>;
  mappingRepository?: Partial<FinanceInventoryMappingRepository>;
  productService?: Partial<ProductInventorySourceService>;
}) => {
  const createdItems: Array<Record<string, unknown>> = [];
  const mappings: Array<Record<string, unknown>> = [];
  const activeMappings: FinanceInventoryMappingPersistenceRecord[] =
    [];
  const service = new FinanceInventorySetupService(
    { organizationId, userId: '507f1f77bcf86cd799439011' },
    {
      lifecycle: {
        getState: async () => ({
          status: 'active',
          onboarding_version: 1,
          calendar_timezone: 'Asia/Jakarta',
        }),
        assertOwner: async () => true,
        ...overrides?.lifecycle,
      } as FinanceLifecycleService,
      itemRepository: {
        listActive: async () => ({
          records: [inventoryItem],
          total: 1,
        }),
        findBySku: async (sku: string) =>
          (createdItems.find((item) => item.sku === sku) as
            | FinanceInventoryItemPersistenceRecord
            | undefined) ?? null,
        findBySourceKey: async (sourceKey: string) =>
          (createdItems.find(
            (item) => item.source_key === sourceKey
          ) as
            | FinanceInventoryItemPersistenceRecord
            | undefined) ?? null,
        findActiveById: async () => inventoryItem,
        findActiveByIds: async () => [inventoryItem],
        createInventoryItem: async (
          data: CreateFinanceInventoryItemRecord
        ) => {
          const created = {
            ...inventoryItem,
            ...data,
            _id: new Types.ObjectId(),
          };
          createdItems.push(created);
          return created;
        },
        ensureInventoryItemFromProduct: async (
          data: CreateFinanceInventoryItemRecord & {
            source_key: string;
          }
        ) => {
          const existing = createdItems.find(
            (item) => item.source_key === data.source_key
          );
          if (existing) {
            return existing as FinanceInventoryItemPersistenceRecord;
          }
          const created = {
            ...inventoryItem,
            ...data,
            _id: new Types.ObjectId(),
          };
          createdItems.push(created);
          return created as FinanceInventoryItemPersistenceRecord;
        },
        ...overrides?.itemRepository,
      } as FinanceInventoryItemRepository,
      locationRepository: {
        listActive: async () => [location],
        ensureDefaultLocation: async () => location,
        ...overrides?.locationRepository,
      } as FinanceInventoryLocationRepository,
      mappingRepository: {
        listActiveForProductIds: async () => activeMappings,
        upsertActive: async (
          data: UpsertFinanceInventoryMappingRecord
        ) => {
          mappings.push(data);
          const savedMapping = {
            _id: new Types.ObjectId(),
            organization: new Types.ObjectId(
              organizationId
            ),
            product: new Types.ObjectId(data.product_id),
            variant_key: data.variant_id ?? '__product__',
            ...(data.variant_id
              ? { variant_id: data.variant_id }
              : {}),
            inventory_item: new Types.ObjectId(
              data.inventory_item_id
            ),
            mapping_method: 'manual_setup',
            is_active: true,
          };
          activeMappings.push(savedMapping);
          return savedMapping;
        },
        ...overrides?.mappingRepository,
      } as FinanceInventoryMappingRepository,
      productService: {
        listActiveInventorySources: async () => ({
          records: [product],
          total: 1,
        }),
        getActiveInventorySourceById: async () => product,
        ...overrides?.productService,
      } as ProductInventorySourceService,
    }
  );

  return { service, createdItems, mappings };
};

describe('FinanceInventorySetupService', () => {
  it('lists product variants and their current Finance mapping', async () => {
    const mapping = {
      _id: new Types.ObjectId(),
      organization: new Types.ObjectId(organizationId),
      product: productId,
      variant_id: variantId,
      variant_key: variantId,
      inventory_item: itemId,
      mapping_method: 'manual_setup',
      is_active: true,
    };
    const { service } = makeService({
      mappingRepository: {
        listActiveForProductIds: async () => [mapping],
      },
    });

    const result = await service.getSetup();

    expect(result.product_options).toEqual([
      expect.objectContaining({
        product_id: String(productId),
        product_name: 'Kaos',
        variant_id: variantId,
        variant_name: 'Hitam / M',
        sku: 'KAOS-HITAM-M',
        mapped_inventory_item: expect.objectContaining({
          id: String(itemId),
          sku: inventoryItem.sku,
        }),
      }),
    ]);
    expect(result.default_location?.code).toBe('MAIN');
  });

  it('does not expose or map variations without a stable variant identifier', async () => {
    const unstableProduct = {
      ...product,
      variants: [
        {
          variant_id: '',
          name: 'Tanpa ID',
          child_sku: 'NO-ID',
        },
        {
          variant_id: ' PADDED ',
          name: 'ID ber-spasi',
          child_sku: 'PADDED',
        },
      ],
    };
    const { service, createdItems } = makeService({
      productService: {
        listActiveInventorySources: async () => ({
          records: [unstableProduct],
          total: 1,
        }),
        getActiveInventorySourceById: async () =>
          unstableProduct,
      },
    });

    const setup = await service.getSetup();
    expect(setup.product_options).toEqual([]);

    await expect(
      service.perform({
        action: 'create_from_product',
        product_id: String(productId),
        unit: 'pcs',
        track_quantity: true,
        track_value: true,
      })
    ).rejects.toMatchObject<Partial<FinanceDomainError>>({
      code: 'FINANCE_INVENTORY_VARIANT_NOT_FOUND',
    });
    expect(createdItems).toHaveLength(0);
  });

  it('creates the default location, Finance item, and product mapping together', async () => {
    const { service, createdItems, mappings } =
      makeService();

    const result = await service.perform({
      action: 'create_from_product',
      product_id: String(productId),
      variant_id: variantId,
      unit: 'pcs',
      track_quantity: true,
      track_value: true,
    });
    if (result.action !== 'create_from_product') {
      throw new Error(
        'Expected a product inventory item response.'
      );
    }

    expect(result).toMatchObject({
      action: 'create_from_product',
      item: {
        sku: 'KAOS-HITAM-M',
        name: 'Kaos — Hitam / M',
        item_type: 'merchandise',
      },
      location: { code: 'MAIN' },
      mapping_created: true,
    });
    expect(createdItems).toHaveLength(1);
    expect(mappings).toEqual([
      {
        product_id: String(productId),
        variant_id: variantId,
        inventory_item_id: result.item.id,
      },
    ]);
  });

  it('prepares unmapped products from the current catalog page and skips them on retry', async () => {
    const { service, createdItems, mappings } =
      makeService();

    const first = await service.perform({
      action: 'prepare_from_products',
      page: 1,
      limit: 50,
    });
    const second = await service.perform({
      action: 'prepare_from_products',
      page: 1,
      limit: 50,
    });

    expect(first).toMatchObject({
      action: 'prepare_from_products',
      summary: {
        prepared: 1,
        already_mapped: 0,
        needs_review: 0,
      },
    });
    expect(second).toMatchObject({
      action: 'prepare_from_products',
      summary: {
        prepared: 0,
        already_mapped: 1,
        needs_review: 0,
      },
    });
    expect(createdItems).toHaveLength(1);
    expect(createdItems[0]).toMatchObject({
      sku: 'KAOS-HITAM-M',
      source_key: `${String(productId)}:${variantId}`,
    });
    expect(mappings).toHaveLength(1);
    expect(mappings[0]).toMatchObject({
      product_id: String(productId),
      variant_id: variantId,
      mapping_method: 'auto_product_setup',
    });
  });

  it('reuses the source item if saving its mapping failed during the previous attempt', async () => {
    let mappingAttempts = 0;
    const { service, createdItems } = makeService({
      mappingRepository: {
        upsertActive: async (data) => {
          mappingAttempts += 1;
          if (mappingAttempts === 1) {
            throw new Error(
              'Simulated mapping write failure'
            );
          }
          return {
            _id: new Types.ObjectId(),
            organization: new Types.ObjectId(
              organizationId
            ),
            product: new Types.ObjectId(data.product_id),
            variant_key: data.variant_id ?? '__product__',
            ...(data.variant_id
              ? { variant_id: data.variant_id }
              : {}),
            inventory_item: new Types.ObjectId(
              data.inventory_item_id
            ),
            mapping_method:
              data.mapping_method ?? 'manual_setup',
            is_active: true,
          };
        },
      },
    });

    await expect(
      service.perform({
        action: 'prepare_from_products',
        page: 1,
        limit: 50,
      })
    ).rejects.toThrow('Simulated mapping write failure');

    const retry = await service.perform({
      action: 'prepare_from_products',
      page: 1,
      limit: 50,
    });

    expect(retry).toMatchObject({
      action: 'prepare_from_products',
      summary: {
        prepared: 1,
        already_mapped: 0,
        needs_review: 0,
      },
    });
    expect(createdItems).toHaveLength(1);
    expect(mappingAttempts).toBe(2);
  });

  it('does not automatically link a product when its SKU already belongs to a Finance item', async () => {
    const { service, createdItems, mappings } = makeService(
      {
        itemRepository: {
          findBySku: async () => inventoryItem,
        },
      }
    );

    const result = await service.perform({
      action: 'prepare_from_products',
      page: 1,
      limit: 50,
    });

    expect(result).toMatchObject({
      action: 'prepare_from_products',
      summary: {
        prepared: 0,
        already_mapped: 0,
        needs_review: 1,
      },
      results: [
        {
          status: 'needs_review',
          review_reason: 'existing_inventory_sku',
          matched_item: { id: String(itemId) },
        },
      ],
    });
    expect(createdItems).toHaveLength(0);
    expect(mappings).toHaveLength(0);
  });

  it('routes missing and duplicate source SKUs to review without creating stock items', async () => {
    const duplicateProduct = {
      ...product,
      _id: new Types.ObjectId(),
      product_id: 'external-product-2',
      name: 'Kaos di toko lain',
    };
    const noSkuProduct = {
      ...product,
      has_variation: false,
      parent_sku: undefined,
      variants: [],
    };
    const { service, createdItems, mappings } = makeService(
      {
        productService: {
          listActiveInventorySources: async () => ({
            records: [
              product,
              duplicateProduct,
              noSkuProduct,
            ],
            total: 3,
          }),
        },
      }
    );

    const result = await service.perform({
      action: 'prepare_from_products',
      page: 1,
      limit: 50,
    });

    expect(result).toMatchObject({
      action: 'prepare_from_products',
      summary: {
        prepared: 0,
        already_mapped: 0,
        needs_review: 3,
      },
    });
    if (result.action !== 'prepare_from_products') {
      throw new Error(
        'Expected product preparation result.'
      );
    }
    expect(
      result.results.map((entry) => entry.review_reason)
    ).toEqual([
      'duplicate_source_sku',
      'duplicate_source_sku',
      'missing_sku',
    ]);
    expect(createdItems).toHaveLength(0);
    expect(mappings).toHaveLength(0);
  });

  it('allows one existing merchandise item to be mapped to another listing', async () => {
    const { service, mappings } = makeService();

    const result = await service.perform({
      action: 'map_product',
      product_id: String(productId),
      variant_id: variantId,
      inventory_item_id: String(itemId),
    });

    expect(result).toMatchObject({
      action: 'map_product',
      item: { id: String(itemId) },
      mapping_created: true,
    });
    expect(mappings[0]).toEqual({
      product_id: String(productId),
      variant_id: variantId,
      inventory_item_id: String(itemId),
    });
  });

  it('rejects duplicate SKUs instead of merging unrelated products', async () => {
    const { service, createdItems } = makeService({
      itemRepository: {
        findBySku: async () => inventoryItem,
      },
    });

    await expect(
      service.perform({
        action: 'create_manual',
        sku: inventoryItem.sku,
        name: 'Barang lain',
        item_type: 'merchandise',
        unit: 'pcs',
        track_quantity: true,
        track_value: true,
      })
    ).rejects.toMatchObject<Partial<FinanceDomainError>>({
      code: 'FINANCE_INVENTORY_ITEM_SKU_CONFLICT',
    });
    expect(createdItems).toHaveLength(0);
  });

  it('requires organization owner access while onboarding is in progress', async () => {
    const { service } = makeService({
      lifecycle: {
        getState: async () => ({
          status: 'in_progress',
          onboarding_version: 1,
          calendar_timezone: 'Asia/Jakarta',
        }),
        assertOwner: async () => {
          throw new FinanceDomainError(
            'Owner required',
            'FINANCE_OWNER_REQUIRED'
          );
        },
      },
    });

    await expect(service.getSetup()).rejects.toMatchObject<
      Partial<FinanceDomainError>
    >({
      code: 'FINANCE_OWNER_REQUIRED',
    });
  });
});
