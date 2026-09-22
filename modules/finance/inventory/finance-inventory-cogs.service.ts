import { Types, type ClientSession } from 'mongoose';
import { FinanceAccountRepository } from '../accounts/finance-account.repository';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type { TFinanceSalesTransactionSourceLine } from '../sales/finance-sales-transaction.model';
import {
  FINANCE_INVENTORY_DEFAULT_ACCOUNT_BY_ITEM_TYPE,
  FINANCE_INVENTORY_DEFAULT_COGS_ACCOUNT_BY_ITEM_TYPE,
} from './finance-inventory.constants';
import {
  FinanceInventoryItemRepository,
  type FinanceInventoryItemPersistenceRecord,
} from './finance-inventory-item.repository';
import { FinanceInventoryLocationRepository } from './finance-inventory-location.repository';
import { FinanceInventoryMappingRepository } from './finance-inventory-mapping.repository';
import {
  FinanceInventoryMovementRepository,
  type CreatePostedFinanceInventoryMovementRecord,
} from './finance-inventory-movement.repository';

type FinanceInventoryCogsItemPort = Pick<
  FinanceInventoryItemRepository,
  'findActiveById'
>;

type FinanceInventoryCogsLocationPort = Pick<
  FinanceInventoryLocationRepository,
  'listActive'
>;

type FinanceInventoryCogsMappingPort = Pick<
  FinanceInventoryMappingRepository,
  'findActiveByProductVariant'
>;

type FinanceInventoryCogsMovementPort = Pick<
  FinanceInventoryMovementRepository,
  | 'getPostedBalance'
  | 'findByIdempotencyKey'
  | 'listPostedByJournalEntry'
  | 'createPosted'
>;

type FinanceInventoryCogsAccountPort = Pick<
  FinanceAccountRepository,
  | 'findSelectableById'
  | 'findSelectableBySubtype'
  | 'findSelectableByCode'
>;

export type FinanceInventoryCogsSource = {
  source_order_id: string;
  source_order_number: string;
  transaction_date: Date;
  lines: TFinanceSalesTransactionSourceLine[];
};

export type FinanceInventoryCogsJournalLine = {
  account_id: string;
  debit: number;
  credit: number;
  dimensions: {
    inventory_location_id: string;
    product_id?: string;
  };
};

export type FinanceInventoryCogsMovementPlan = {
  idempotency_key: string;
  existing_movement_id: string | null;
  inventory_item_id: string;
  location_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  occurred_at: Date;
  source_order_id: string;
  source_order_number: string;
};

export type FinanceInventoryCogsPreparation = {
  status: 'posted' | 'deferred';
  reason: string | null;
  total_cost: number | null;
  journal_lines: FinanceInventoryCogsJournalLine[];
  movements: FinanceInventoryCogsMovementPlan[];
};

type BalanceState = {
  quantity: number;
  value: number;
  unresolved: number;
  missingCost: number;
};

const isDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  if (!('code' in error)) return false;
  return (error as { code?: unknown }).code === 11000;
};

const getFinalQuantity = (
  line: TFinanceSalesTransactionSourceLine
) => Math.max(line.final_quantity, 0);

const getDeferred = (
  reason: string
): FinanceInventoryCogsPreparation => ({
  status: 'deferred',
  reason,
  total_cost: null,
  journal_lines: [],
  movements: [],
});

export class FinanceInventoryCogsService {
  private readonly itemRepository: FinanceInventoryCogsItemPort;
  private readonly locationRepository: FinanceInventoryCogsLocationPort;
  private readonly mappingRepository: FinanceInventoryCogsMappingPort;
  private readonly movementRepository: FinanceInventoryCogsMovementPort;
  private readonly accountRepository: FinanceInventoryCogsAccountPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      itemRepository?: FinanceInventoryCogsItemPort;
      locationRepository?: FinanceInventoryCogsLocationPort;
      mappingRepository?: FinanceInventoryCogsMappingPort;
      movementRepository?: FinanceInventoryCogsMovementPort;
      accountRepository?: FinanceInventoryCogsAccountPort;
    }
  ) {
    assertFinanceTenant(context);
    this.itemRepository =
      dependencies?.itemRepository ??
      new FinanceInventoryItemRepository(context);
    this.locationRepository =
      dependencies?.locationRepository ??
      new FinanceInventoryLocationRepository(context);
    this.mappingRepository =
      dependencies?.mappingRepository ??
      new FinanceInventoryMappingRepository(context);
    this.movementRepository =
      dependencies?.movementRepository ??
      new FinanceInventoryMovementRepository(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
  }

  async prepare(
    source: FinanceInventoryCogsSource,
    session?: ClientSession
  ): Promise<FinanceInventoryCogsPreparation> {
    const saleLines = source.lines.filter(
      (line) => getFinalQuantity(line) > 0
    );
    if (saleLines.length === 0) {
      return getDeferred(
        'Order tidak memiliki quantity final untuk dihitung sebagai HPP.'
      );
    }
    if (
      saleLines.some((line) => !line.product_reference_id)
    ) {
      return getDeferred(
        'Product order belum memiliki reference Product Finance untuk menghitung HPP.'
      );
    }

    const locations =
      await this.locationRepository.listActive(session);
    if (locations.length === 0) {
      return getDeferred(
        'Belum ada lokasi inventory aktif untuk mencatat HPP.'
      );
    }
    if (locations.length > 1) {
      return getDeferred(
        'HPP sales membutuhkan satu lokasi inventory aktif. Transfer antar-lokasi belum menjadi bagian release ini.'
      );
    }
    const location = locations[0];

    const balances = new Map<string, BalanceState>();
    const journalLines: FinanceInventoryCogsJournalLine[] =
      [];
    const movements: FinanceInventoryCogsMovementPlan[] =
      [];
    let totalCost = 0;

    for (const line of saleLines) {
      if (!line.product_reference_id) {
        return getDeferred(
          `Mapping product Finance tidak tersedia untuk line ${line.source_line_id}.`
        );
      }

      const mapping =
        await this.mappingRepository.findActiveByProductVariant(
          line.product_reference_id,
          line.variation_id ?? undefined,
          session
        );
      if (!mapping) {
        return getDeferred(
          `Mapping product Finance tidak tersedia untuk line ${line.source_line_id}.`
        );
      }

      const item = await this.itemRepository.findActiveById(
        String(mapping.inventory_item),
        session
      );
      if (
        !item ||
        !item.track_quantity ||
        !item.track_value
      ) {
        return getDeferred(
          `Inventory item untuk line ${line.source_line_id} belum melacak quantity dan nilai.`
        );
      }

      const itemId = String(item._id);
      let balance = balances.get(itemId);
      if (!balance) {
        const persisted =
          await this.movementRepository.getPostedBalance(
            itemId,
            String(location._id),
            session
          );
        balance = {
          quantity:
            (persisted?.inbound_quantity ?? 0) -
            (persisted?.outbound_quantity ?? 0),
          value:
            (persisted?.inbound_value ?? 0) -
            (persisted?.outbound_value ?? 0),
          unresolved:
            persisted?.unresolved_movement_count ?? 0,
          missingCost:
            persisted?.missing_cost_movement_count ?? 0,
        };
        balances.set(itemId, balance);
      }

      if (balance.unresolved > 0) {
        return getDeferred(
          `Saldo inventory ${item.sku} memiliki movement yang belum dapat diklasifikasikan.`
        );
      }
      if (balance.missingCost > 0) {
        return getDeferred(
          `Saldo inventory ${item.sku} memiliki movement tanpa cost.`
        );
      }

      const movementKey = `finance-sales-cogs:${source.source_order_id}:${line.source_line_id}`;
      const existing =
        await this.movementRepository.findByIdempotencyKey(
          movementKey,
          session
        );
      if (existing && existing.status !== 'posted') {
        return getDeferred(
          `Movement HPP untuk line ${line.source_line_id} belum selesai diposting.`
        );
      }

      let unitCost: number;
      let lineCost: number;
      if (existing?.status === 'posted') {
        unitCost = existing.unit_cost ?? 0;
        lineCost = existing.total_cost ?? 0;
        if (unitCost <= 0 || lineCost <= 0) {
          return getDeferred(
            `Movement HPP untuk line ${line.source_line_id} tidak memiliki cost yang valid.`
          );
        }
      } else {
        if (balance.quantity <= 0 || balance.value <= 0) {
          return getDeferred(
            `Stok inventory ${item.sku} tidak memiliki saldo bernilai untuk HPP.`
          );
        }
        if (balance.quantity < getFinalQuantity(line)) {
          return getDeferred(
            `Stok inventory ${item.sku} tidak mencukupi untuk HPP order.`
          );
        }

        unitCost = Math.round(
          balance.value / balance.quantity
        );
        lineCost =
          getFinalQuantity(line) === balance.quantity
            ? balance.value
            : unitCost * getFinalQuantity(line);
        if (unitCost <= 0 || lineCost <= 0) {
          return getDeferred(
            `Moving average inventory ${item.sku} belum menghasilkan cost yang valid.`
          );
        }

        balance.quantity -= getFinalQuantity(line);
        balance.value -= lineCost;
      }

      const [inventoryAccount, cogsAccount] =
        await Promise.all([
          this.resolveInventoryAccount(item, session),
          this.resolveCogsAccount(item, session),
        ]);
      if (!inventoryAccount || !cogsAccount) {
        return getDeferred(
          `Account inventory atau HPP untuk item ${item.sku} belum dikonfigurasi.`
        );
      }

      const dimensions = {
        inventory_location_id: String(location._id),
        product_id: line.product_reference_id,
      };
      journalLines.push(
        {
          account_id: String(cogsAccount._id),
          debit: lineCost,
          credit: 0,
          dimensions,
        },
        {
          account_id: String(inventoryAccount._id),
          debit: 0,
          credit: lineCost,
          dimensions,
        }
      );
      totalCost += lineCost;
      movements.push({
        idempotency_key: movementKey,
        existing_movement_id: existing
          ? String(existing._id)
          : null,
        inventory_item_id: itemId,
        location_id: String(location._id),
        quantity: getFinalQuantity(line),
        unit_cost: unitCost,
        total_cost: lineCost,
        occurred_at: source.transaction_date,
        source_order_id: source.source_order_id,
        source_order_number: source.source_order_number,
      });
    }

    return {
      status: 'posted',
      reason: null,
      total_cost: totalCost,
      journal_lines: journalLines,
      movements,
    };
  }

  async finalize(
    preparation: FinanceInventoryCogsPreparation,
    journalEntryId: string,
    session?: ClientSession
  ): Promise<string[]> {
    if (preparation.status !== 'posted') return [];
    if (!Types.ObjectId.isValid(journalEntryId)) {
      throw new FinanceDomainError(
        'Journal HPP Finance tidak valid.',
        'FINANCE_INVENTORY_COGS_FINALIZATION_FAILED'
      );
    }

    const movementIds: string[] = [];
    for (const plan of preparation.movements) {
      if (plan.existing_movement_id) {
        movementIds.push(plan.existing_movement_id);
        continue;
      }

      const existing =
        await this.movementRepository.findByIdempotencyKey(
          plan.idempotency_key,
          session
        );
      if (existing?.status === 'posted') {
        movementIds.push(String(existing._id));
        continue;
      }
      if (existing) {
        throw new FinanceDomainError(
          'Movement HPP sudah ada tetapi belum posted.',
          'FINANCE_INVENTORY_COGS_FINALIZATION_FAILED'
        );
      }

      const data: CreatePostedFinanceInventoryMovementRecord =
        {
          inventory_item: new Types.ObjectId(
            plan.inventory_item_id
          ),
          location: new Types.ObjectId(plan.location_id),
          movement_type: 'sale',
          quantity: plan.quantity,
          unit_cost: plan.unit_cost,
          total_cost: plan.total_cost,
          occurred_at: plan.occurred_at,
          source_type: 'order',
          source_id: plan.source_order_id,
          idempotency_key: plan.idempotency_key,
          reference: plan.source_order_number,
          journal_entry: new Types.ObjectId(journalEntryId),
        };

      try {
        const created =
          await this.movementRepository.createPosted(
            data,
            session
          );
        movementIds.push(String(created._id));
      } catch (error: unknown) {
        if (!isDuplicateKeyError(error)) throw error;
        const raced =
          await this.movementRepository.findByIdempotencyKey(
            plan.idempotency_key,
            session
          );
        if (!raced || raced.status !== 'posted') {
          throw new FinanceDomainError(
            'Movement HPP gagal difinalisasi.',
            'FINANCE_INVENTORY_COGS_FINALIZATION_FAILED'
          );
        }
        movementIds.push(String(raced._id));
      }
    }

    return movementIds;
  }

  async reversePostedSalesMovements(
    originalJournalEntryId: string,
    reversalJournalEntryId: string,
    occurredAt: Date,
    session?: ClientSession
  ): Promise<string[]> {
    if (
      !Types.ObjectId.isValid(originalJournalEntryId) ||
      !Types.ObjectId.isValid(reversalJournalEntryId)
    ) {
      throw new FinanceDomainError(
        'Journal reversal inventory Finance tidak valid.',
        'FINANCE_INVENTORY_COGS_REVERSAL_FAILED'
      );
    }

    const originalMovements =
      await this.movementRepository.listPostedByJournalEntry(
        originalJournalEntryId,
        session
      );
    const reversibleMovements = originalMovements.filter(
      (movement) => movement.movement_type === 'sale'
    );
    const movementIds: string[] = [];

    for (const movement of reversibleMovements) {
      const idempotencyKey = `finance-sales-cogs-reversal:${reversalJournalEntryId}:${String(movement._id)}`;
      const existing =
        await this.movementRepository.findByIdempotencyKey(
          idempotencyKey,
          session
        );

      if (existing?.status === 'posted') {
        movementIds.push(String(existing._id));
        continue;
      }
      if (existing) {
        throw new FinanceDomainError(
          'Movement reversal HPP sudah ada tetapi belum posted.',
          'FINANCE_INVENTORY_COGS_REVERSAL_FAILED'
        );
      }

      const data: CreatePostedFinanceInventoryMovementRecord =
        {
          inventory_item: movement.inventory_item,
          location: movement.location,
          movement_type: 'return',
          quantity: movement.quantity,
          unit_cost: movement.unit_cost ?? null,
          total_cost: movement.total_cost ?? null,
          occurred_at: occurredAt,
          source_type: 'journal_reversal',
          source_id: String(movement._id),
          idempotency_key: idempotencyKey,
          reference: movement.reference
            ? `Reversal ${movement.reference}`
            : `Reversal movement ${String(movement._id)}`,
          notes: `Reversal dari movement HPP ${String(movement._id)}.`,
          journal_entry: new Types.ObjectId(
            reversalJournalEntryId
          ),
        };

      try {
        const created =
          await this.movementRepository.createPosted(
            data,
            session
          );
        movementIds.push(String(created._id));
      } catch (error: unknown) {
        if (!isDuplicateKeyError(error)) throw error;
        const raced =
          await this.movementRepository.findByIdempotencyKey(
            idempotencyKey,
            session
          );
        if (!raced || raced.status !== 'posted') {
          throw new FinanceDomainError(
            'Movement reversal HPP gagal difinalisasi.',
            'FINANCE_INVENTORY_COGS_REVERSAL_FAILED'
          );
        }
        movementIds.push(String(raced._id));
      }
    }

    return movementIds;
  }

  private async resolveInventoryAccount(
    item: FinanceInventoryItemPersistenceRecord,
    session?: ClientSession
  ) {
    const defaults =
      FINANCE_INVENTORY_DEFAULT_ACCOUNT_BY_ITEM_TYPE[
        item.item_type
      ];
    const account = item.inventory_account
      ? await this.accountRepository.findSelectableById(
          String(item.inventory_account),
          session
        )
      : ((await this.accountRepository.findSelectableBySubtype(
          defaults.subtype,
          session
        )) ??
        (await this.accountRepository.findSelectableByCode(
          defaults.code,
          session
        )));

    return account?.type === 'asset' ? account : null;
  }

  private async resolveCogsAccount(
    item: FinanceInventoryItemPersistenceRecord,
    session?: ClientSession
  ) {
    const defaults =
      FINANCE_INVENTORY_DEFAULT_COGS_ACCOUNT_BY_ITEM_TYPE[
        item.item_type as keyof typeof FINANCE_INVENTORY_DEFAULT_COGS_ACCOUNT_BY_ITEM_TYPE
      ];
    if (!defaults) return null;

    const account = item.cogs_account
      ? await this.accountRepository.findSelectableById(
          String(item.cogs_account),
          session
        )
      : ((await this.accountRepository.findSelectableBySubtype(
          defaults.subtype,
          session
        )) ??
        (await this.accountRepository.findSelectableByCode(
          defaults.code,
          session
        )));

    return account &&
      [
        'cost_of_sales',
        'expense',
        'other_expense',
      ].includes(account.type)
      ? account
      : null;
  }
}
