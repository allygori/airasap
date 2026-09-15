import type { ClientSession } from 'mongoose';
import { CreateInventoryMovementSchema } from './inventory-movement.schema';
import { InventoryMovementRepository } from './inventory-movement.repository';
import { InventoryItemRepository } from '../items/inventory-item.repository';
import { InventoryLocationRepository } from '../locations/inventory-location.repository';
import { AccountingAccountRepository } from '@/modules/accounting/accounts/account.repository';
import { JournalEntryService } from '@/modules/accounting/journal-entries/journal-entry.service';
import { AccountingDomainError } from '@/modules/accounting/accounting.error';
import {
  assertAccountingTenant,
  getPeriodKeyFromDate,
  parseAccountingDate,
  toAccountingObjectId,
  validateSourceReference,
  type AccountingTenantContext,
} from '@/modules/accounting/accounting.types';
import { createAuditLog } from '@/modules/accounting/audit/audit-log.model';

const DEFAULT_PURCHASE_OFFSET_ACCOUNT = '2100';

const DEFAULT_INVENTORY_ACCOUNT_BY_ITEM_TYPE = {
  merchandise: '1310',
  packaging: '1320',
  supplies: '1320',
  fixed_asset: '1510',
} as const;

const DEFAULT_COGS_ACCOUNT_BY_ITEM_TYPE = {
  merchandise: '5100',
  packaging: '5200',
  supplies: '6100',
} as const;

type SupportedInventoryItemType =
  keyof typeof DEFAULT_INVENTORY_ACCOUNT_BY_ITEM_TYPE;

export class InventoryMovementService {
  private readonly repository: InventoryMovementRepository;
  private readonly itemRepository: InventoryItemRepository;
  private readonly locationRepository: InventoryLocationRepository;
  private readonly accountRepository: AccountingAccountRepository;
  private readonly journalService: JournalEntryService;
  private readonly context: AccountingTenantContext;

  constructor(context: AccountingTenantContext) {
    assertAccountingTenant(context);
    this.context = context;
    this.repository = new InventoryMovementRepository(
      context
    );
    this.itemRepository = new InventoryItemRepository(
      context
    );
    this.locationRepository =
      new InventoryLocationRepository(context);
    this.accountRepository =
      new AccountingAccountRepository(context);
    this.journalService = new JournalEntryService(context);
  }

  async createDraft(
    input: unknown,
    session?: ClientSession
  ) {
    const data = CreateInventoryMovementSchema.parse(input);
    if (data.status !== 'draft') {
      throw new AccountingDomainError(
        'Inventory movement baru harus dibuat sebagai draft.',
        'INVENTORY_MOVEMENT_MUST_START_AS_DRAFT'
      );
    }

    validateSourceReference(data);
    await this.validateItemAndLocation(
      data.inventory_item,
      data.location,
      session
    );

    if (data.idempotency_key) {
      const existing =
        await this.repository.findByIdempotencyKey(
          data.idempotency_key,
          session
        );
      if (existing) return existing;
    }

    const costs = this.normalizeExplicitCost(data);
    return this.repository.createMovement(
      {
        inventory_item: data.inventory_item,
        location: data.location,
        movement_type: data.movement_type,
        quantity: data.quantity,
        unit_cost: costs.unit_cost,
        total_cost: costs.total_cost,
        occurred_at: parseAccountingDate(
          data.occurred_at,
          'occurred_at'
        ),
        source_type: data.source_type,
        source_id: data.source_id,
        offset_account: data.offset_account,
        idempotency_key: data.idempotency_key,
        reference: data.reference,
        notes: data.notes,
        status: 'draft',
      },
      session
    );
  }

  async post(
    movementId: string,
    postedBy?: string,
    session?: ClientSession
  ) {
    const movement = await this.repository.findMovementById(
      movementId,
      session
    );
    if (!movement) {
      throw new AccountingDomainError(
        'Inventory movement tidak ditemukan.',
        'INVENTORY_MOVEMENT_NOT_FOUND'
      );
    }

    if (
      movement.status === 'posted' &&
      movement.journal_entry
    ) {
      return movement;
    }
    if (movement.status === 'posted') {
      throw new AccountingDomainError(
        'Inventory movement sudah posted tetapi journal_entry tidak tersedia.',
        'INVENTORY_MOVEMENT_JOURNAL_REFERENCE_MISSING'
      );
    }
    if (movement.status === 'voided') {
      throw new AccountingDomainError(
        'Inventory movement voided tidak dapat diposting.',
        'INVENTORY_MOVEMENT_ALREADY_VOIDED'
      );
    }
    if (
      movement.movement_type !== 'purchase' &&
      movement.movement_type !== 'consumption' &&
      movement.movement_type !== 'sale'
    ) {
      throw new AccountingDomainError(
        `Movement type ${movement.movement_type} belum didukung pada Phase 4.`,
        'INVENTORY_MOVEMENT_TYPE_NOT_SUPPORTED'
      );
    }

    const actorId = postedBy
      ? toAccountingObjectId(postedBy, 'postedBy')
      : undefined;
    const item = await this.getActiveItem(
      String(movement.inventory_item),
      session
    );
    await this.getActiveLocation(
      String(movement.location),
      session
    );

    const result =
      movement.movement_type === 'purchase'
        ? await this.postPurchase(
            movement,
            item,
            postedBy,
            session
          )
        : movement.movement_type === 'sale'
          ? await this.postSale(
              movement,
              item,
              postedBy,
              session
            )
          : await this.postConsumption(
              movement,
              item,
              postedBy,
              session
            );

    const posted = await this.repository.markPosted(
      movementId,
      String(result.journalEntry._id),
      result.costs,
      session
    );
    if (!posted) {
      const latest = await this.repository.findMovementById(
        movementId,
        session
      );
      if (latest?.status === 'posted') return latest;

      throw new AccountingDomainError(
        'Journal inventory berhasil diposting tetapi movement gagal diperbarui.',
        'INVENTORY_MOVEMENT_FINALIZATION_FAILED'
      );
    }

    await createAuditLog(
      this.context,
      {
        action: `inventory_movement.${movement.movement_type}_posted`,
        entity_type: 'inventory_movement',
        entity_id: toAccountingObjectId(
          String(posted._id),
          'inventory_movement'
        ),
        ...(actorId ? { actor_id: actorId } : {}),
        metadata: {
          journal_entry_id: String(result.journalEntry._id),
          inventory_item: String(movement.inventory_item),
          location: String(movement.location),
          total_cost: result.costs.total_cost,
        },
      },
      session
    );

    return posted;
  }

  async purchase(
    input: unknown,
    postedBy?: string,
    session?: ClientSession
  ) {
    const draft = await this.createDraft(
      {
        ...(input as Record<string, unknown>),
        movement_type: 'purchase',
      },
      session
    );
    return this.post(String(draft._id), postedBy, session);
  }

  async consumePackaging(
    input: unknown,
    postedBy?: string,
    session?: ClientSession
  ) {
    const draft = await this.createDraft(
      {
        ...(input as Record<string, unknown>),
        movement_type: 'consumption',
      },
      session
    );
    return this.post(String(draft._id), postedBy, session);
  }

  async sellMerchandise(
    input: unknown,
    postedBy?: string,
    session?: ClientSession
  ) {
    const draft = await this.createDraft(
      {
        ...(input as Record<string, unknown>),
        movement_type: 'sale',
      },
      session
    );
    return this.post(String(draft._id), postedBy, session);
  }

  private async postPurchase(
    movement: {
      _id: unknown;
      inventory_item: unknown;
      occurred_at: Date;
      quantity: number;
      unit_cost?: number;
      total_cost?: number;
      offset_account?: unknown;
      reference?: string;
    },
    item: {
      _id: unknown;
      item_type: string;
      inventory_account?: unknown;
      track_value: boolean;
    },
    postedBy: string | undefined,
    session?: ClientSession
  ) {
    if (!item.track_value) {
      throw new AccountingDomainError(
        'Inventory item purchase harus menggunakan track_value.',
        'INVENTORY_VALUE_TRACKING_REQUIRED'
      );
    }
    if (!movement.total_cost || movement.total_cost <= 0) {
      throw new AccountingDomainError(
        'Purchase inventory harus memiliki total_cost lebih besar dari nol.',
        'PURCHASE_COST_REQUIRED'
      );
    }

    const inventoryAccount =
      await this.resolveInventoryAccount(item, session);
    const offsetAccount = movement.offset_account
      ? await this.getOffsetAccount(
          String(movement.offset_account),
          session
        )
      : await this.getOffsetAccountByCode(
          DEFAULT_PURCHASE_OFFSET_ACCOUNT,
          session
        );
    const occurredAt = parseAccountingDate(
      movement.occurred_at,
      'occurred_at'
    );

    const journalEntry = await this.journalService.postNew(
      {
        entry_number: `INV-${String(movement._id)}`,
        transaction_date: occurredAt.toISOString(),
        posting_date: occurredAt.toISOString(),
        period: getPeriodKeyFromDate(occurredAt),
        description: movement.reference
          ? `Inventory purchase: ${movement.reference}`
          : 'Inventory purchase',
        source_type: 'inventory_movement',
        source_id: String(movement._id),
        source_event: 'purchase_posted',
        idempotency_key: `inventory-purchase:${String(
          movement._id
        )}`,
        status: 'draft',
        lines: [
          {
            account: String(inventoryAccount._id),
            debit: movement.total_cost,
            credit: 0,
          },
          {
            account: String(offsetAccount._id),
            debit: 0,
            credit: movement.total_cost,
          },
        ],
      },
      postedBy,
      session
    );

    return {
      journalEntry,
      costs: {
        unit_cost: movement.unit_cost,
        total_cost: movement.total_cost,
      },
    };
  }

  private async postConsumption(
    movement: {
      _id: unknown;
      inventory_item: unknown;
      location: unknown;
      occurred_at: Date;
      quantity: number;
      unit_cost?: number;
      total_cost?: number;
      reference?: string;
    },
    item: {
      _id: unknown;
      item_type: string;
      inventory_account?: unknown;
      cogs_account?: unknown;
      track_quantity: boolean;
      track_value: boolean;
    },
    postedBy: string | undefined,
    session?: ClientSession
  ) {
    if (!item.track_quantity || !item.track_value) {
      throw new AccountingDomainError(
        'Consumption membutuhkan tracking quantity dan value.',
        'INVENTORY_TRACKING_REQUIRED'
      );
    }
    if (item.item_type === 'fixed_asset') {
      throw new AccountingDomainError(
        'Fixed asset tidak diproses sebagai inventory consumption.',
        'FIXED_ASSET_CONSUMPTION_NOT_SUPPORTED'
      );
    }
    if (item.item_type !== 'packaging') {
      throw new AccountingDomainError(
        'Phase 3 hanya memproses consumption untuk item packaging.',
        'PACKAGING_CONSUMPTION_ONLY'
      );
    }

    const balance = await this.repository.getPostedBalance(
      String(movement.inventory_item),
      String(movement.location),
      session
    );
    if (balance.quantity < movement.quantity) {
      throw new AccountingDomainError(
        `Stok tidak cukup. Tersedia ${balance.quantity}, dibutuhkan ${movement.quantity}.`,
        'INSUFFICIENT_INVENTORY'
      );
    }

    const costs = this.resolveConsumptionCost(
      movement.quantity,
      movement.unit_cost,
      movement.total_cost,
      balance.quantity,
      balance.value
    );
    const inventoryAccount =
      await this.resolveInventoryAccount(item, session);
    const cogsAccount = await this.resolveCogsAccount(
      item,
      session
    );
    const occurredAt = parseAccountingDate(
      movement.occurred_at,
      'occurred_at'
    );

    const journalEntry = await this.journalService.postNew(
      {
        entry_number: `INV-${String(movement._id)}`,
        transaction_date: occurredAt.toISOString(),
        posting_date: occurredAt.toISOString(),
        period: getPeriodKeyFromDate(occurredAt),
        description: movement.reference
          ? `Inventory consumption: ${movement.reference}`
          : 'Inventory consumption',
        source_type: 'inventory_movement',
        source_id: String(movement._id),
        source_event: 'consumption_posted',
        idempotency_key: `inventory-consumption:${String(
          movement._id
        )}`,
        status: 'draft',
        lines: [
          {
            account: String(cogsAccount._id),
            debit: costs.total_cost,
            credit: 0,
          },
          {
            account: String(inventoryAccount._id),
            debit: 0,
            credit: costs.total_cost,
          },
        ],
      },
      postedBy,
      session
    );

    return { journalEntry, costs };
  }

  private async postSale(
    movement: {
      _id: unknown;
      inventory_item: unknown;
      location: unknown;
      occurred_at: Date;
      quantity: number;
      unit_cost?: number;
      total_cost?: number;
      reference?: string;
    },
    item: {
      _id: unknown;
      item_type: string;
      inventory_account?: unknown;
      cogs_account?: unknown;
      track_quantity: boolean;
      track_value: boolean;
    },
    postedBy: string | undefined,
    session?: ClientSession
  ) {
    if (item.item_type !== 'merchandise') {
      throw new AccountingDomainError(
        'Order sale hanya dapat mengurangi inventory merchandise.',
        'MERCHANDISE_SALE_ONLY'
      );
    }
    if (!item.track_quantity || !item.track_value) {
      throw new AccountingDomainError(
        'Sale inventory membutuhkan tracking quantity dan value.',
        'INVENTORY_TRACKING_REQUIRED'
      );
    }

    const balance = await this.repository.getPostedBalance(
      String(movement.inventory_item),
      String(movement.location),
      session
    );
    if (balance.quantity < movement.quantity) {
      throw new AccountingDomainError(
        `Stok tidak cukup. Tersedia ${balance.quantity}, dibutuhkan ${movement.quantity}.`,
        'INSUFFICIENT_INVENTORY'
      );
    }

    const costs = this.resolveConsumptionCost(
      movement.quantity,
      movement.unit_cost,
      movement.total_cost,
      balance.quantity,
      balance.value
    );
    const inventoryAccount =
      await this.resolveInventoryAccount(item, session);
    const cogsAccount = await this.resolveCogsAccount(
      item,
      session
    );
    const occurredAt = parseAccountingDate(
      movement.occurred_at,
      'occurred_at'
    );

    const journalEntry = await this.journalService.postNew(
      {
        entry_number: `INV-${String(movement._id)}`,
        transaction_date: occurredAt.toISOString(),
        posting_date: occurredAt.toISOString(),
        period: getPeriodKeyFromDate(occurredAt),
        description: movement.reference
          ? `Merchandise sale: ${movement.reference}`
          : 'Merchandise sale',
        source_type: 'inventory_movement',
        source_id: String(movement._id),
        source_event: 'sale_posted',
        idempotency_key: `inventory-sale:${String(
          movement._id
        )}`,
        status: 'draft',
        lines: [
          {
            account: String(cogsAccount._id),
            debit: costs.total_cost,
            credit: 0,
          },
          {
            account: String(inventoryAccount._id),
            debit: 0,
            credit: costs.total_cost,
          },
        ],
      },
      postedBy,
      session
    );

    return { journalEntry, costs };
  }

  private async validateItemAndLocation(
    itemId: string,
    locationId: string,
    session?: ClientSession
  ) {
    await this.getActiveItem(itemId, session);
    await this.getActiveLocation(locationId, session);
  }

  private async getActiveItem(
    itemId: string,
    session?: ClientSession
  ) {
    const item = await this.itemRepository.findItemById(
      itemId,
      session
    );
    if (!item) {
      throw new AccountingDomainError(
        'Inventory item tidak ditemukan pada organization aktif.',
        'INVENTORY_ITEM_NOT_FOUND'
      );
    }
    if (!item.is_active) {
      throw new AccountingDomainError(
        `Inventory item ${item.sku} tidak aktif.`,
        'INVENTORY_ITEM_INACTIVE'
      );
    }
    return item;
  }

  private async getActiveLocation(
    locationId: string,
    session?: ClientSession
  ) {
    const location =
      await this.locationRepository.findLocationById(
        locationId,
        session
      );
    if (!location) {
      throw new AccountingDomainError(
        'Inventory location tidak ditemukan pada organization aktif.',
        'INVENTORY_LOCATION_NOT_FOUND'
      );
    }
    if (!location.is_active) {
      throw new AccountingDomainError(
        `Inventory location ${location.code} tidak aktif.`,
        'INVENTORY_LOCATION_INACTIVE'
      );
    }
    return location;
  }

  private async resolveInventoryAccount(
    item: {
      item_type: string;
      inventory_account?: unknown;
    },
    session?: ClientSession
  ) {
    const defaultCode =
      DEFAULT_INVENTORY_ACCOUNT_BY_ITEM_TYPE[
        item.item_type as SupportedInventoryItemType
      ];
    if (!defaultCode && !item.inventory_account) {
      throw new AccountingDomainError(
        `Item type ${item.item_type} belum memiliki akun inventory default.`,
        'INVENTORY_ACCOUNT_NOT_CONFIGURED'
      );
    }

    const account = item.inventory_account
      ? await this.getPostableAccount(
          String(item.inventory_account),
          session
        )
      : await this.getOffsetAccountByCode(
          defaultCode,
          session
        );

    if (account.type !== 'asset') {
      throw new AccountingDomainError(
        `Account ${account.code} bukan akun inventory asset.`,
        'INVALID_INVENTORY_ACCOUNT'
      );
    }
    return account;
  }

  private async resolveCogsAccount(
    item: {
      item_type: string;
      cogs_account?: unknown;
    },
    session?: ClientSession
  ) {
    const defaultCode =
      DEFAULT_COGS_ACCOUNT_BY_ITEM_TYPE[
        item.item_type as keyof typeof DEFAULT_COGS_ACCOUNT_BY_ITEM_TYPE
      ];
    if (!defaultCode) {
      throw new AccountingDomainError(
        `Item type ${item.item_type} belum memiliki akun consumption default.`,
        'COGS_ACCOUNT_NOT_CONFIGURED'
      );
    }

    const account = item.cogs_account
      ? await this.getPostableAccount(
          String(item.cogs_account),
          session
        )
      : await this.getOffsetAccountByCode(
          defaultCode,
          session
        );

    if (
      ![
        'cost_of_sales',
        'expense',
        'other_expense',
      ].includes(account.type)
    ) {
      throw new AccountingDomainError(
        `Account ${account.code} bukan akun HPP/beban consumption.`,
        'INVALID_COGS_ACCOUNT'
      );
    }
    return account;
  }

  private async getPostableAccount(
    accountId: string,
    session?: ClientSession
  ) {
    const [account] =
      await this.accountRepository.findByIds(
        [accountId],
        session
      );
    if (!account) {
      throw new AccountingDomainError(
        'Accounting account tidak ditemukan pada organization aktif.',
        'ACCOUNT_NOT_FOUND'
      );
    }
    if (!account.is_active || !account.is_postable) {
      throw new AccountingDomainError(
        `Account ${account.code} tidak dapat digunakan untuk posting.`,
        'ACCOUNT_NOT_POSTABLE'
      );
    }
    return account;
  }

  private async getOffsetAccount(
    accountId: string,
    session?: ClientSession
  ) {
    const account = await this.getPostableAccount(
      accountId,
      session
    );
    if (
      !['asset', 'liability', 'equity'].includes(
        account.type
      )
    ) {
      throw new AccountingDomainError(
        `Account ${account.code} tidak valid sebagai offset purchase.`,
        'INVALID_PURCHASE_OFFSET_ACCOUNT'
      );
    }
    return account;
  }

  private async getOffsetAccountByCode(
    code: string,
    session?: ClientSession
  ) {
    const account = await this.accountRepository.findByCode(
      code,
      session
    );
    if (!account) {
      throw new AccountingDomainError(
        `Account default ${code} tidak ditemukan.`,
        'DEFAULT_ACCOUNT_NOT_FOUND'
      );
    }
    if (!account.is_active || !account.is_postable) {
      throw new AccountingDomainError(
        `Account default ${code} tidak dapat digunakan untuk posting.`,
        'DEFAULT_ACCOUNT_NOT_POSTABLE'
      );
    }
    return account;
  }

  private normalizeExplicitCost(data: {
    movement_type: string;
    quantity: number;
    unit_cost?: number;
    total_cost?: number;
  }) {
    if (data.movement_type !== 'purchase') {
      if (
        data.unit_cost !== undefined &&
        data.total_cost !== undefined &&
        data.unit_cost * data.quantity !== data.total_cost
      ) {
        throw new AccountingDomainError(
          'unit_cost x quantity harus sama dengan total_cost.',
          'INVENTORY_COST_MISMATCH'
        );
      }
      return {
        unit_cost: data.unit_cost,
        total_cost: data.total_cost,
      };
    }

    let unitCost = data.unit_cost;
    let totalCost = data.total_cost;
    if (unitCost === undefined && totalCost !== undefined) {
      if (totalCost % data.quantity !== 0) {
        throw new AccountingDomainError(
          'total_cost harus habis dibagi quantity jika unit_cost tidak diisi.',
          'INVENTORY_UNIT_COST_NOT_INTEGER'
        );
      }
      unitCost = totalCost / data.quantity;
    }
    if (totalCost === undefined && unitCost !== undefined) {
      totalCost = unitCost * data.quantity;
    }
    if (
      unitCost === undefined ||
      totalCost === undefined ||
      unitCost <= 0 ||
      totalCost <= 0
    ) {
      throw new AccountingDomainError(
        'Purchase inventory harus memiliki unit_cost dan total_cost yang valid.',
        'PURCHASE_COST_REQUIRED'
      );
    }
    if (unitCost * data.quantity !== totalCost) {
      throw new AccountingDomainError(
        'unit_cost x quantity harus sama dengan total_cost.',
        'INVENTORY_COST_MISMATCH'
      );
    }
    return { unit_cost: unitCost, total_cost: totalCost };
  }

  private resolveConsumptionCost(
    quantity: number,
    unitCost: number | undefined,
    totalCost: number | undefined,
    availableQuantity: number,
    availableValue: number
  ) {
    let resolvedUnitCost = unitCost;
    let resolvedTotalCost = totalCost;

    if (
      resolvedUnitCost !== undefined &&
      resolvedTotalCost !== undefined &&
      resolvedUnitCost * quantity !== resolvedTotalCost
    ) {
      throw new AccountingDomainError(
        'unit_cost x quantity harus sama dengan total_cost.',
        'INVENTORY_COST_MISMATCH'
      );
    }
    if (
      resolvedTotalCost === undefined &&
      resolvedUnitCost !== undefined
    ) {
      resolvedTotalCost = resolvedUnitCost * quantity;
    }
    if (
      resolvedUnitCost === undefined &&
      resolvedTotalCost !== undefined
    ) {
      resolvedUnitCost = Math.round(
        resolvedTotalCost / quantity
      );
    }
    if (
      resolvedTotalCost === undefined ||
      resolvedUnitCost === undefined
    ) {
      if (availableQuantity <= 0 || availableValue <= 0) {
        throw new AccountingDomainError(
          'Tidak dapat menghitung biaya consumption karena nilai inventory belum tersedia.',
          'INVENTORY_COST_UNAVAILABLE'
        );
      }
      resolvedUnitCost = Math.round(
        availableValue / availableQuantity
      );
      resolvedTotalCost = resolvedUnitCost * quantity;
    }
    if (resolvedTotalCost <= 0 || resolvedUnitCost <= 0) {
      throw new AccountingDomainError(
        'Biaya consumption harus lebih besar dari nol.',
        'INVALID_CONSUMPTION_COST'
      );
    }

    return {
      unit_cost: resolvedUnitCost,
      total_cost: resolvedTotalCost,
    };
  }
}
