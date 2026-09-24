import { Types } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import type {
  CreateFinanceInventoryItemRecord,
  FinanceInventoryItemRepository,
} from './finance-inventory-item.repository';
import type { FinanceInventoryLocationRepository } from './finance-inventory-location.repository';
import type {
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
  const service = new FinanceInventorySetupService(
    { organizationId, userId: '507f1f77bcf86cd799439011' },
    {
      lifecycle: {
        getState: async () => ({
          status: 'active',
          onboarding_version: 1,
        }),
        assertOwner: async () => true,
        ...overrides?.lifecycle,
      } as FinanceLifecycleService,
      itemRepository: {
        listActive: async () => ({
          records: [inventoryItem],
          total: 1,
        }),
        findBySku: async () => null,
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
        ...overrides?.itemRepository,
      } as FinanceInventoryItemRepository,
      locationRepository: {
        listActive: async () => [location],
        ensureDefaultLocation: async () => location,
        ...overrides?.locationRepository,
      } as FinanceInventoryLocationRepository,
      mappingRepository: {
        listActiveForProductIds: async () => [],
        upsertActive: async (
          data: UpsertFinanceInventoryMappingRecord
        ) => {
          mappings.push(data);
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
            mapping_method: 'manual_setup',
            is_active: true,
          };
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
