import {
  type ClientSession,
  type PopulateOptions,
  type UpdateQuery,
} from 'mongoose';
import { BaseRepository } from '../../base.repository';
import type { QueryOptions } from '@/lib/api/query-builder';
import type { InventoryItemMappingBaseDTO } from './inventory-item-mapping.dto';
import {
  InventoryItemMappingModel,
  type TInventoryItemMapping,
} from './inventory-item-mapping.model';
import type { AccountingTenantContext } from '@/modules/accounting/accounting.types';

const getMappingPopulate = (
  organizationId: string
): PopulateOptions[] => [
  {
    path: 'product',
    select:
      'name platform product_id parent_sku variants store',
    match: { organization: organizationId },
    options: { organizationId },
  },
  {
    path: 'inventory_item',
    select: 'sku name item_type unit is_active',
    match: { organization: organizationId },
    options: { organizationId },
  },
];

export class InventoryItemMappingRepository extends BaseRepository<TInventoryItemMapping> {
  constructor(context: AccountingTenantContext) {
    super(InventoryItemMappingModel, context);
  }

  private getPopulateOptions() {
    return getMappingPopulate(
      this.tenantContext.organizationId
    );
  }

  async findWithMappings(
    query: QueryOptions,
    options?: {
      is_active?: boolean;
      product?: string;
      inventory_item?: string;
      mapping_method?: InventoryItemMappingBaseDTO['mapping_method'];
    }
  ) {
    return this.findWithQueryOptions(query, {
      searchFields: [
        'variant_id',
        'variant_key',
        'mapping_method',
        'notes',
      ],
      baseFilter: {
        ...(options?.is_active === undefined
          ? {}
          : { is_active: options.is_active }),
        ...(options?.product
          ? { product: options.product }
          : {}),
        ...(options?.inventory_item
          ? { inventory_item: options.inventory_item }
          : {}),
        ...(options?.mapping_method
          ? { mapping_method: options.mapping_method }
          : {}),
      },
      populate: this.getPopulateOptions(),
    });
  }

  async findMappingById(
    id: string,
    session?: ClientSession
  ) {
    const query = this.model
      .findOne({ ...this.getTenantFilter(), _id: id })
      .populate(this.getPopulateOptions());
    if (session) query.session(session);
    return query.lean();
  }

  async findActiveByProductVariant(
    productId: string,
    variantId?: string,
    session?: ClientSession
  ) {
    const exactQuery = this.model
      .findOne({
        ...this.getTenantFilter(),
        product: productId,
        ...(variantId
          ? { variant_key: variantId }
          : { variant_key: '__product__' }),
        is_active: true,
      })
      .populate(this.getPopulateOptions());
    if (session) exactQuery.session(session);
    const exact = await exactQuery.lean();
    if (exact || !variantId) return exact;

    const productQuery = this.model
      .findOne({
        ...this.getTenantFilter(),
        product: productId,
        variant_key: '__product__',
        is_active: true,
      })
      .populate(this.getPopulateOptions());
    if (session) productQuery.session(session);
    return productQuery.lean();
  }

  createMapping(
    data: UpdateQuery<TInventoryItemMapping>,
    session?: ClientSession
  ) {
    const document = new this.model({
      ...data,
      ...this.getTenantFields(),
    });
    return document.save(session ? { session } : undefined);
  }

  async updateMapping(
    id: string,
    data: UpdateQuery<TInventoryItemMapping>
  ) {
    const { variant_id, ...setData } =
      data as UpdateQuery<TInventoryItemMapping> & {
        variant_id?: string;
      };
    return this.model
      .findOneAndUpdate(
        { ...this.getTenantFilter(), _id: id },
        {
          $set: {
            ...setData,
            ...(variant_id === undefined
              ? {}
              : { variant_id }),
          },
          ...(variant_id === undefined
            ? { $unset: { variant_id: 1 } }
            : {}),
        },
        { new: true, runValidators: true }
      )
      .lean();
  }

  archiveMapping(id: string) {
    return this.model
      .findOneAndUpdate(
        { ...this.getTenantFilter(), _id: id },
        { $set: { is_active: false } },
        { new: true, runValidators: true }
      )
      .lean();
  }
}
