import { ProductInventorySourceService } from '@/modules/products';
import { FinanceDomainError } from '../finance.error';
import { FinanceAccountRepository } from '../accounts/finance-account.repository';
import { FinanceCashBankReadService } from '../cash-and-bank/finance-cash-bank-read.service';
import { FinanceLifecycleService } from '../finance-lifecycle.service';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import { FinanceInventoryItemRepository } from '../inventory/finance-inventory-item.repository';
import { FinanceInventoryLocationRepository } from '../inventory/finance-inventory-location.repository';
import { FinanceInventoryMappingRepository } from '../inventory/finance-inventory-mapping.repository';
import { FinanceInventoryMovementRepository } from '../inventory/finance-inventory-movement.repository';
import { FinanceInventoryReservationRepository } from '../inventory/finance-inventory-reservation.repository';
import { FinanceInventorySetupService } from '../inventory/finance-inventory-setup.service';
import { FinanceInventoryStockReadService } from '../inventory/finance-inventory-stock-read.service';
import { FinanceSalesWorkflowService } from './finance-sales-workflow.service';
import type {
  FinanceOfflineSaleFormOptionsDTO,
  FinanceOfflineSaleInputDTO,
  FinanceOfflineSaleResponseDTO,
} from './finance-offline-sale.dto';
import {
  FinanceOfflineSaleFormOptionsSchema,
  FinanceOfflineSaleInputSchema,
  FinanceOfflineSaleResponseSchema,
} from './finance-offline-sale.schema';
import { FinanceSalesProjectionSchema } from './finance-sales.schema';

const allowedPaymentSubtypes = new Set([
  'cash',
  'bank',
  'e_wallet',
]);

export class FinanceOfflineSaleService {
  private readonly context: FinanceTenantContext;
  private readonly lifecycle: FinanceLifecycleService;
  private readonly setupService: FinanceInventorySetupService;
  private readonly stockReadService: FinanceInventoryStockReadService;
  private readonly accountRepository: FinanceAccountRepository;
  private readonly itemRepository: FinanceInventoryItemRepository;
  private readonly locationRepository: FinanceInventoryLocationRepository;
  private readonly mappingRepository: FinanceInventoryMappingRepository;
  private readonly movementRepository: FinanceInventoryMovementRepository;
  private readonly reservationRepository: FinanceInventoryReservationRepository;
  private readonly productService: ProductInventorySourceService;
  private readonly cashBankReadService: FinanceCashBankReadService;
  private readonly salesWorkflow: FinanceSalesWorkflowService;

  constructor(context: FinanceTenantContext) {
    assertFinanceTenant(context);
    this.context = context;
    this.lifecycle = new FinanceLifecycleService(context);
    this.setupService = new FinanceInventorySetupService(
      context
    );
    this.stockReadService =
      new FinanceInventoryStockReadService(context);
    this.accountRepository = new FinanceAccountRepository(
      context
    );
    this.itemRepository =
      new FinanceInventoryItemRepository(context);
    this.locationRepository =
      new FinanceInventoryLocationRepository(context);
    this.mappingRepository =
      new FinanceInventoryMappingRepository(context);
    this.movementRepository =
      new FinanceInventoryMovementRepository(context);
    this.reservationRepository =
      new FinanceInventoryReservationRepository(context);
    this.productService = new ProductInventorySourceService(
      {
        organizationId: context.organizationId,
      }
    );
    this.cashBankReadService =
      new FinanceCashBankReadService(context);
    this.salesWorkflow = new FinanceSalesWorkflowService(
      context
    );
  }

  async getFormOptions(): Promise<FinanceOfflineSaleFormOptionsDTO> {
    await this.assertFinanceActive();
    const [setup, locations, cashBank] = await Promise.all([
      this.setupService.getSetup({ page: 1, limit: 100 }),
      this.locationRepository.listActive(),
      this.cashBankReadService.list({ limit: 100 }),
    ]);
    const payment_accounts = cashBank.accounts
      .filter((account) =>
        allowedPaymentSubtypes.has(account.subtype)
      )
      .map(({ id, code, name, subtype }) => ({
        id,
        code,
        name,
        subtype,
      }));
    if (locations.length !== 1) {
      return FinanceOfflineSaleFormOptionsSchema.parse({
        products: [],
        payment_accounts,
      });
    }
    const stock = await this.stockReadService.list({
      page: 1,
      limit: 100,
      location_id: String(locations[0]._id),
    });
    const stockById = new Map(
      stock.items.map((item) => [item.item_id, item])
    );
    const products = setup.product_options.flatMap(
      (option) => {
        const mapped = option.mapped_inventory_item;
        if (
          !mapped ||
          !mapped.track_quantity ||
          !mapped.track_value
        ) {
          return [];
        }
        const balance = stockById.get(mapped.id);
        if (
          !balance ||
          balance.status !== 'ready' ||
          balance.location_count !== 1 ||
          balance.sellable_quantity === null ||
          balance.sellable_quantity < 1 ||
          balance.value_on_hand === null ||
          balance.value_on_hand <= 0
        ) {
          return [];
        }
        return [
          {
            key: option.key,
            product_id: option.product_id,
            product_name: option.product_name,
            ...(option.variant_id
              ? { variant_id: option.variant_id }
              : {}),
            ...(option.variant_name
              ? { variant_name: option.variant_name }
              : {}),
            ...(option.platform
              ? { platform: option.platform }
              : {}),
            sku: option.sku,
            inventory_item_id: mapped.id,
            inventory_item_name: mapped.name,
            inventory_sku: mapped.sku,
            unit: mapped.unit,
            available_quantity: balance.sellable_quantity,
          },
        ];
      }
    );
    return FinanceOfflineSaleFormOptionsSchema.parse({
      products,
      payment_accounts,
    });
  }

  async create(
    input: FinanceOfflineSaleInputDTO | unknown
  ): Promise<FinanceOfflineSaleResponseDTO> {
    await this.assertFinanceActive();
    const sale = FinanceOfflineSaleInputSchema.parse(input);
    const paymentAccount =
      await this.accountRepository.findSelectableById(
        sale.payment_account_id
      );
    if (
      !paymentAccount ||
      paymentAccount.type !== 'asset' ||
      !paymentAccount.subtype ||
      !allowedPaymentSubtypes.has(paymentAccount.subtype)
    ) {
      throw new FinanceDomainError(
        'Pilih akun Kas, Bank, atau E-wallet aktif yang dapat digunakan untuk posting.',
        'FINANCE_OFFLINE_SALE_PAYMENT_ACCOUNT_INVALID'
      );
    }

    const locations =
      await this.locationRepository.listActive();
    if (locations.length !== 1) {
      throw new FinanceDomainError(
        'Penjualan offline memerlukan tepat satu lokasi inventory aktif.',
        'FINANCE_INVENTORY_LOCATION_CONFIGURATION_INVALID'
      );
    }
    const location = locations[0];

    const resolvedLines = await Promise.all(
      sale.lines.map(async (line, index) => {
        const product =
          await this.productService.getActiveInventorySourceById(
            line.product_id
          );
        if (!product) {
          throw new FinanceDomainError(
            'Produk aktif tidak ditemukan pada organisasi ini.',
            'FINANCE_INVENTORY_PRODUCT_NOT_FOUND'
          );
        }
        const variant = line.variant_id
          ? product.variants.find(
              (item) => item.variant_id === line.variant_id
            )
          : undefined;
        if (
          (product.has_variation && !variant) ||
          (!product.has_variation && line.variant_id)
        ) {
          throw new FinanceDomainError(
            'Variasi produk tidak ditemukan pada katalog organisasi ini.',
            'FINANCE_INVENTORY_VARIANT_NOT_FOUND'
          );
        }
        const mapping =
          await this.mappingRepository.findActiveByProductVariant(
            line.product_id,
            line.variant_id
          );
        if (!mapping) {
          throw new FinanceDomainError(
            'Produk belum terhubung ke item inventory Finance.',
            'FINANCE_INVENTORY_PRODUCT_MAPPING_NOT_FOUND'
          );
        }
        const inventoryItem =
          await this.itemRepository.findActiveById(
            String(mapping.inventory_item)
          );
        if (
          !inventoryItem ||
          !inventoryItem.track_quantity ||
          !inventoryItem.track_value
        ) {
          throw new FinanceDomainError(
            'Item inventory harus melacak jumlah dan nilai sebelum dijual melalui Finance.',
            'FINANCE_INVENTORY_ITEM_NOT_TRACKED'
          );
        }
        const amount = line.quantity * line.unit_price;
        if (!Number.isSafeInteger(amount)) {
          throw new FinanceDomainError(
            'Nilai baris penjualan terlalu besar.',
            'FINANCE_OFFLINE_SALE_AMOUNT_INVALID'
          );
        }
        return {
          line,
          index,
          product,
          variant,
          inventoryItem,
          amount,
        };
      })
    );

    const quantityByItem = new Map<string, number>();
    for (const item of resolvedLines) {
      const itemId = String(item.inventoryItem._id);
      quantityByItem.set(
        itemId,
        (quantityByItem.get(itemId) ?? 0) +
          item.line.quantity
      );
    }
    const itemIds = [...quantityByItem.keys()];
    const [balances, reservations] = await Promise.all([
      Promise.all(
        itemIds.map((itemId) =>
          this.movementRepository.getPostedBalance(
            itemId,
            String(location._id)
          )
        )
      ),
      this.reservationRepository.aggregateActiveByInventoryItemIds(
        itemIds,
        String(location._id)
      ),
    ]);
    const reservedByItem = new Map(
      reservations.map((record) => [
        String(record._id),
        record.quantity,
      ])
    );
    for (const [index, itemId] of itemIds.entries()) {
      const balance = balances[index];
      const item = resolvedLines.find(
        (line) => String(line.inventoryItem._id) === itemId
      )?.inventoryItem;
      const onHand = balance
        ? balance.inbound_quantity -
          balance.outbound_quantity
        : 0;
      const reserved = reservedByItem.get(itemId) ?? 0;
      const required = quantityByItem.get(itemId) ?? 0;
      if (
        !item ||
        balance?.unresolved_movement_count ||
        balance?.missing_cost_movement_count ||
        onHand - reserved < required
      ) {
        throw new FinanceDomainError(
          `Stok tersedia untuk ${item?.name ?? 'produk'} tidak mencukupi atau perlu ditinjau.`,
          'FINANCE_INVENTORY_NEGATIVE_STOCK'
        );
      }
    }

    const total = resolvedLines.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    if (!Number.isSafeInteger(total) || total <= 0) {
      throw new FinanceDomainError(
        'Total penjualan harus berupa nilai positif yang valid.',
        'FINANCE_OFFLINE_SALE_AMOUNT_INVALID'
      );
    }
    const transactionDate = sale.transaction_date;
    const sourceOrderId = sale.idempotency_key;
    const sourceOrderNumber =
      sale.reference ||
      `OFF-${transactionDate.toISOString().slice(0, 10).replaceAll('-', '')}-${sourceOrderId.slice(-6).toUpperCase()}`;
    const projection = FinanceSalesProjectionSchema.parse({
      source_order_id: sourceOrderId,
      source_order_number: sourceOrderNumber,
      organization_id: this.context.organizationId,
      store_id: null,
      platform: 'offline',
      source_status: 'selesai',
      currency: 'IDR',
      transaction_date: transactionDate.toISOString(),
      released_funds_at: null,
      total_payment: total,
      sales_amount: total,
      released_amount: null,
      lines: resolvedLines.map((item) => ({
        source_line_id: `line-${item.index + 1}`,
        product_reference_id: String(item.product._id),
        product_id: item.product.product_id,
        variation_id: item.variant?.variant_id ?? null,
        product_name: item.product.name,
        variation_name: item.variant?.name ?? null,
        parent_sku: item.product.parent_sku ?? null,
        child_sku: item.variant?.child_sku ?? null,
        quantity: item.line.quantity,
        returned_quantity: 0,
        final_quantity: item.line.quantity,
        subtotal: item.amount,
        gross_sales: item.amount,
        net_sales: item.amount,
        product_cost: null,
        total_product_cost: null,
      })),
      readiness: 'ready',
      issues: [],
    });
    const result = await this.salesWorkflow.process(
      projection,
      {
        mode: 'automatic',
        payment_account_id: String(paymentAccount._id),
        require_inventory_cogs: true,
      }
    );

    return FinanceOfflineSaleResponseSchema.parse({
      result,
    });
  }

  private async assertFinanceActive(): Promise<void> {
    const state = await this.lifecycle.getState();
    if (state.status !== 'active') {
      throw new FinanceDomainError(
        'Finance module belum aktif.',
        'FINANCE_NOT_ACTIVE'
      );
    }
  }
}
