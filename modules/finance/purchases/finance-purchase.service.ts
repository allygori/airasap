import { Types, type ClientSession } from 'mongoose';
import { FinanceAccountRepository } from '../accounts/finance-account.repository';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import { FINANCE_CASH_BANK_SUBTYPE_VALUES } from '../cash-and-bank/finance-cash-bank.constants';
import { FinanceInventoryItemRepository } from '../inventory/finance-inventory-item.repository';
import type { FinanceInventoryItemPersistenceRecord } from '../inventory/finance-inventory-item.repository';
import { FinanceInventoryLocationRepository } from '../inventory/finance-inventory-location.repository';
import { FINANCE_INVENTORY_DEFAULT_ACCOUNT_BY_ITEM_TYPE } from '../inventory/finance-inventory.constants';
import { FinanceInventoryMovementRepository } from '../inventory/finance-inventory-movement.repository';
import { FinanceJournalService } from '../journal/finance-journal.service';
import type {
  FinanceJournalPostResultDTO,
  FinanceOperationalPostingDTO,
} from '../journal/finance-journal.dto';
import type {
  FinancePurchaseInputDTO,
  FinancePurchaseResponseDTO,
} from './finance-purchase.dto';
import {
  FinancePurchaseInputSchema,
  FinancePurchaseResponseSchema,
} from './finance-purchase.schema';
import {
  FinancePurchaseRepository,
  type CreateFinancePurchaseRecord,
  type FinancePurchasePersistenceRecord,
} from './finance-purchase.repository';

type FinancePurchaseItemPort = Pick<
  FinanceInventoryItemRepository,
  'findActiveById'
>;

type FinancePurchaseLocationPort = Pick<
  FinanceInventoryLocationRepository,
  'findActiveById'
>;

type FinancePurchaseAccountPort = Pick<
  FinanceAccountRepository,
  | 'findSelectableById'
  | 'findSelectableBySubtype'
  | 'findSelectableByCode'
>;

type FinancePurchaseMovementPort = Pick<
  FinanceInventoryMovementRepository,
  'findByIdempotencyKey' | 'createPosted'
>;

type FinancePurchaseJournalPort = Pick<
  FinanceJournalService,
  'postOperational'
>;

const eligiblePaymentSubtypes = new Set<string>(
  FINANCE_CASH_BANK_SUBTYPE_VALUES
);

const getIdempotencyKey = (
  input: FinancePurchaseInputDTO
) =>
  input.idempotency_key ??
  `finance-purchase:${new Types.ObjectId().toHexString()}`;

const isDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  if (!('code' in error)) return false;
  return (error as { code?: unknown }).code === 11000;
};

const getSupplierDescription = (
  record: FinancePurchasePersistenceRecord
) =>
  record.supplier_name
    ? `Pembelian dari ${record.supplier_name}`
    : 'Pembelian inventory';

const mapAccount = (
  id: Types.ObjectId | null | undefined,
  code: string | null | undefined,
  name: string | null | undefined
) =>
  id && code && name
    ? { id: String(id), code, name }
    : null;

const toResponse = (
  record: FinancePurchasePersistenceRecord,
  replayed: boolean
): FinancePurchaseResponseDTO =>
  FinancePurchaseResponseSchema.parse({
    purchase_id: String(record._id),
    supplier_name: record.supplier_name ?? null,
    supplier_reference: record.supplier_reference ?? null,
    transaction_date: record.transaction_date.toISOString(),
    payment_timing: record.payment_timing,
    payment_account: mapAccount(
      record.payment_account,
      record.payment_account_code,
      record.payment_account_name
    ),
    offset_account: mapAccount(
      record.offset_account,
      record.offset_account_code,
      record.offset_account_name
    ),
    lines: record.lines.map((line) => ({
      item_id: String(line.inventory_item),
      item_sku: line.item_sku,
      item_name: line.item_name,
      location_id: String(line.location),
      location_code: line.location_code,
      location_name: line.location_name,
      quantity: line.quantity,
      unit_cost: line.unit_cost,
      line_total: line.line_total,
    })),
    inventory_movement_ids: record.inventory_movements.map(
      (movementId) => String(movementId)
    ),
    total_amount: record.total_amount,
    notes: record.notes ?? null,
    status: record.status,
    journal_entry_id: record.journal_entry
      ? String(record.journal_entry)
      : null,
    idempotency_key: record.idempotency_key,
    replayed,
  });

const assertSameDraftRequest = (
  existing: FinancePurchasePersistenceRecord,
  input: FinancePurchaseInputDTO,
  idempotencyKey: string
) => {
  const sameLines =
    existing.lines.length === input.lines.length &&
    existing.lines.every((line, index) => {
      const requested = input.lines[index];
      return (
        String(line.inventory_item) === requested.item_id &&
        String(line.location) === requested.location_id &&
        line.quantity === requested.quantity &&
        line.unit_cost === requested.unit_cost
      );
    });
  const sameRequest =
    sameLines &&
    existing.transaction_date.getTime() ===
      input.transaction_date.getTime() &&
    existing.payment_timing === input.payment_timing &&
    String(existing.payment_account ?? '') ===
      (input.payment_account_id ?? '') &&
    (existing.supplier_name ?? null) ===
      (input.supplier_name ?? null) &&
    (existing.supplier_reference ?? null) ===
      (input.supplier_reference ?? null) &&
    (existing.notes ?? null) === (input.notes ?? null) &&
    existing.idempotency_key === idempotencyKey;

  if (!sameRequest) {
    throw new FinanceDomainError(
      'Idempotency key sudah digunakan untuk purchase dengan data berbeda.',
      'FINANCE_PURCHASE_IDEMPOTENCY_CONFLICT'
    );
  }
};

export class FinancePurchaseService {
  private readonly itemRepository: FinancePurchaseItemPort;
  private readonly locationRepository: FinancePurchaseLocationPort;
  private readonly accountRepository: FinancePurchaseAccountPort;
  private readonly movementRepository: FinancePurchaseMovementPort;
  private readonly journalService: FinancePurchaseJournalPort;
  private readonly purchaseRepository: FinancePurchaseRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      itemRepository?: FinancePurchaseItemPort;
      locationRepository?: FinancePurchaseLocationPort;
      accountRepository?: FinancePurchaseAccountPort;
      movementRepository?: FinancePurchaseMovementPort;
      journalService?: FinancePurchaseJournalPort;
      purchaseRepository?: FinancePurchaseRepositoryPort;
    }
  ) {
    assertFinanceTenant(context);
    this.itemRepository =
      dependencies?.itemRepository ??
      new FinanceInventoryItemRepository(context);
    this.locationRepository =
      dependencies?.locationRepository ??
      new FinanceInventoryLocationRepository(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
    this.movementRepository =
      dependencies?.movementRepository ??
      new FinanceInventoryMovementRepository(context);
    this.journalService =
      dependencies?.journalService ??
      new FinanceJournalService(context);
    this.purchaseRepository =
      dependencies?.purchaseRepository ??
      new FinancePurchaseRepository(context);
  }

  async createDraft(
    input: FinancePurchaseInputDTO | unknown,
    session?: ClientSession
  ): Promise<FinancePurchaseResponseDTO> {
    const data = FinancePurchaseInputSchema.parse(input);
    const idempotencyKey = getIdempotencyKey(data);
    const existing =
      await this.purchaseRepository.findByIdempotencyKey(
        idempotencyKey,
        session
      );
    if (existing) {
      assertSameDraftRequest(
        existing,
        data,
        idempotencyKey
      );
      return toResponse(existing, true);
    }

    const resolvedLines = await Promise.all(
      data.lines.map(async (line) => {
        const [item, location] = await Promise.all([
          this.itemRepository.findActiveById(
            line.item_id,
            session
          ),
          this.locationRepository.findActiveById(
            line.location_id,
            session
          ),
        ]);
        this.assertTrackableItem(item);
        if (!location) {
          throw new FinanceDomainError(
            'Lokasi inventory tidak ditemukan atau tidak aktif.',
            'FINANCE_PURCHASE_LOCATION_NOT_FOUND'
          );
        }

        return {
          inventory_item: item._id,
          item_sku: item.sku,
          item_name: item.name,
          location: location._id,
          location_code: location.code,
          location_name: location.name,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          line_total: line.quantity * line.unit_cost,
        };
      })
    );

    const paymentAccount =
      data.payment_timing === 'paid'
        ? await this.resolvePaymentAccount(
            data.payment_account_id!,
            session
          )
        : null;
    const totalAmount = resolvedLines.reduce(
      (sum, line) => sum + line.line_total,
      0
    );

    const created = await this.createPurchase(
      {
        supplier_name: data.supplier_name ?? null,
        supplier_reference: data.supplier_reference ?? null,
        transaction_date: data.transaction_date,
        payment_timing: data.payment_timing,
        payment_account: paymentAccount?._id ?? null,
        payment_account_code: paymentAccount?.code ?? null,
        payment_account_name: paymentAccount?.name ?? null,
        offset_account: null,
        offset_account_code: null,
        offset_account_name: null,
        lines: resolvedLines,
        inventory_movements: [],
        total_amount: totalAmount,
        notes: data.notes ?? null,
        status: 'draft',
        journal_entry: null,
        idempotency_key: idempotencyKey,
      },
      session
    );

    return toResponse(created, false);
  }

  async post(
    purchaseId: string,
    session?: ClientSession
  ): Promise<FinancePurchaseResponseDTO> {
    const purchase =
      await this.purchaseRepository.findPurchaseById(
        purchaseId,
        session
      );
    if (!purchase) {
      throw new FinanceDomainError(
        'Purchase Finance tidak ditemukan.',
        'FINANCE_PURCHASE_NOT_FOUND'
      );
    }
    if (purchase.status === 'posted') {
      return toResponse(purchase, true);
    }

    const accountByLine = await Promise.all(
      purchase.lines.map(async (line) => {
        const item =
          await this.itemRepository.findActiveById(
            String(line.inventory_item),
            session
          );
        this.assertTrackableItem(item);
        const inventoryAccount =
          await this.resolveInventoryAccount(item, session);
        return { line, item, inventoryAccount };
      })
    );

    const offsetAccount =
      purchase.payment_timing === 'paid'
        ? await this.resolvePaymentAccount(
            String(purchase.payment_account ?? ''),
            session
          )
        : await this.resolvePayableAccount(session);

    const journalLines: FinanceOperationalPostingDTO['lines'] =
      accountByLine.flatMap(
        ({ line, inventoryAccount }) => [
          {
            account_id: String(inventoryAccount._id),
            debit: line.line_total,
            credit: 0,
            description: `Pembelian ${line.item_sku}`,
            dimensions: {
              inventory_location_id: String(line.location),
              product_id: String(line.inventory_item),
            },
          },
        ]
      );
    journalLines.push({
      account_id: String(offsetAccount._id),
      debit: 0,
      credit: purchase.total_amount,
      description:
        purchase.payment_timing === 'payable'
          ? 'Utang pembelian'
          : 'Pembayaran purchase',
    });

    const journalResult =
      await this.journalService.postOperational(
        {
          transaction_date: purchase.transaction_date,
          posting_date: purchase.transaction_date,
          currency: 'IDR',
          description: getSupplierDescription(purchase),
          source_type: 'purchase',
          source_id: String(purchase._id),
          source_event: 'purchase_posted',
          idempotency_key: `finance-purchase-journal:${String(
            purchase._id
          )}`,
          lines: journalLines,
        },
        session
      );

    const movementIds = await this.finalizeMovements(
      purchase,
      journalResult,
      session
    );
    const posted = await this.purchaseRepository.markPosted(
      String(purchase._id),
      journalResult.journal_entry.id,
      String(offsetAccount._id),
      offsetAccount.code,
      offsetAccount.name,
      movementIds,
      session
    );
    if (!posted) {
      const latest =
        await this.purchaseRepository.findPurchaseById(
          String(purchase._id),
          session
        );
      if (latest?.status === 'posted') {
        return toResponse(latest, true);
      }

      throw new FinanceDomainError(
        'Journal purchase berhasil dibuat tetapi purchase gagal ditandai posted.',
        'FINANCE_PURCHASE_FINALIZATION_FAILED'
      );
    }

    return toResponse(posted, journalResult.replayed);
  }

  private async finalizeMovements(
    purchase: FinancePurchasePersistenceRecord,
    journalResult: FinanceJournalPostResultDTO,
    session?: ClientSession
  ): Promise<string[]> {
    const movementIds: string[] = [];
    for (const [index, line] of purchase.lines.entries()) {
      const idempotencyKey = `finance-purchase:${String(
        purchase._id
      )}:line:${index}`;
      const existing =
        await this.movementRepository.findByIdempotencyKey(
          idempotencyKey,
          session
        );
      if (existing) {
        if (
          existing.status === 'posted' &&
          existing.journal_entry &&
          String(existing.journal_entry) ===
            journalResult.journal_entry.id
        ) {
          movementIds.push(String(existing._id));
          continue;
        }

        throw new FinanceDomainError(
          'Movement purchase sudah ada tetapi belum konsisten dengan journal.',
          'FINANCE_PURCHASE_FINALIZATION_FAILED'
        );
      }

      try {
        const movement =
          await this.movementRepository.createPosted(
            {
              inventory_item: line.inventory_item,
              location: line.location,
              movement_type: 'purchase',
              quantity: line.quantity,
              unit_cost: line.unit_cost,
              total_cost: line.line_total,
              occurred_at: purchase.transaction_date,
              source_type: 'finance_purchase',
              source_id: String(purchase._id),
              idempotency_key: idempotencyKey,
              reference:
                purchase.supplier_reference ??
                purchase.supplier_name ??
                undefined,
              notes: purchase.notes ?? undefined,
              journal_entry: new Types.ObjectId(
                journalResult.journal_entry.id
              ),
            },
            session
          );
        movementIds.push(String(movement._id));
      } catch (error: unknown) {
        if (!isDuplicateKeyError(error)) throw error;
        const raced =
          await this.movementRepository.findByIdempotencyKey(
            idempotencyKey,
            session
          );
        if (
          !raced ||
          raced.status !== 'posted' ||
          !raced.journal_entry
        ) {
          throw new FinanceDomainError(
            'Movement purchase gagal difinalisasi.',
            'FINANCE_PURCHASE_FINALIZATION_FAILED'
          );
        }
        movementIds.push(String(raced._id));
      }
    }

    return movementIds;
  }

  private async createPurchase(
    data: CreateFinancePurchaseRecord,
    session?: ClientSession
  ): Promise<FinancePurchasePersistenceRecord> {
    try {
      return await this.purchaseRepository.createDraft(
        data,
        session
      );
    } catch (error: unknown) {
      if (!isDuplicateKeyError(error)) throw error;
      const existing =
        await this.purchaseRepository.findByIdempotencyKey(
          data.idempotency_key,
          session
        );
      if (existing) {
        const sameLines =
          existing.lines.length === data.lines.length &&
          existing.lines.every((line, index) => {
            const requested = data.lines[index];
            return (
              String(line.inventory_item) ===
                String(requested.inventory_item) &&
              String(line.location) ===
                String(requested.location) &&
              line.quantity === requested.quantity &&
              line.unit_cost === requested.unit_cost
            );
          });
        if (
          sameLines &&
          existing.total_amount === data.total_amount &&
          existing.payment_timing === data.payment_timing &&
          String(existing.payment_account ?? '') ===
            String(data.payment_account ?? '')
        ) {
          return existing;
        }

        throw new FinanceDomainError(
          'Idempotency key sudah digunakan untuk purchase dengan data berbeda.',
          'FINANCE_PURCHASE_IDEMPOTENCY_CONFLICT'
        );
      }
      throw new FinanceDomainError(
        'Purchase Finance gagal dibuat karena konflik data.',
        'FINANCE_PURCHASE_IDEMPOTENCY_CONFLICT'
      );
    }
  }

  private assertTrackableItem(
    item: FinanceInventoryItemPersistenceRecord | null
  ): asserts item is FinanceInventoryItemPersistenceRecord {
    if (!item) {
      throw new FinanceDomainError(
        'Item inventory tidak ditemukan atau tidak aktif.',
        'FINANCE_PURCHASE_ITEM_NOT_FOUND'
      );
    }
    if (!item.track_quantity || !item.track_value) {
      throw new FinanceDomainError(
        `Item ${item.sku} harus melacak quantity dan nilai untuk purchase inventory.`,
        'FINANCE_PURCHASE_INVENTORY_TRACKING_REQUIRED'
      );
    }
  }

  private async resolvePaymentAccount(
    accountId: string,
    session?: ClientSession
  ) {
    const account =
      await this.accountRepository.findSelectableById(
        accountId,
        session
      );
    if (
      !account ||
      account.type !== 'asset' ||
      !eligiblePaymentSubtypes.has(account.subtype ?? '')
    ) {
      throw new FinanceDomainError(
        'Akun pembayaran purchase harus berupa Kas, Bank, E-wallet, atau Saldo Marketplace yang aktif dan postable.',
        'FINANCE_PURCHASE_PAYMENT_ACCOUNT_INVALID'
      );
    }
    return account;
  }

  private async resolvePayableAccount(
    session?: ClientSession
  ) {
    const account =
      (await this.accountRepository.findSelectableBySubtype(
        'accounts_payable',
        session
      )) ??
      (await this.accountRepository.findSelectableByCode(
        '2100',
        session
      ));
    if (!account || account.type !== 'liability') {
      throw new FinanceDomainError(
        'Akun Utang Usaha aktif dan postable belum tersedia.',
        'FINANCE_PURCHASE_PAYABLE_ACCOUNT_MISSING'
      );
    }
    return account;
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
      : defaults
        ? ((await this.accountRepository.findSelectableBySubtype(
            defaults.subtype,
            session
          )) ??
          (await this.accountRepository.findSelectableByCode(
            defaults.code,
            session
          )))
        : null;
    if (!account || account.type !== 'asset') {
      throw new FinanceDomainError(
        `Akun inventory untuk item ${item.sku} belum tersedia atau tidak valid.`,
        'FINANCE_PURCHASE_INVENTORY_ACCOUNT_INVALID'
      );
    }
    return account;
  }
}

type FinancePurchaseRepositoryPort = Pick<
  FinancePurchaseRepository,
  | 'findByIdempotencyKey'
  | 'findPurchaseById'
  | 'createDraft'
  | 'markPosted'
>;
