import type { ClientSession } from 'mongoose';
import { AccountingDomainError } from '@/modules/accounting/accounting.error';
import { AccountingAccountRepository } from '@/modules/accounting/accounts/account.repository';
import { JournalEntryService } from '@/modules/accounting/journal-entries/journal-entry.service';
import {
  getPeriodKeyFromDate,
  parseAccountingDate,
  type AccountingTenantContext,
} from '@/modules/accounting/accounting.types';
import { InventoryItemRepository } from '@/modules/inventory/items/inventory-item.repository';
import { InventoryLocationRepository } from '@/modules/inventory/locations/inventory-location.repository';
import { InventoryMovementService } from '@/modules/inventory/movements/inventory-movement.service';
import { OrderRepository } from '../order.repository';

const MARKETPLACE_RECEIVABLE_ACCOUNT = '1210';
const SALES_REVENUE_ACCOUNT = '4100';

type OrderAccountingContext = AccountingTenantContext & {
  storeId?: string;
};

export type PostCompletedOrderInput = {
  location_id?: string;
  session?: ClientSession;
};

export class OrderAccountingIntegrationService {
  private readonly context: OrderAccountingContext;
  private readonly orderRepository: OrderRepository;
  private readonly itemRepository: InventoryItemRepository;
  private readonly locationRepository: InventoryLocationRepository;
  private readonly accountRepository: AccountingAccountRepository;
  private readonly movementService: InventoryMovementService;
  private readonly journalService: JournalEntryService;

  constructor(context: OrderAccountingContext) {
    this.context = context;
    this.orderRepository = new OrderRepository(context);
    this.itemRepository = new InventoryItemRepository(
      context
    );
    this.locationRepository =
      new InventoryLocationRepository(context);
    this.accountRepository =
      new AccountingAccountRepository(context);
    this.movementService = new InventoryMovementService(
      context
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
            item.child_sku,
            item.parent_sku,
            input.session
          );
        const movement =
          await this.movementService.sellMerchandise(
            {
              inventory_item: String(inventoryItem._id),
              location: locationId,
              quantity,
              occurred_at: occurredAt.toISOString(),
              source_type: 'order',
              source_id: String(order._id),
              idempotency_key: `order:${String(
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
          this.accountRepository.findByCode(
            MARKETPLACE_RECEIVABLE_ACCOUNT,
            input.session
          ),
          this.accountRepository.findByCode(
            SALES_REVENUE_ACCOUNT,
            input.session
          ),
        ]);
      if (!receivableAccount || !revenueAccount) {
        throw new AccountingDomainError(
          'Akun Piutang Marketplace atau Penjualan belum tersedia. Jalankan setup accounting terlebih dahulu.',
          'ORDER_REVENUE_ACCOUNTS_NOT_CONFIGURED'
        );
      }

      const dimensions = {
        channel: order.platform,
        ...(this.context.storeId
          ? { store: this.context.storeId }
          : {}),
      };

      const journalEntry =
        await this.journalService.postNew(
          {
            entry_number: `ORD-${order.order_id}`,
            transaction_date: occurredAt.toISOString(),
            posting_date: occurredAt.toISOString(),
            period: getPeriodKeyFromDate(occurredAt),
            description: `Penjualan ${order.platform} ${order.order_id}`,
            source_type: 'order',
            source_id: String(order._id),
            source_event: 'completed_posted',
            idempotency_key: `order-sales:${String(order._id)}`,
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
    childSku: string | undefined,
    parentSku: string | undefined,
    session?: ClientSession
  ) {
    const preferredSkus = [childSku, parentSku]
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
    throw new AccountingDomainError(
      `Inventory merchandise tidak ditemukan untuk SKU ${preferredSkus.join(' / ') || '(kosong)'}.`,
      'ORDER_INVENTORY_ITEM_NOT_MAPPED'
    );
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
