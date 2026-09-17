import {
  isValidObjectId,
  type ClientSession,
} from 'mongoose';
import { AccountingDomainError } from '@/modules/accounting/accounting.error';
import { AccountingAccountResolver } from '@/modules/accounting/accounts/account-resolver.service';
import { assertAccountingModuleActive } from '@/modules/accounting/accounting-module.guard';
import { createAccountingDimensions } from '@/modules/accounting/accounting-dimensions';
import { JournalEntryService } from '@/modules/accounting/journal-entries/journal-entry.service';
import {
  getPeriodKeyFromDate,
  parseAccountingDate,
  type AccountingTenantContext,
} from '@/modules/accounting/accounting.types';
import { InventoryItemRepository } from '@/modules/inventory/items/inventory-item.repository';
import { InventoryItemMappingRepository } from '@/modules/inventory/mappings/inventory-item-mapping.repository';
import { InventoryLocationRepository } from '@/modules/inventory/locations/inventory-location.repository';
import { InventoryMovementService } from '@/modules/inventory/movements/inventory-movement.service';
import { ProductRepository } from '@/modules/products/product.repository';
import { StoreRepository } from '@/modules/stores/store.repository';
import { matchProductAndVariant } from './product-matching';
import { OrderRepository } from '../order.repository';

type OrderAccountingContext = AccountingTenantContext & {
  storeId?: string;
};

export type PostCompletedOrderInput = {
  location_id?: string;
  mode?: 'operational' | 'reconstruction';
  session?: ClientSession;
};

export class OrderAccountingIntegrationService {
  private readonly context: OrderAccountingContext;
  private readonly orderRepository: OrderRepository;
  private readonly itemRepository: InventoryItemRepository;
  private readonly mappingRepository: InventoryItemMappingRepository;
  private productRepository: ProductRepository;
  private readonly locationRepository: InventoryLocationRepository;
  private readonly accountResolver: AccountingAccountResolver;
  private readonly movementService: InventoryMovementService;
  private readonly journalService: JournalEntryService;
  private readonly storeRepository: StoreRepository;

  constructor(context: OrderAccountingContext) {
    this.context = context;
    const organizationContext: AccountingTenantContext = {
      organizationId: context.organizationId,
      ...(context.userId ? { userId: context.userId } : {}),
    };
    // The active UI store must not determine the accounting dimension of an
    // order. The source order's store is authoritative.
    this.orderRepository = new OrderRepository({
      organizationId: context.organizationId,
    });
    this.storeRepository = new StoreRepository({
      organizationId: context.organizationId,
    });
    this.itemRepository = new InventoryItemRepository(
      context
    );
    this.mappingRepository =
      new InventoryItemMappingRepository(context);
    this.productRepository = new ProductRepository(
      organizationContext
    );
    this.locationRepository =
      new InventoryLocationRepository(context);
    this.accountResolver = new AccountingAccountResolver(
      context
    );
    this.movementService = new InventoryMovementService(
      organizationContext
    );
    this.journalService = new JournalEntryService(context);
  }

  async postCompletedOrder(
    orderId: string,
    input: PostCompletedOrderInput = {}
  ) {
    const order =
      await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AccountingDomainError(
        'Order tidak ditemukan pada organization aktif.',
        'ORDER_NOT_FOUND'
      );
    }

    if (order.accounting_status === 'posted') {
      return {
        order,
        status: 'posted' as const,
        journal_entry_id: order.accounting_journal_entry
          ? String(order.accounting_journal_entry)
          : undefined,
        inventory_movement_ids: (
          order.accounting_inventory_movements ?? []
        ).map(String),
      };
    }

    try {
      const accountingState =
        await assertAccountingModuleActive(
          this.context,
          input.session
        );
      if (!order.store) {
        throw new AccountingDomainError(
          'Order belum memiliki store/workspace. Tetapkan store pada order sebelum diintegrasikan ke accounting.',
          'ORDER_STORE_REQUIRED'
        );
      }

      const sourceStore =
        await this.storeRepository.findById(
          String(order.store)
        );
      if (!sourceStore) {
        throw new AccountingDomainError(
          'Store/workspace pada order tidak ditemukan dalam organization aktif.',
          'ORDER_STORE_NOT_FOUND'
        );
      }
      const storeId = String(sourceStore._id);
      // Product matching is store-scoped. Rebind it after resolving the source
      // order so an active UI store cannot cause cross-store matching.
      this.productRepository = new ProductRepository({
        organizationId: this.context.organizationId,
        storeId,
      });

      if (order.status !== 'selesai') {
        throw new AccountingDomainError(
          'Order harus berstatus selesai sebelum diintegrasikan ke accounting.',
          'ORDER_NOT_COMPLETED'
        );
      }

      const occurredAt = parseAccountingDate(
        order.completed_at ?? order.placed_at ?? new Date(),
        'completed_at'
      );
      if (
        accountingState.cutover_date &&
        occurredAt < accountingState.cutover_date &&
        input.mode !== 'reconstruction'
      ) {
        throw new AccountingDomainError(
          'Order sebelum cutover harus diproses melalui reconstruction.',
          'ORDER_BEFORE_CUTOVER'
        );
      }
      const locationId = await this.resolveLocation(
        input.location_id,
        input.session
      );
      const items = order.items ?? [];
      if (items.length === 0) {
        throw new AccountingDomainError(
          'Order selesai tidak memiliki item untuk dikurangi dari inventory.',
          'ORDER_ITEMS_REQUIRED'
        );
      }

      const inventoryMovementIds: string[] = [];
      for (const [index, item] of items.entries()) {
        const quantity = this.getFinalQuantity(item);
        if (quantity === 0) continue;

        const inventoryItem =
          await this.resolveInventoryItem(
            item,
            input.session
          );
        const movement =
          await this.movementService.sellMerchandise(
            {
              inventory_item: String(inventoryItem._id),
              location: locationId,
              quantity,
              occurred_at: occurredAt.toISOString(),
              store: storeId,
              platform: order.platform,
              source_type: 'order',
              source_id: String(order._id),
              idempotency_key: `order${input.mode === 'reconstruction' ? '-reconstruction' : ''}:${String(
                order._id
              )}:inventory:${index}`,
              reference: `${order.platform} ${order.order_id}`,
              notes: item.product_name,
            },
            this.context.userId,
            input.session
          );
        inventoryMovementIds.push(String(movement._id));
      }

      if (inventoryMovementIds.length === 0) {
        throw new AccountingDomainError(
          'Order tidak memiliki quantity final yang dapat dijual.',
          'ORDER_SELLABLE_QUANTITY_REQUIRED'
        );
      }

      const salesAmount = this.getSalesAmount(order);
      const [receivableAccount, revenueAccount] =
        await Promise.all([
          this.accountResolver.resolve({
            role: 'marketplace_receivable',
            platform: order.platform,
            fallbackCode: '1210',
            session: input.session,
          }),
          this.accountResolver.resolve({
            role: 'sales_revenue',
            fallbackCode: '4100',
            session: input.session,
          }),
        ]);

      const dimensions = createAccountingDimensions({
        store: storeId,
        platform: order.platform,
      });

      const journalEntry =
        await this.journalService.postNew(
          {
            entry_number: `ORD-${order.order_id}`,
            transaction_date: occurredAt.toISOString(),
            posting_date: occurredAt.toISOString(),
            period: getPeriodKeyFromDate(
              occurredAt,
              accountingState.calendar_timezone
            ),
            description: `Penjualan ${order.platform} ${order.order_id}`,
            source_type: 'order',
            source_id: String(order._id),
            source_event:
              input.mode === 'reconstruction'
                ? 'reconstruction_completed_posted'
                : 'completed_posted',
            idempotency_key: `order-sales${input.mode === 'reconstruction' ? '-reconstruction' : ''}:${String(order._id)}`,
            status: 'draft',
            lines: [
              {
                account: String(receivableAccount._id),
                debit: salesAmount,
                credit: 0,
                dimensions,
              },
              {
                account: String(revenueAccount._id),
                debit: 0,
                credit: salesAmount,
                dimensions,
              },
            ],
          },
          this.context.userId,
          input.session
        );

      const updatedOrder =
        await this.orderRepository.updateAccountingState(
          String(order._id),
          {
            accounting_status: 'posted',
            accounting_journal_entry: String(
              journalEntry._id
            ),
            accounting_inventory_movements:
              inventoryMovementIds,
            accounting_posted_at: new Date(),
            accounting_last_attempt_at: new Date(),
            accounting_attempt_count:
              (order.accounting_attempt_count ?? 0) + 1,
          },
          input.session
        );

      return {
        order: updatedOrder,
        status: 'posted' as const,
        journal_entry_id: String(journalEntry._id),
        inventory_movement_ids: inventoryMovementIds,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Order gagal diintegrasikan ke accounting.';
      await this.orderRepository.updateAccountingState(
        String(order._id),
        {
          accounting_status: 'blocked',
          accounting_error: message,
          accounting_block_reason: message,
          accounting_last_attempt_at: new Date(),
          accounting_attempt_count:
            (order.accounting_attempt_count ?? 0) + 1,
        },
        input.session
      );
      throw error;
    }
  }

  private async resolveLocation(
    locationId: string | undefined,
    session?: ClientSession
  ) {
    if (locationId) {
      const location =
        await this.locationRepository.findLocationById(
          locationId,
          session
        );
      if (!location || !location.is_active) {
        throw new AccountingDomainError(
          'Inventory location tidak ditemukan atau tidak aktif.',
          'ORDER_INVENTORY_LOCATION_INVALID'
        );
      }
      return String(location._id);
    }

    const locations =
      await this.locationRepository.findAllActive(session);
    if (locations.length === 1)
      return String(locations[0]._id);
    if (locations.length === 0) {
      throw new AccountingDomainError(
        'Belum ada inventory location aktif untuk order integration.',
        'ORDER_INVENTORY_LOCATION_REQUIRED'
      );
    }
    throw new AccountingDomainError(
      'Tentukan inventory location karena terdapat lebih dari satu location aktif.',
      'ORDER_INVENTORY_LOCATION_AMBIGUOUS'
    );
  }

  private async resolveInventoryItem(
    item: {
      product?: unknown;
      product_id?: string;
      variation_id?: string;
      product_name?: string;
      variation_name?: string;
      parent_sku?: string;
      child_sku?: string;
    },
    session?: ClientSession
  ) {
    const products = [];
    const productReference = String(
      item.product ?? ''
    ).trim();
    if (isValidObjectId(productReference)) {
      const product = await this.productRepository.findById(
        productReference
      );
      if (product) {
        products.push(product);
        const directMapping =
          await this.mappingRepository.findActiveByProductVariant(
            String(product._id),
            item.variation_id,
            session
          );
        const mappedInventoryItem =
          await this.resolveMappedInventoryItem(
            directMapping,
            session
          );
        if (mappedInventoryItem) return mappedInventoryItem;
      }
    }

    const matchingProducts =
      await this.productRepository.findForOrderMatching({
        names: item.product_name ? [item.product_name] : [],
        parentSkus: item.parent_sku
          ? [item.parent_sku]
          : [],
        childSkus: item.child_sku ? [item.child_sku] : [],
        productIds: item.product_id
          ? [item.product_id]
          : [],
      });
    const knownProductIds = new Set(
      products.map((product) => String(product._id))
    );
    for (const product of matchingProducts) {
      if (!knownProductIds.has(String(product._id))) {
        products.push(product);
      }
    }

    if (products.length > 0) {
      const match = matchProductAndVariant(products, {
        productId: item.product_id,
        productName: item.product_name,
        variationName: item.variation_name,
        parentSku: item.parent_sku,
        childSku: item.child_sku,
      });

      if (
        match.productMatchStatus === 'matched' &&
        match.product?._id
      ) {
        const variantId =
          match.variant?.variant_id ?? item.variation_id;
        const mapping =
          await this.mappingRepository.findActiveByProductVariant(
            String(match.product._id),
            variantId,
            session
          );

        const mappedInventoryItem =
          await this.resolveMappedInventoryItem(
            mapping,
            session
          );
        if (mappedInventoryItem) return mappedInventoryItem;
      }
    }

    const preferredSkus = [item.child_sku, item.parent_sku]
      .map((sku) => String(sku ?? '').trim())
      .filter(Boolean);
    const candidates =
      await this.itemRepository.findActiveBySkus(
        preferredSkus,
        session
      );
    for (const sku of preferredSkus) {
      const item = candidates.find(
        (candidate) =>
          candidate.sku === sku &&
          candidate.item_type === 'merchandise'
      );
      if (item) return item;
    }

    if (products.length > 0) {
      const match = matchProductAndVariant(products, {
        productId: item.product_id,
        productName: item.product_name,
        variationName: item.variation_name,
        parentSku: item.parent_sku,
        childSku: item.child_sku,
      });

      if (match.productMatchStatus === 'matched') {
        const fallbackSkus = [
          match.variant?.child_sku,
          match.variant?.sku,
          match.product?.parent_sku,
        ]
          .map((sku) => String(sku ?? '').trim())
          .filter(Boolean);
        const fallbackCandidates =
          await this.itemRepository.findActiveBySkus(
            fallbackSkus,
            session
          );
        for (const sku of fallbackSkus) {
          const inventoryItem = fallbackCandidates.find(
            (candidate) =>
              candidate.sku === sku &&
              candidate.item_type === 'merchandise'
          );
          if (inventoryItem) return inventoryItem;
        }
      }
    }

    throw new AccountingDomainError(
      `Inventory merchandise tidak ditemukan untuk SKU ${preferredSkus.join(' / ') || '(kosong)'}. Isi SKU order atau mapping product/variant ke inventory item terlebih dahulu.`,
      'ORDER_INVENTORY_ITEM_NOT_MAPPED'
    );
  }

  private async resolveMappedInventoryItem(
    mapping: Awaited<
      ReturnType<
        InventoryItemMappingRepository['findActiveByProductVariant']
      >
    >,
    session?: ClientSession
  ) {
    if (!mapping) return null;

    const populatedInventoryItem =
      mapping.inventory_item as unknown as {
        _id?: unknown;
      };
    const inventoryItemId =
      populatedInventoryItem &&
      typeof populatedInventoryItem === 'object' &&
      populatedInventoryItem._id
        ? String(populatedInventoryItem._id)
        : String(mapping.inventory_item);
    const inventoryItem =
      await this.itemRepository.findItemById(
        inventoryItemId,
        session
      );
    if (
      inventoryItem?.is_active &&
      inventoryItem.item_type === 'merchandise'
    ) {
      return inventoryItem;
    }
    return null;
  }

  private getFinalQuantity(item: {
    quantity?: number;
    returned_quantity?: number;
    final_quantity?: number;
  }) {
    const quantity =
      item.final_quantity ??
      Math.max(
        (item.quantity ?? 0) -
          (item.returned_quantity ?? 0),
        0
      );
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new AccountingDomainError(
        'Final quantity order harus berupa bilangan bulat tidak negatif.',
        'ORDER_FINAL_QUANTITY_INVALID'
      );
    }
    return quantity;
  }

  private getSalesAmount(order: {
    total_gross_sales?: number;
    order_subtotal?: number;
    items?: Array<{ subtotal?: number }>;
  }) {
    const itemSubtotal = (order.items ?? []).reduce(
      (sum, item) => sum + Number(item.subtotal ?? 0),
      0
    );
    const amount = Number(
      order.total_gross_sales ??
        order.order_subtotal ??
        itemSubtotal
    );
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new AccountingDomainError(
        'Nilai penjualan order harus berupa nominal IDR positif.',
        'ORDER_SALES_AMOUNT_INVALID'
      );
    }
    return amount;
  }
}
