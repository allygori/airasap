import { Types, type ClientSession } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import {
  FinanceAccountRepository,
  type FinanceAccountPersistenceRecord,
} from '../accounts/finance-account.repository';
import { FinanceJournalService } from '../journal/finance-journal.service';
import type {
  FinanceInventoryAdjustmentDTO,
  FinanceInventoryAdjustmentResponseDTO,
} from './finance-inventory.dto';
import {
  FinanceInventoryAdjustmentResponseSchema,
  FinanceInventoryAdjustmentSchema,
} from './finance-inventory.schema';
import {
  FINANCE_INVENTORY_DEFAULT_ACCOUNT_BY_ITEM_TYPE,
  FINANCE_INVENTORY_DEFAULT_ADJUSTMENT_ACCOUNT,
} from './finance-inventory.constants';
import {
  FinanceInventoryItemRepository,
  type FinanceInventoryItemPersistenceRecord,
} from './finance-inventory-item.repository';
import { FinanceInventoryLocationRepository } from './finance-inventory-location.repository';
import {
  FinanceInventoryMovementRepository,
  type FinanceInventoryMovementPersistenceRecord,
} from './finance-inventory-movement.repository';

type FinanceInventoryAdjustmentItemPort = Pick<
  FinanceInventoryItemRepository,
  'findActiveById'
>;

type FinanceInventoryAdjustmentLocationPort = Pick<
  FinanceInventoryLocationRepository,
  'findActiveById'
>;

type FinanceInventoryAdjustmentMovementPort = Pick<
  FinanceInventoryMovementRepository,
  | 'findMovementById'
  | 'findByIdempotencyKey'
  | 'createDraft'
  | 'getPostedBalance'
  | 'markPosted'
>;

type FinanceInventoryAdjustmentAccountPort = Pick<
  FinanceAccountRepository,
  | 'findSelectableById'
  | 'findSelectableBySubtype'
  | 'findSelectableByCode'
>;

type FinanceInventoryAdjustmentJournalPort = Pick<
  FinanceJournalService,
  'postOperational'
>;

const ADJUSTMENT_OFFSET_ACCOUNT_TYPES = new Set([
  'expense',
  'other_expense',
  'other_income',
]);

const getMovementType = (
  input: FinanceInventoryAdjustmentDTO
) =>
  input.direction === 'decrease' &&
  input.reason === 'damage'
    ? 'damage'
    : input.direction === 'decrease' &&
        input.reason === 'loss'
      ? 'loss'
      : 'adjustment';

const getIdempotencyKey = (
  input: FinanceInventoryAdjustmentDTO
) =>
  input.idempotency_key ??
  `finance-inventory-adjustment:${new Types.ObjectId().toHexString()}`;

const getReasonLabel = (
  reason: FinanceInventoryAdjustmentDTO['reason']
) =>
  ({
    stock_count: 'stock count',
    damage: 'kerusakan',
    loss: 'kehilangan',
    other: 'lainnya',
  })[reason];

const getDirectionLabel = (
  direction: FinanceInventoryAdjustmentDTO['direction']
) =>
  direction === 'increase' ? 'penambahan' : 'pengurangan';

const sameNullableNumber = (
  left: number | null | undefined,
  right: number | undefined
) => (left ?? null) === (right ?? null);

const assertSameRequest = (
  movement: FinanceInventoryMovementPersistenceRecord,
  input: FinanceInventoryAdjustmentDTO
) => {
  const matches =
    String(movement.inventory_item) === input.item_id &&
    String(movement.location) === input.location_id &&
    movement.adjustment_direction === input.direction &&
    movement.adjustment_reason === input.reason &&
    movement.quantity === input.quantity &&
    sameNullableNumber(movement.unit_cost, input.unit_cost);

  if (!matches) {
    throw new FinanceDomainError(
      'Idempotency key sudah digunakan untuk adjustment dengan data berbeda.',
      'FINANCE_INVENTORY_ADJUSTMENT_IDEMPOTENCY_CONFLICT'
    );
  }
};

export class FinanceInventoryAdjustmentService {
  private readonly itemRepository: FinanceInventoryAdjustmentItemPort;
  private readonly locationRepository: FinanceInventoryAdjustmentLocationPort;
  private readonly movementRepository: FinanceInventoryAdjustmentMovementPort;
  private readonly accountRepository: FinanceInventoryAdjustmentAccountPort;
  private readonly journalService: FinanceInventoryAdjustmentJournalPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      itemRepository?: FinanceInventoryAdjustmentItemPort;
      locationRepository?: FinanceInventoryAdjustmentLocationPort;
      movementRepository?: FinanceInventoryAdjustmentMovementPort;
      accountRepository?: FinanceInventoryAdjustmentAccountPort;
      journalService?: FinanceInventoryAdjustmentJournalPort;
    }
  ) {
    assertFinanceTenant(context);
    this.itemRepository =
      dependencies?.itemRepository ??
      new FinanceInventoryItemRepository(context);
    this.locationRepository =
      dependencies?.locationRepository ??
      new FinanceInventoryLocationRepository(context);
    this.movementRepository =
      dependencies?.movementRepository ??
      new FinanceInventoryMovementRepository(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
    this.journalService =
      dependencies?.journalService ??
      new FinanceJournalService(context);
  }

  async post(
    input: FinanceInventoryAdjustmentDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceInventoryAdjustmentResponseDTO> {
    const data =
      FinanceInventoryAdjustmentSchema.parse(input);
    const idempotencyKey = getIdempotencyKey(data);
    const existing =
      await this.movementRepository.findByIdempotencyKey(
        idempotencyKey,
        session
      );

    if (existing) {
      assertSameRequest(existing, data);
      if (existing.status === 'posted') {
        return this.toResponse(existing, idempotencyKey);
      }
      if (existing.status === 'voided') {
        throw new FinanceDomainError(
          'Adjustment yang sudah voided tidak dapat dipakai ulang.',
          'FINANCE_INVENTORY_ADJUSTMENT_IDEMPOTENCY_CONFLICT'
        );
      }
    }

    const item = await this.itemRepository.findActiveById(
      data.item_id,
      session
    );
    if (!item) {
      throw new FinanceDomainError(
        'Item inventory tidak ditemukan atau tidak aktif.',
        'FINANCE_INVENTORY_ITEM_NOT_FOUND'
      );
    }

    const location =
      await this.locationRepository.findActiveById(
        data.location_id,
        session
      );
    if (!location) {
      throw new FinanceDomainError(
        'Lokasi inventory tidak ditemukan pada organization aktif.',
        'FINANCE_INVENTORY_LOCATION_NOT_FOUND'
      );
    }

    if (!item.track_quantity) {
      throw new FinanceDomainError(
        'Item ini tidak melacak quantity sehingga tidak dapat disesuaikan.',
        'FINANCE_INVENTORY_QUANTITY_NOT_TRACKED'
      );
    }

    const unitCost = item.track_value
      ? data.unit_cost
      : undefined;
    if (item.track_value && unitCost === undefined) {
      throw new FinanceDomainError(
        'Item bernilai wajib memiliki unit cost untuk adjustment.',
        'FINANCE_INVENTORY_VALUE_COST_REQUIRED'
      );
    }

    const balance =
      await this.movementRepository.getPostedBalance(
        data.item_id,
        data.location_id,
        session
      );
    if ((balance?.unresolved_movement_count ?? 0) > 0) {
      throw new FinanceDomainError(
        'Saldo lokasi memiliki movement yang belum dapat diklasifikasikan. Selesaikan review terlebih dahulu.',
        'FINANCE_INVENTORY_BALANCE_UNRESOLVED'
      );
    }
    if (
      item.track_value &&
      (balance?.missing_cost_movement_count ?? 0) > 0
    ) {
      throw new FinanceDomainError(
        'Saldo lokasi memiliki movement tanpa cost. Selesaikan review cost terlebih dahulu.',
        'FINANCE_INVENTORY_BALANCE_COST_MISSING'
      );
    }

    const currentQuantity = balance?.inbound_quantity ?? 0;
    const currentOutboundQuantity =
      balance?.outbound_quantity ?? 0;
    const currentOnHand =
      currentQuantity - currentOutboundQuantity;
    if (
      data.direction === 'decrease' &&
      currentOnHand < data.quantity
    ) {
      throw new FinanceDomainError(
        `Adjustment ditolak karena stok lokasi hanya ${currentOnHand} ${item.unit}.`,
        'FINANCE_INVENTORY_NEGATIVE_STOCK'
      );
    }

    const inventoryAccount = item.track_value
      ? await this.resolveInventoryAccount(item, session)
      : null;
    const offsetAccount = item.track_value
      ? await this.resolveOffsetAccount(
          data.offset_account_id,
          session
        )
      : null;
    if (
      inventoryAccount &&
      offsetAccount &&
      String(inventoryAccount._id) ===
        String(offsetAccount._id)
    ) {
      throw new FinanceDomainError(
        'Akun lawan adjustment tidak boleh sama dengan akun inventory.',
        'FINANCE_INVENTORY_ADJUSTMENT_ACCOUNT_INVALID'
      );
    }

    const movement =
      existing ??
      (await this.movementRepository.createDraft(
        {
          inventory_item: new Types.ObjectId(data.item_id),
          location: new Types.ObjectId(data.location_id),
          movement_type: getMovementType(data),
          adjustment_direction: data.direction,
          adjustment_reason: data.reason,
          quantity: data.quantity,
          ...(unitCost !== undefined
            ? { unit_cost: unitCost }
            : { unit_cost: null }),
          ...(unitCost !== undefined
            ? { total_cost: data.quantity * unitCost }
            : { total_cost: null }),
          occurred_at: data.transaction_date,
          source_type: 'finance_inventory_adjustment',
          source_id: idempotencyKey,
          ...(offsetAccount
            ? { offset_account: offsetAccount._id }
            : {}),
          idempotency_key: idempotencyKey,
          ...(data.notes ? { notes: data.notes } : {}),
          status: 'draft',
        },
        session
      ));

    let journalEntryId: string | undefined;
    if (
      inventoryAccount &&
      offsetAccount &&
      unitCost !== undefined
    ) {
      const journalResult =
        await this.journalService.postOperational(
          {
            transaction_date: data.transaction_date,
            posting_date: data.transaction_date,
            currency: 'IDR',
            description: `Adjustment stok ${item.name} — ${getDirectionLabel(data.direction)} (${getReasonLabel(data.reason)})`,
            source_type: 'inventory_adjustment',
            source_id: String(movement._id),
            source_event: 'inventory_adjustment_posted',
            idempotency_key: `finance-inventory-adjustment-journal:${String(movement._id)}`,
            lines:
              data.direction === 'increase'
                ? [
                    {
                      account_id: String(
                        inventoryAccount._id
                      ),
                      debit: data.quantity * unitCost,
                      credit: 0,
                      dimensions: {
                        inventory_location_id:
                          data.location_id,
                      },
                    },
                    {
                      account_id: String(offsetAccount._id),
                      debit: 0,
                      credit: data.quantity * unitCost,
                      dimensions: {
                        inventory_location_id:
                          data.location_id,
                      },
                    },
                  ]
                : [
                    {
                      account_id: String(offsetAccount._id),
                      debit: data.quantity * unitCost,
                      credit: 0,
                      dimensions: {
                        inventory_location_id:
                          data.location_id,
                      },
                    },
                    {
                      account_id: String(
                        inventoryAccount._id
                      ),
                      debit: 0,
                      credit: data.quantity * unitCost,
                      dimensions: {
                        inventory_location_id:
                          data.location_id,
                      },
                    },
                  ],
          },
          session
        );
      journalEntryId = journalResult.journal_entry.id;
    }

    const posted = await this.movementRepository.markPosted(
      String(movement._id),
      journalEntryId,
      {
        unit_cost: unitCost ?? null,
        total_cost:
          unitCost === undefined
            ? null
            : data.quantity * unitCost,
      },
      session
    );
    if (!posted) {
      const latest =
        await this.movementRepository.findMovementById(
          String(movement._id),
          session
        );
      if (latest?.status === 'posted') {
        return this.toResponse(latest, idempotencyKey);
      }

      throw new FinanceDomainError(
        'Journal berhasil dibuat tetapi adjustment gagal ditandai posted.',
        'FINANCE_INVENTORY_ADJUSTMENT_FINALIZATION_FAILED'
      );
    }

    return this.toResponse(posted, idempotencyKey);
  }

  private async resolveInventoryAccount(
    item: FinanceInventoryItemPersistenceRecord,
    session?: ClientSession
  ): Promise<FinanceAccountPersistenceRecord> {
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

    if (!account || account.type !== 'asset') {
      throw new FinanceDomainError(
        'Akun inventory item belum dikonfigurasi sebagai asset yang dapat diposting.',
        'FINANCE_INVENTORY_ADJUSTMENT_ACCOUNT_NOT_CONFIGURED'
      );
    }
    return account;
  }

  private async resolveOffsetAccount(
    accountId: string | undefined,
    session?: ClientSession
  ): Promise<FinanceAccountPersistenceRecord> {
    const account = accountId
      ? await this.accountRepository.findSelectableById(
          accountId,
          session
        )
      : ((await this.accountRepository.findSelectableBySubtype(
          FINANCE_INVENTORY_DEFAULT_ADJUSTMENT_ACCOUNT.subtype,
          session
        )) ??
        (await this.accountRepository.findSelectableByCode(
          FINANCE_INVENTORY_DEFAULT_ADJUSTMENT_ACCOUNT.code,
          session
        )));

    if (!account) {
      throw new FinanceDomainError(
        'Akun lawan adjustment belum tersedia pada Chart of Accounts.',
        'FINANCE_INVENTORY_ADJUSTMENT_ACCOUNT_NOT_CONFIGURED'
      );
    }
    if (
      !ADJUSTMENT_OFFSET_ACCOUNT_TYPES.has(account.type)
    ) {
      throw new FinanceDomainError(
        'Akun lawan adjustment harus berupa beban atau pendapatan lain yang dapat diposting.',
        'FINANCE_INVENTORY_ADJUSTMENT_ACCOUNT_INVALID'
      );
    }
    return account;
  }

  private toResponse(
    movement: FinanceInventoryMovementPersistenceRecord,
    idempotencyKey: string
  ): FinanceInventoryAdjustmentResponseDTO {
    return FinanceInventoryAdjustmentResponseSchema.parse({
      movement_id: String(movement._id),
      item_id: String(movement.inventory_item),
      location_id: String(movement.location),
      direction: movement.adjustment_direction,
      reason: movement.adjustment_reason,
      status: movement.status,
      quantity: movement.quantity,
      unit_cost: movement.unit_cost ?? null,
      total_cost: movement.total_cost ?? null,
      journal_entry_id: movement.journal_entry
        ? String(movement.journal_entry)
        : null,
      idempotency_key:
        movement.idempotency_key ?? idempotencyKey,
    });
  }
}
