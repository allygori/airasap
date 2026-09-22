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
import { FINANCE_CASH_BANK_SUBTYPE_VALUES } from '../cash-and-bank/finance-cash-bank.constants';
import { FINANCE_INVENTORY_DEFAULT_ACCOUNT_BY_ITEM_TYPE } from '../inventory/finance-inventory.constants';
import { FinanceInventoryMovementRepository } from '../inventory/finance-inventory-movement.repository';
import { FinanceJournalService } from '../journal/finance-journal.service';
import type { FinanceOperationalPostingDTO } from '../journal/finance-journal.dto';
import {
  FinanceInventoryItemRepository,
  type FinanceInventoryItemPersistenceRecord,
} from '../inventory/finance-inventory-item.repository';
import {
  FinanceInventoryLocationRepository,
  type FinanceInventoryLocationPersistenceRecord,
} from '../inventory/finance-inventory-location.repository';
import { FinanceLifecycleService } from '../finance-lifecycle.service';
import type {
  FinanceOpeningBalanceDraftInputDTO,
  FinanceOpeningBalanceFinalizeResponseDTO,
  FinanceOpeningBalancePreviewDTO,
  FinanceOpeningBalanceSetupResponseDTO,
} from './finance-opening-balance.dto';
import {
  FinanceOpeningBalanceDraftInputSchema,
  FinanceOpeningBalanceFinalizeInputSchema,
  FinanceOpeningBalanceFinalizeResponseSchema,
  FinanceOpeningBalancePreviewSchema,
  FinanceOpeningBalanceSetupResponseSchema,
} from './finance-opening-balance.schema';
import {
  FinanceOpeningBalanceDraftRepository,
  type CreateFinanceOpeningBalanceDraftRecord,
  type FinanceOpeningBalanceDraftPersistenceRecord,
} from './finance-opening-balance.repository';
import {
  FinanceOpeningBalanceSubledgerItemRepository,
  type CreateFinanceOpeningBalanceSubledgerItem,
} from './finance-opening-balance-subledger-item.repository';
import { FINANCE_OPENING_BALANCE_JOURNAL_SOURCE } from './finance-opening-balance.constants';

type FinanceOpeningBalanceAccountRepositoryPort = Pick<
  FinanceAccountRepository,
  'list' | 'findSelectableByIds'
>;

type FinanceOpeningBalanceItemRepositoryPort = Pick<
  FinanceInventoryItemRepository,
  'listActive' | 'findActiveById'
>;

type FinanceOpeningBalanceLocationRepositoryPort = Pick<
  FinanceInventoryLocationRepository,
  'listActive' | 'findActiveById'
>;

type FinanceOpeningBalanceDraftRepositoryPort = Pick<
  FinanceOpeningBalanceDraftRepository,
  'findCurrent' | 'createDraft' | 'updateDraft'
> &
  Partial<
    Pick<
      FinanceOpeningBalanceDraftRepository,
      'markFinalized'
    >
  >;

type FinanceOpeningBalanceLifecyclePort = Pick<
  FinanceLifecycleService,
  'getState' | 'assertOwner'
> &
  Partial<Pick<FinanceLifecycleService, 'activate'>>;

type FinanceOpeningBalanceJournalPort = Pick<
  FinanceJournalService,
  'postOperational'
>;

type FinanceOpeningBalanceMovementPort = Pick<
  FinanceInventoryMovementRepository,
  'createPosted' | 'findByIdempotencyKey'
>;

type FinanceOpeningBalancePlan = {
  lines: FinanceOpeningBalancePreviewDTO['journal_lines'];
  total_debit: number;
  total_credit: number;
  movements: Array<{
    line_index: number;
    item: FinanceInventoryItemPersistenceRecord;
    location: FinanceInventoryLocationPersistenceRecord;
    quantity: number;
    unit_cost: number;
    total_cost: number;
  }>;
  subledger_items: Array<{
    balance_type: 'receivable' | 'payable';
    account_id: Types.ObjectId;
    source_id: string;
    source_label: string;
    amount: number;
    counterparty?: string;
    reference?: string;
  }>;
};

type OpeningBalanceSetupOptions =
  FinanceOpeningBalanceSetupResponseDTO['options'];

const toDateOnly = (value: Date) =>
  value.toISOString().slice(0, 10);

const parseDateOnly = (value: string) =>
  new Date(`${value}T00:00:00.000Z`);

const isDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  if (!('code' in error)) return false;
  return (error as { code?: unknown }).code === 11000;
};

const sumAmounts = (
  lines: ReadonlyArray<{ amount: number }>
) => lines.reduce((sum, line) => sum + line.amount, 0);

const toAccountOption = (
  account: FinanceAccountPersistenceRecord
): OpeningBalanceSetupOptions['cash_bank_accounts'][number] => ({
  id: String(account._id),
  code: account.code,
  name: account.name,
  type: account.type,
  subtype: account.subtype ?? null,
  normal_balance: account.normal_balance,
});

const toInventoryOption = (
  item: FinanceInventoryItemPersistenceRecord
): OpeningBalanceSetupOptions['inventory_items'][number] => ({
  id: String(item._id),
  sku: item.sku,
  name: item.name,
  item_type: item.item_type,
  unit: item.unit,
  track_quantity: item.track_quantity,
  track_value: item.track_value,
});

const toLocationOption = (
  location: FinanceInventoryLocationPersistenceRecord
): OpeningBalanceSetupOptions['locations'][number] => ({
  id: String(location._id),
  code: location.code,
  name: location.name,
});

const toDraftDTO = (
  record: FinanceOpeningBalanceDraftPersistenceRecord
): FinanceOpeningBalanceSetupResponseDTO['draft'] => ({
  id: String(record._id),
  status: record.status,
  onboarding_version: record.onboarding_version,
  cut_off_date: toDateOnly(record.cut_off_date),
  mode: record.mode,
  description: record.description,
  cash_bank_lines: record.cash_bank_lines.map((line) => ({
    account_id: String(line.account_id),
    amount: line.amount,
  })),
  inventory_lines: record.inventory_lines.map((line) => ({
    inventory_item_id: String(line.inventory_item_id),
    location_id: String(line.location_id),
    quantity: line.quantity,
    ...(line.unit_cost !== undefined
      ? { unit_cost: line.unit_cost }
      : {}),
  })),
  payable_lines: record.payable_lines.map((line) => ({
    account_id: String(line.account_id),
    amount: line.amount,
    ...(line.counterparty
      ? { counterparty: line.counterparty }
      : {}),
    ...(line.reference
      ? { reference: line.reference }
      : {}),
  })),
  receivable_lines: record.receivable_lines.map((line) => ({
    account_id: String(line.account_id),
    amount: line.amount,
    ...(line.counterparty
      ? { counterparty: line.counterparty }
      : {}),
    ...(line.reference
      ? { reference: line.reference }
      : {}),
  })),
  ...(record.owner_capital_account_id
    ? {
        owner_capital_account_id: String(
          record.owner_capital_account_id
        ),
      }
    : {}),
  ...(record.owner_capital_amount !== undefined
    ? { owner_capital_amount: record.owner_capital_amount }
    : {}),
  journal_entry_id: record.journal_entry
    ? String(record.journal_entry)
    : null,
  inventory_movement_ids: (
    record.inventory_movement_ids ?? []
  ).map(String),
  finalized_at: record.finalized_at?.toISOString() ?? null,
  created_at: record.created_at?.toISOString() ?? null,
  updated_at: record.updated_at?.toISOString() ?? null,
});

const toDraftInput = (
  record: FinanceOpeningBalanceDraftPersistenceRecord
): FinanceOpeningBalanceDraftInputDTO =>
  FinanceOpeningBalanceDraftInputSchema.parse({
    cut_off_date: toDateOnly(record.cut_off_date),
    mode: record.mode,
    description: record.description,
    cash_bank_lines: record.cash_bank_lines.map((line) => ({
      account_id: String(line.account_id),
      amount: line.amount,
    })),
    inventory_lines: record.inventory_lines.map((line) => ({
      inventory_item_id: String(line.inventory_item_id),
      location_id: String(line.location_id),
      quantity: line.quantity,
      ...(line.unit_cost !== undefined
        ? { unit_cost: line.unit_cost }
        : {}),
    })),
    payable_lines: record.payable_lines.map((line) => ({
      account_id: String(line.account_id),
      amount: line.amount,
      ...(line.counterparty
        ? { counterparty: line.counterparty }
        : {}),
      ...(line.reference
        ? { reference: line.reference }
        : {}),
    })),
    receivable_lines: record.receivable_lines.map(
      (line) => ({
        account_id: String(line.account_id),
        amount: line.amount,
        ...(line.counterparty
          ? { counterparty: line.counterparty }
          : {}),
        ...(line.reference
          ? { reference: line.reference }
          : {}),
      })
    ),
    ...(record.owner_capital_account_id
      ? {
          owner_capital_account_id: String(
            record.owner_capital_account_id
          ),
        }
      : {}),
    ...(record.owner_capital_amount !== undefined
      ? {
          owner_capital_amount: record.owner_capital_amount,
        }
      : {}),
  });

const getSummary = (
  input:
    | FinanceOpeningBalanceDraftInputDTO
    | FinanceOpeningBalanceSetupResponseDTO['draft'],
  itemById: Map<
    string,
    FinanceInventoryItemPersistenceRecord
  >
): FinanceOpeningBalanceSetupResponseDTO['summary'] => {
  if (!input || input.mode === 'zero') {
    return {
      cash_bank_total: 0,
      inventory_total: 0,
      receivable_total: 0,
      total_assets: 0,
      payable_total: 0,
      owner_capital_total: 0,
      retained_earnings_balance: 0,
    };
  }

  const cashBankTotal = sumAmounts(input.cash_bank_lines);
  const inventoryTotal = input.inventory_lines.reduce(
    (sum, line) => {
      const item = itemById.get(line.inventory_item_id);
      if (!item?.track_value) return sum;
      return sum + line.quantity * (line.unit_cost ?? 0);
    },
    0
  );
  const receivableTotal = sumAmounts(
    input.receivable_lines
  );
  const payableTotal = sumAmounts(input.payable_lines);
  const ownerCapitalTotal = input.owner_capital_amount ?? 0;
  const totalAssets =
    cashBankTotal + inventoryTotal + receivableTotal;

  return {
    cash_bank_total: cashBankTotal,
    inventory_total: inventoryTotal,
    receivable_total: receivableTotal,
    total_assets: totalAssets,
    payable_total: payableTotal,
    owner_capital_total: ownerCapitalTotal,
    retained_earnings_balance:
      totalAssets - payableTotal - ownerCapitalTotal,
  };
};

export class FinanceOpeningBalanceService {
  private readonly context: FinanceTenantContext;
  private readonly lifecycle: FinanceOpeningBalanceLifecyclePort;
  private readonly draftRepository: FinanceOpeningBalanceDraftRepositoryPort;
  private readonly accountRepository: FinanceOpeningBalanceAccountRepositoryPort;
  private readonly itemRepository: FinanceOpeningBalanceItemRepositoryPort;
  private readonly locationRepository: FinanceOpeningBalanceLocationRepositoryPort;
  private readonly journalService: FinanceOpeningBalanceJournalPort;
  private readonly movementRepository: FinanceOpeningBalanceMovementPort;
  private readonly subledgerItemRepository: FinanceOpeningBalanceSubledgerItemRepository;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      lifecycle?: FinanceOpeningBalanceLifecyclePort;
      draftRepository?: FinanceOpeningBalanceDraftRepositoryPort;
      accountRepository?: FinanceOpeningBalanceAccountRepositoryPort;
      itemRepository?: FinanceOpeningBalanceItemRepositoryPort;
      locationRepository?: FinanceOpeningBalanceLocationRepositoryPort;
      journalService?: FinanceOpeningBalanceJournalPort;
      movementRepository?: FinanceOpeningBalanceMovementPort;
      subledgerItemRepository?: FinanceOpeningBalanceSubledgerItemRepository;
    }
  ) {
    assertFinanceTenant(context);
    this.context = context;
    this.lifecycle =
      dependencies?.lifecycle ??
      new FinanceLifecycleService(context);
    this.draftRepository =
      dependencies?.draftRepository ??
      new FinanceOpeningBalanceDraftRepository(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
    this.itemRepository =
      dependencies?.itemRepository ??
      new FinanceInventoryItemRepository(context);
    this.locationRepository =
      dependencies?.locationRepository ??
      new FinanceInventoryLocationRepository(context);
    this.journalService =
      dependencies?.journalService ??
      new FinanceJournalService(context);
    this.movementRepository =
      dependencies?.movementRepository ??
      new FinanceInventoryMovementRepository(context);
    this.subledgerItemRepository =
      dependencies?.subledgerItemRepository ??
      new FinanceOpeningBalanceSubledgerItemRepository(
        context
      );
  }

  async getSetup(
    session?: ClientSession
  ): Promise<FinanceOpeningBalanceSetupResponseDTO> {
    await this.lifecycle.assertOwner();
    const state = await this.lifecycle.getState(session);
    if (
      state.status !== 'in_progress' &&
      state.status !== 'active'
    ) {
      throw new FinanceDomainError(
        'Finance onboarding belum dimulai.',
        'FINANCE_ONBOARDING_NOT_IN_PROGRESS'
      );
    }

    const [draft, options] = await Promise.all([
      this.draftRepository.findCurrent(
        state.onboarding_version,
        session
      ),
      this.loadOptions(session),
    ]);

    const draftDTO = draft ? toDraftDTO(draft) : null;

    return FinanceOpeningBalanceSetupResponseSchema.parse({
      finance_status: state.status,
      draft: draftDTO,
      options: {
        cash_bank_accounts:
          options.cashBankAccounts.map(toAccountOption),
        liability_accounts:
          options.liabilityAccounts.map(toAccountOption),
        receivable_accounts:
          options.receivableAccounts.map(toAccountOption),
        equity_accounts:
          options.equityAccounts.map(toAccountOption),
        retained_earnings_accounts:
          options.retainedEarningsAccounts.map(
            toAccountOption
          ),
        inventory_items: options.inventoryItems.map(
          toInventoryOption
        ),
        locations: options.locations.map(toLocationOption),
      },
      summary: getSummary(
        draftDTO,
        new Map(
          options.inventoryItems.map((item) => [
            String(item._id),
            item,
          ])
        )
      ),
    });
  }

  async saveDraft(
    input: FinanceOpeningBalanceDraftInputDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceOpeningBalanceSetupResponseDTO> {
    await this.lifecycle.assertOwner();
    const state = await this.lifecycle.getState(session);
    if (state.status === 'active') {
      throw new FinanceDomainError(
        'Finance onboarding sudah selesai dan tidak dapat diubah.',
        'FINANCE_ONBOARDING_ALREADY_COMPLETED'
      );
    }
    if (state.status !== 'in_progress') {
      throw new FinanceDomainError(
        'Finance onboarding belum dimulai.',
        'FINANCE_ONBOARDING_NOT_IN_PROGRESS'
      );
    }

    const data =
      FinanceOpeningBalanceDraftInputSchema.parse(input);
    const cutOffDate = parseDateOnly(data.cut_off_date);
    const today = new Date();
    const todayDate = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate()
      )
    );
    if (
      Number.isNaN(cutOffDate.getTime()) ||
      cutOffDate > todayDate
    ) {
      throw new FinanceDomainError(
        'Tanggal cut-off tidak boleh berada di masa depan.',
        'FINANCE_OPENING_BALANCE_CUTOFF_INVALID'
      );
    }

    const accounts = await this.validateAccounts(
      data,
      session
    );
    await this.validateInventory(data, session);

    const record: CreateFinanceOpeningBalanceDraftRecord = {
      onboarding_version: state.onboarding_version,
      status: 'draft',
      cut_off_date: cutOffDate,
      mode: data.mode,
      description: data.description,
      cash_bank_lines: data.cash_bank_lines.map((line) => ({
        account_id: accounts.get(line.account_id)!._id,
        amount: line.amount,
      })),
      inventory_lines: data.inventory_lines.map((line) => ({
        inventory_item_id: new Types.ObjectId(
          line.inventory_item_id
        ),
        location_id: new Types.ObjectId(line.location_id),
        quantity: line.quantity,
        ...(line.unit_cost !== undefined
          ? { unit_cost: line.unit_cost }
          : {}),
      })),
      payable_lines: data.payable_lines.map((line) => ({
        account_id: accounts.get(line.account_id)!._id,
        amount: line.amount,
        ...(line.counterparty
          ? { counterparty: line.counterparty }
          : {}),
        ...(line.reference
          ? { reference: line.reference }
          : {}),
      })),
      receivable_lines: data.receivable_lines.map(
        (line) => ({
          account_id: accounts.get(line.account_id)!._id,
          amount: line.amount,
          ...(line.counterparty
            ? { counterparty: line.counterparty }
            : {}),
          ...(line.reference
            ? { reference: line.reference }
            : {}),
        })
      ),
      ...(data.owner_capital_account_id
        ? {
            owner_capital_account_id: accounts.get(
              data.owner_capital_account_id
            )!._id,
          }
        : {}),
      ...(data.owner_capital_amount !== undefined
        ? {
            owner_capital_amount: data.owner_capital_amount,
          }
        : {}),
    };

    const current = await this.draftRepository.findCurrent(
      state.onboarding_version,
      session
    );

    if (current) {
      const updated =
        await this.draftRepository.updateDraft(
          String(current._id),
          record,
          session
        );
      if (!updated) {
        throw new FinanceDomainError(
          'Draft opening balance berubah sebelum dapat disimpan.',
          'FINANCE_OPENING_BALANCE_SAVE_CONFLICT'
        );
      }
    } else {
      try {
        await this.draftRepository.createDraft(
          record,
          session
        );
      } catch (error: unknown) {
        if (!isDuplicateKeyError(error)) throw error;
        const latest =
          await this.draftRepository.findCurrent(
            state.onboarding_version,
            session
          );
        if (!latest) {
          throw new FinanceDomainError(
            'Draft opening balance gagal disimpan karena konflik data.',
            'FINANCE_OPENING_BALANCE_SAVE_CONFLICT'
          );
        }
        await this.draftRepository.updateDraft(
          String(latest._id),
          record,
          session
        );
      }
    }

    return this.getSetup(session);
  }

  async preview(
    session?: ClientSession
  ): Promise<FinanceOpeningBalancePreviewDTO> {
    await this.lifecycle.assertOwner();
    const state = await this.lifecycle.getState(session);
    if (state.status !== 'in_progress') {
      throw new FinanceDomainError(
        'Finance onboarding tidak sedang menunggu finalisasi.',
        'FINANCE_ONBOARDING_NOT_IN_PROGRESS'
      );
    }
    const draft = await this.draftRepository.findCurrent(
      state.onboarding_version,
      session
    );
    if (!draft || draft.status !== 'draft') {
      throw new FinanceDomainError(
        'Simpan draft opening balance sebelum melihat preview.',
        'FINANCE_OPENING_BALANCE_DRAFT_REQUIRED'
      );
    }

    const plan = await this.buildPlan(draft, session);
    const data = toDraftInput(draft);
    const { itemsById } = await this.validateInventory(
      data,
      session
    );
    const summary = getSummary(data, itemsById);

    return FinanceOpeningBalancePreviewSchema.parse({
      cut_off_date: toDateOnly(draft.cut_off_date),
      mode: draft.mode,
      summary,
      journal_lines: plan.lines,
      inventory_movements: plan.movements.map(
        (movement) => ({
          inventory_item_id: String(movement.item._id),
          sku: movement.item.sku,
          item_name: movement.item.name,
          location_id: String(movement.location._id),
          location_name: movement.location.name,
          quantity: movement.quantity,
          unit: movement.item.unit,
          unit_cost: movement.unit_cost,
          total_cost: movement.total_cost,
        })
      ),
      subledger_items: plan.subledger_items.map((item) => ({
        balance_type: item.balance_type,
        source_label: item.source_label,
        amount: item.amount,
      })),
      total_debit: plan.total_debit,
      total_credit: plan.total_credit,
      will_create_journal: plan.lines.length > 0,
      inventory_movement_count: plan.movements.length,
      payable_item_count: plan.subledger_items.filter(
        (item) => item.balance_type === 'payable'
      ).length,
      receivable_item_count: plan.subledger_items.filter(
        (item) => item.balance_type === 'receivable'
      ).length,
    });
  }

  async finalize(
    input: unknown,
    session?: ClientSession
  ): Promise<FinanceOpeningBalanceFinalizeResponseDTO> {
    FinanceOpeningBalanceFinalizeInputSchema.parse(input);
    await this.lifecycle.assertOwner();
    const state = await this.lifecycle.getState(session);
    const draft = await this.draftRepository.findCurrent(
      state.onboarding_version,
      session
    );
    if (!draft) {
      throw new FinanceDomainError(
        'Opening balance belum disimpan.',
        'FINANCE_OPENING_BALANCE_DRAFT_REQUIRED'
      );
    }

    if (state.status === 'active') {
      if (
        draft.status !== 'posted' &&
        draft.status !== 'skipped'
      ) {
        throw new FinanceDomainError(
          'Finance sudah aktif tanpa batch opening balance yang dapat diverifikasi.',
          'FINANCE_LIFECYCLE_CONFLICT'
        );
      }
      return this.toFinalizeResponse(draft, true);
    }
    if (
      state.status !== 'in_progress' ||
      draft.status !== 'draft'
    ) {
      throw new FinanceDomainError(
        'Draft opening balance tidak dapat difinalisasi pada status saat ini.',
        'FINANCE_LIFECYCLE_CONFLICT'
      );
    }
    if (
      !this.draftRepository.markFinalized ||
      !this.lifecycle.activate
    ) {
      throw new FinanceDomainError(
        'Finalisasi opening balance belum tersedia.',
        'FINANCE_LIFECYCLE_CONFLICT'
      );
    }

    let journalEntryId: string | null = null;
    let movementIds: Types.ObjectId[] = [];
    let status: 'posted' | 'skipped' = 'skipped';
    let payableCount = 0;
    let receivableCount = 0;

    if (draft.mode === 'entered') {
      const plan = await this.buildPlan(draft, session);
      if (plan.lines.length === 0) {
        throw new FinanceDomainError(
          'Semua saldo masih nol. Pilih “Mulai dari nol” atau masukkan saldo yang benar.',
          'FINANCE_OPENING_BALANCE_EMPTY'
        );
      }

      const data = toDraftInput(draft);
      const journalLines: FinanceOperationalPostingDTO['lines'] =
        plan.lines.map((line) => ({
          account_id: line.account_id,
          debit: line.debit,
          credit: line.credit,
          description: line.description,
        }));
      const posting =
        await this.journalService.postOperational(
          {
            transaction_date: draft.cut_off_date,
            posting_date: draft.cut_off_date,
            currency: 'IDR',
            description: data.description,
            source_type:
              FINANCE_OPENING_BALANCE_JOURNAL_SOURCE,
            source_id: String(draft._id),
            source_event: 'opening_balance_posted',
            idempotency_key: `finance-opening-balance:${this.context.organizationId}:${draft.onboarding_version}:${toDateOnly(draft.cut_off_date)}`,
            lines: journalLines,
          },
          session
        );
      journalEntryId = posting.journal_entry.id;
      status = 'posted';

      for (const movement of plan.movements) {
        const idempotencyKey = `finance-opening-balance:${this.context.organizationId}:${draft.onboarding_version}:${toDateOnly(draft.cut_off_date)}:inventory:${movement.line_index}`;
        let created =
          await this.movementRepository.findByIdempotencyKey(
            idempotencyKey,
            session
          );
        if (!created) {
          created =
            await this.movementRepository.createPosted(
              {
                inventory_item: movement.item._id,
                location: movement.location._id,
                movement_type: 'opening_balance',
                quantity: movement.quantity,
                unit_cost: movement.unit_cost,
                total_cost: movement.total_cost,
                occurred_at: draft.cut_off_date,
                source_type:
                  FINANCE_OPENING_BALANCE_JOURNAL_SOURCE,
                source_id: String(draft._id),
                idempotency_key: idempotencyKey,
                reference: data.description,
                notes: `Saldo awal ${movement.item.sku}`,
                journal_entry: new Types.ObjectId(
                  journalEntryId
                ),
              },
              session
            );
        }
        movementIds.push(created._id);
      }

      const openingItems: CreateFinanceOpeningBalanceSubledgerItem[] =
        plan.subledger_items.map((item) => ({
          opening_balance_draft: draft._id,
          journal_entry: new Types.ObjectId(
            journalEntryId!
          ),
          balance_type: item.balance_type,
          account_id: item.account_id,
          source_id: item.source_id,
          source_label: item.source_label,
          description: item.source_label,
          transaction_date: draft.cut_off_date,
          currency: 'IDR',
          amount: item.amount,
          ...(item.counterparty
            ? { counterparty: item.counterparty }
            : {}),
          ...(item.reference
            ? { reference: item.reference }
            : {}),
          status: 'posted',
        }));
      await this.subledgerItemRepository.createMany(
        openingItems,
        session
      );
      payableCount = openingItems.filter(
        (item) => item.balance_type === 'payable'
      ).length;
      receivableCount = openingItems.filter(
        (item) => item.balance_type === 'receivable'
      ).length;
    }

    const completedAt = new Date();
    const finalized =
      await this.draftRepository.markFinalized(
        String(draft._id),
        status,
        {
          journal_entry: journalEntryId
            ? new Types.ObjectId(journalEntryId)
            : null,
          inventory_movement_ids: movementIds,
          finalized_at: completedAt,
          ...(this.context.userId
            ? {
                finalized_by: new Types.ObjectId(
                  this.context.userId
                ),
              }
            : {}),
        },
        session
      );
    if (!finalized) {
      throw new FinanceDomainError(
        'Opening balance berhasil diproses tetapi batch gagal ditandai selesai.',
        'FINANCE_OPENING_BALANCE_FINALIZATION_FAILED'
      );
    }

    await this.lifecycle.activate(
      {
        onboarding_version: state.onboarding_version,
        cut_off_date: draft.cut_off_date,
        completed_at: completedAt,
      },
      session
    );

    return FinanceOpeningBalanceFinalizeResponseSchema.parse(
      {
        finance_status: 'active',
        status,
        cut_off_date: toDateOnly(draft.cut_off_date),
        journal_entry_id: journalEntryId,
        inventory_movement_count: movementIds.length,
        payable_item_count: payableCount,
        receivable_item_count: receivableCount,
        replayed: false,
      }
    );
  }

  private toFinalizeResponse(
    draft: FinanceOpeningBalanceDraftPersistenceRecord,
    replayed: boolean
  ): FinanceOpeningBalanceFinalizeResponseDTO {
    return FinanceOpeningBalanceFinalizeResponseSchema.parse(
      {
        finance_status: 'active',
        status: draft.status,
        cut_off_date: toDateOnly(draft.cut_off_date),
        journal_entry_id: draft.journal_entry
          ? String(draft.journal_entry)
          : null,
        inventory_movement_count:
          draft.inventory_movement_ids?.length ?? 0,
        payable_item_count: draft.payable_lines.filter(
          (line) => line.amount > 0
        ).length,
        receivable_item_count:
          draft.receivable_lines.filter(
            (line) => line.amount > 0
          ).length,
        replayed,
      }
    );
  }

  private async buildPlan(
    draft: FinanceOpeningBalanceDraftPersistenceRecord,
    session?: ClientSession
  ): Promise<FinanceOpeningBalancePlan> {
    const data = toDraftInput(draft);
    if (data.mode === 'zero') {
      return {
        lines: [],
        total_debit: 0,
        total_credit: 0,
        movements: [],
        subledger_items: [],
      };
    }

    const cutOffDate = parseDateOnly(data.cut_off_date);
    if (
      Number.isNaN(cutOffDate.getTime()) ||
      cutOffDate > new Date()
    ) {
      throw new FinanceDomainError(
        'Tanggal cut-off tidak valid atau berada di masa depan.',
        'FINANCE_OPENING_BALANCE_CUTOFF_INVALID'
      );
    }

    const accountsById = await this.validateAccounts(
      data,
      session
    );
    const { itemsById, locationsById } =
      await this.validateInventory(data, session);
    const selectableAccounts =
      await this.accountRepository.list(
        { is_active: true, is_postable: true, limit: 500 },
        session
      );
    const customInventoryAccountIds = [
      ...new Set(
        [...itemsById.values()]
          .map((item) => item.inventory_account)
          .filter((id): id is Types.ObjectId => Boolean(id))
          .map(String)
      ),
    ];
    const customInventoryAccounts =
      await this.accountRepository.findSelectableByIds(
        customInventoryAccountIds,
        session
      );
    const allSelectableById = new Map(
      [
        ...selectableAccounts,
        ...customInventoryAccounts,
      ].map((account) => [String(account._id), account])
    );
    const journalLines = new Map<
      string,
      {
        account: FinanceAccountPersistenceRecord;
        debit: number;
        credit: number;
        descriptions: string[];
      }
    >();
    const addAmount = (
      account: FinanceAccountPersistenceRecord,
      side: 'debit' | 'credit',
      amount: number,
      description: string
    ) => {
      if (!Number.isSafeInteger(amount) || amount < 0) {
        throw new FinanceDomainError(
          'Nilai saldo opening balance melebihi batas angka yang aman.',
          'FINANCE_OPENING_BALANCE_AMOUNT_INVALID'
        );
      }
      if (amount === 0) return;
      const key = String(account._id);
      const line = journalLines.get(key) ?? {
        account,
        debit: 0,
        credit: 0,
        descriptions: [],
      };
      line[side] += amount;
      if (!Number.isSafeInteger(line[side])) {
        throw new FinanceDomainError(
          'Nilai saldo opening balance melebihi batas angka yang aman.',
          'FINANCE_OPENING_BALANCE_AMOUNT_INVALID'
        );
      }
      line.descriptions.push(description);
      journalLines.set(key, line);
    };

    for (const line of data.cash_bank_lines) {
      const account = accountsById.get(line.account_id);
      if (account) {
        addAmount(
          account,
          'debit',
          line.amount,
          'Saldo awal kas/bank'
        );
      }
    }

    const movements: FinanceOpeningBalancePlan['movements'] =
      [];
    for (const [
      lineIndex,
      line,
    ] of data.inventory_lines.entries()) {
      if (line.quantity <= 0) continue;
      const item = itemsById.get(line.inventory_item_id);
      const location = locationsById.get(line.location_id);
      if (!item || !location) continue;
      const defaults =
        FINANCE_INVENTORY_DEFAULT_ACCOUNT_BY_ITEM_TYPE[
          item.item_type
        ];
      const inventoryAccount = item.inventory_account
        ? allSelectableById.get(
            String(item.inventory_account)
          )
        : (selectableAccounts.find(
            (account) =>
              account.subtype === defaults.subtype
          ) ??
          selectableAccounts.find(
            (account) => account.code === defaults.code
          ));
      if (
        !inventoryAccount ||
        inventoryAccount.type !== 'asset'
      ) {
        throw new FinanceDomainError(
          `Akun persediaan untuk item ${item.sku} belum tersedia atau tidak valid.`,
          'FINANCE_OPENING_BALANCE_INVENTORY_ACCOUNT_INVALID'
        );
      }
      const unitCost = line.unit_cost ?? 0;
      const totalCost = line.quantity * unitCost;
      if (
        !Number.isSafeInteger(totalCost) ||
        totalCost > 1_000_000_000_000_000
      ) {
        throw new FinanceDomainError(
          `Nilai persediaan ${item.sku} melebihi batas yang dapat dicatat.`,
          'FINANCE_OPENING_BALANCE_AMOUNT_INVALID'
        );
      }
      addAmount(
        inventoryAccount,
        'debit',
        totalCost,
        `Saldo awal persediaan ${item.sku}`
      );
      movements.push({
        line_index: lineIndex,
        item,
        location,
        quantity: line.quantity,
        unit_cost: unitCost,
        total_cost: totalCost,
      });
    }

    const subledgerItems: FinanceOpeningBalancePlan['subledger_items'] =
      [];
    for (const [
      index,
      line,
    ] of data.receivable_lines.entries()) {
      const account = accountsById.get(line.account_id);
      if (!account) continue;
      addAmount(
        account,
        'debit',
        line.amount,
        'Saldo awal piutang'
      );
      if (line.amount > 0) {
        const sourceLabel = [
          line.counterparty,
          line.reference,
        ]
          .filter(Boolean)
          .join(' · ');
        subledgerItems.push({
          balance_type: 'receivable',
          account_id: account._id,
          source_id: `${draft._id}:receivable:${index}`,
          source_label: sourceLabel,
          amount: line.amount,
          ...(line.counterparty
            ? { counterparty: line.counterparty }
            : {}),
          ...(line.reference
            ? { reference: line.reference }
            : {}),
        });
      }
    }
    for (const [
      index,
      line,
    ] of data.payable_lines.entries()) {
      const account = accountsById.get(line.account_id);
      if (!account) continue;
      addAmount(
        account,
        'credit',
        line.amount,
        'Saldo awal hutang'
      );
      if (line.amount > 0) {
        const sourceLabel = [
          line.counterparty,
          line.reference,
        ]
          .filter(Boolean)
          .join(' · ');
        subledgerItems.push({
          balance_type: 'payable',
          account_id: account._id,
          source_id: `${draft._id}:payable:${index}`,
          source_label: sourceLabel,
          amount: line.amount,
          ...(line.counterparty
            ? { counterparty: line.counterparty }
            : {}),
          ...(line.reference
            ? { reference: line.reference }
            : {}),
        });
      }
    }

    const ownerCapitalAmount =
      data.owner_capital_amount ?? 0;
    if (
      ownerCapitalAmount > 0 &&
      data.owner_capital_account_id
    ) {
      const ownerCapital = accountsById.get(
        data.owner_capital_account_id
      );
      if (ownerCapital) {
        addAmount(
          ownerCapital,
          'credit',
          ownerCapitalAmount,
          'Modal pemilik saldo awal'
        );
      }
    }

    const summary = getSummary(data, itemsById);
    const retainedAmount =
      summary.retained_earnings_balance;
    if (retainedAmount !== 0) {
      const retainedAccount =
        selectableAccounts.find(
          (account) =>
            account.subtype === 'retained_earnings'
        ) ??
        selectableAccounts.find(
          (account) => account.code === '3200'
        );
      if (
        !retainedAccount ||
        retainedAccount.type !== 'equity'
      ) {
        throw new FinanceDomainError(
          'Akun Saldo Laba belum tersedia pada Chart of Accounts.',
          'FINANCE_OPENING_BALANCE_RETAINED_EARNINGS_ACCOUNT_MISSING'
        );
      }
      addAmount(
        retainedAccount,
        retainedAmount > 0 ? 'credit' : 'debit',
        Math.abs(retainedAmount),
        retainedAmount > 0
          ? 'Saldo laba awal (dihitung otomatis)'
          : 'Defisit saldo laba awal (dihitung otomatis)'
      );
    }

    const lines = [...journalLines.values()]
      .map((line) => {
        const debit = Math.max(line.debit - line.credit, 0);
        const credit = Math.max(
          line.credit - line.debit,
          0
        );
        return {
          account_id: String(line.account._id),
          account_code: line.account.code,
          account_name: line.account.name,
          debit,
          credit,
          description: line.descriptions
            .join('; ')
            .slice(0, 500),
        };
      })
      .filter((line) => line.debit > 0 || line.credit > 0)
      .sort((left, right) =>
        left.account_code.localeCompare(right.account_code)
      );
    if (lines.length === 0) {
      throw new FinanceDomainError(
        'Semua saldo masih nol. Pilih “Mulai dari nol” atau masukkan saldo yang benar.',
        'FINANCE_OPENING_BALANCE_EMPTY'
      );
    }
    const totalDebit = lines.reduce(
      (sum, line) => sum + line.debit,
      0
    );
    const totalCredit = lines.reduce(
      (sum, line) => sum + line.credit,
      0
    );
    if (
      totalDebit !== totalCredit ||
      !Number.isSafeInteger(totalDebit) ||
      totalDebit > 1_000_000_000_000_000
    ) {
      throw new FinanceDomainError(
        'Opening balance tidak seimbang atau melebihi batas nilai yang dapat dicatat.',
        'FINANCE_OPENING_BALANCE_UNBALANCED'
      );
    }
    if (lines.length > 200) {
      throw new FinanceDomainError(
        'Opening balance memiliki terlalu banyak akun untuk satu journal. Kurangi atau gabungkan detail akun.',
        'FINANCE_OPENING_BALANCE_TOO_MANY_LINES'
      );
    }

    return {
      lines,
      total_debit: totalDebit,
      total_credit: totalCredit,
      movements,
      subledger_items: subledgerItems,
    };
  }

  private async loadOptions(session?: ClientSession) {
    const [accountResult, itemResult, locations] =
      await Promise.all([
        this.accountRepository.list(
          {
            is_active: true,
            is_postable: true,
            limit: 500,
          },
          session
        ),
        this.itemRepository.listActive(
          { page: 1, limit: 500 },
          session
        ),
        this.locationRepository.listActive(session),
      ]);

    const cashBankAccounts = accountResult.filter(
      (account) =>
        account.type === 'asset' &&
        Boolean(
          account.subtype &&
          FINANCE_CASH_BANK_SUBTYPE_VALUES.includes(
            account.subtype as (typeof FINANCE_CASH_BANK_SUBTYPE_VALUES)[number]
          )
        )
    );
    const payableControlAccount =
      accountResult.find(
        (account) => account.subtype === 'accounts_payable'
      ) ??
      accountResult.find(
        (account) => account.code === '2100'
      );
    const receivableControlAccount =
      accountResult.find(
        (account) =>
          account.subtype === 'marketplace_receivable'
      ) ??
      accountResult.find(
        (account) => account.code === '1210'
      );
    const liabilityAccounts =
      payableControlAccount?.type === 'liability'
        ? [payableControlAccount]
        : [];
    const receivableAccounts =
      receivableControlAccount?.type === 'asset'
        ? [receivableControlAccount]
        : [];
    const equityAccounts = accountResult.filter(
      (account) =>
        account.type === 'equity' &&
        account.subtype === 'owner_capital'
    );
    const retainedEarningsAccounts = accountResult.filter(
      (account) =>
        account.type === 'equity' &&
        (account.subtype === 'retained_earnings' ||
          account.code === '3200')
    );

    return {
      cashBankAccounts,
      liabilityAccounts,
      receivableAccounts,
      equityAccounts,
      retainedEarningsAccounts,
      inventoryItems: itemResult.records,
      locations,
    };
  }

  private async validateAccounts(
    data: FinanceOpeningBalanceDraftInputDTO,
    session?: ClientSession
  ) {
    const ids = [
      ...data.cash_bank_lines.map(
        (line) => line.account_id
      ),
      ...data.payable_lines.map((line) => line.account_id),
      ...data.receivable_lines.map(
        (line) => line.account_id
      ),
      ...(data.owner_capital_account_id
        ? [data.owner_capital_account_id]
        : []),
    ];
    const uniqueIds = [...new Set(ids)];
    const records =
      await this.accountRepository.findSelectableByIds(
        uniqueIds,
        session
      );
    const byId = new Map(
      records.map((record) => [String(record._id), record])
    );

    const requireAccount = (
      accountId: string,
      predicate: (
        account: FinanceAccountPersistenceRecord
      ) => boolean,
      message: string
    ) => {
      const account = byId.get(accountId);
      if (!account || !predicate(account)) {
        throw new FinanceDomainError(
          message,
          'FINANCE_OPENING_BALANCE_ACCOUNT_INVALID'
        );
      }
      return account;
    };

    const cashIds = new Set<string>();
    for (const line of data.cash_bank_lines) {
      if (cashIds.has(line.account_id)) {
        throw new FinanceDomainError(
          'Satu akun Kas, Bank, E-wallet, atau Saldo Marketplace hanya boleh dipilih sekali.',
          'FINANCE_OPENING_BALANCE_DUPLICATE_LINE'
        );
      }
      cashIds.add(line.account_id);
      requireAccount(
        line.account_id,
        (account) =>
          account.type === 'asset' &&
          Boolean(
            account.subtype &&
            FINANCE_CASH_BANK_SUBTYPE_VALUES.includes(
              account.subtype as (typeof FINANCE_CASH_BANK_SUBTYPE_VALUES)[number]
            )
          ),
        'Akun Kas/Bank yang dipilih tidak valid.'
      );
    }

    for (const line of data.payable_lines) {
      requireAccount(
        line.account_id,
        (account) =>
          account.type === 'liability' &&
          (account.subtype === 'accounts_payable' ||
            account.code === '2100'),
        'Akun hutang yang dipilih tidak valid.'
      );
    }
    for (const line of data.receivable_lines) {
      requireAccount(
        line.account_id,
        (account) =>
          account.type === 'asset' &&
          (account.subtype === 'marketplace_receivable' ||
            account.code === '1210'),
        'Akun piutang yang dipilih tidak valid.'
      );
    }
    if (data.owner_capital_account_id) {
      requireAccount(
        data.owner_capital_account_id,
        (account) =>
          account.type === 'equity' &&
          account.subtype === 'owner_capital',
        'Akun Modal Pemilik yang dipilih tidak valid.'
      );
    }

    return byId;
  }

  private async validateInventory(
    data: FinanceOpeningBalanceDraftInputDTO,
    session?: ClientSession
  ): Promise<{
    itemsById: Map<
      string,
      FinanceInventoryItemPersistenceRecord
    >;
    locationsById: Map<
      string,
      FinanceInventoryLocationPersistenceRecord
    >;
  }> {
    const itemIds = [
      ...new Set(
        data.inventory_lines.map(
          (line) => line.inventory_item_id
        )
      ),
    ];
    const items = await Promise.all(
      itemIds.map((id) =>
        this.itemRepository.findActiveById(id, session)
      )
    );
    const itemById = new Map(
      items
        .filter(
          (
            item
          ): item is FinanceInventoryItemPersistenceRecord =>
            Boolean(item)
        )
        .map((item) => [String(item._id), item])
    );
    const locationIds = new Set(
      data.inventory_lines.map((line) => line.location_id)
    );
    const locations = await Promise.all(
      [...locationIds].map((id) =>
        this.locationRepository.findActiveById(id, session)
      )
    );
    const locationById = new Map(
      locations
        .filter(
          (
            location
          ): location is FinanceInventoryLocationPersistenceRecord =>
            Boolean(location)
        )
        .map((location) => [String(location._id), location])
    );
    const pairs = new Set<string>();

    for (const line of data.inventory_lines) {
      const item = itemById.get(line.inventory_item_id);
      if (!item) {
        throw new FinanceDomainError(
          'Item inventory tidak ditemukan atau tidak aktif.',
          'FINANCE_OPENING_BALANCE_ITEM_INVALID'
        );
      }
      if (!locationById.has(line.location_id)) {
        throw new FinanceDomainError(
          'Lokasi inventory tidak ditemukan atau tidak aktif.',
          'FINANCE_OPENING_BALANCE_LOCATION_INVALID'
        );
      }
      if (
        line.quantity > 0 &&
        (item.item_type === 'fixed_asset' ||
          !item.track_quantity ||
          !item.track_value)
      ) {
        throw new FinanceDomainError(
          `Item ${item.sku} bukan barang persediaan yang dapat dinilai untuk saldo awal.`,
          'FINANCE_OPENING_BALANCE_ITEM_INVALID'
        );
      }
      const pair = `${line.inventory_item_id}:${line.location_id}`;
      if (pairs.has(pair)) {
        throw new FinanceDomainError(
          'Satu item inventory pada lokasi yang sama hanya boleh dimasukkan sekali.',
          'FINANCE_OPENING_BALANCE_DUPLICATE_LINE'
        );
      }
      pairs.add(pair);
    }

    return {
      itemsById: itemById,
      locationsById: locationById,
    };
  }
}
