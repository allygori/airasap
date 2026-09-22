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
  FinanceOpeningBalanceSetupResponseDTO,
} from './finance-opening-balance.dto';
import {
  FinanceOpeningBalanceDraftInputSchema,
  FinanceOpeningBalanceSetupResponseSchema,
} from './finance-opening-balance.schema';
import {
  FinanceOpeningBalanceDraftRepository,
  type CreateFinanceOpeningBalanceDraftRecord,
  type FinanceOpeningBalanceDraftPersistenceRecord,
} from './finance-opening-balance.repository';

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
>;

type FinanceOpeningBalanceLifecyclePort = Pick<
  FinanceLifecycleService,
  'getState' | 'assertOwner'
>;

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
  created_at: record.created_at?.toISOString() ?? null,
  updated_at: record.updated_at?.toISOString() ?? null,
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
  private readonly lifecycle: FinanceOpeningBalanceLifecyclePort;
  private readonly draftRepository: FinanceOpeningBalanceDraftRepositoryPort;
  private readonly accountRepository: FinanceOpeningBalanceAccountRepositoryPort;
  private readonly itemRepository: FinanceOpeningBalanceItemRepositoryPort;
  private readonly locationRepository: FinanceOpeningBalanceLocationRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      lifecycle?: FinanceOpeningBalanceLifecyclePort;
      draftRepository?: FinanceOpeningBalanceDraftRepositoryPort;
      accountRepository?: FinanceOpeningBalanceAccountRepositoryPort;
      itemRepository?: FinanceOpeningBalanceItemRepositoryPort;
      locationRepository?: FinanceOpeningBalanceLocationRepositoryPort;
    }
  ) {
    assertFinanceTenant(context);
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
    const liabilityAccounts = accountResult.filter(
      (account) => account.type === 'liability'
    );
    const receivableAccounts = accountResult.filter(
      (account) =>
        account.type === 'asset' &&
        Boolean(
          account.subtype?.toLowerCase().includes('receiv')
        )
    );
    const equityAccounts = accountResult.filter(
      (account) => account.type === 'equity'
    );

    return {
      cashBankAccounts,
      liabilityAccounts,
      receivableAccounts,
      equityAccounts,
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
        (account) => account.type === 'liability',
        'Akun hutang yang dipilih tidak valid.'
      );
    }
    for (const line of data.receivable_lines) {
      requireAccount(
        line.account_id,
        (account) =>
          account.type === 'asset' &&
          Boolean(
            account.subtype
              ?.toLowerCase()
              .includes('receiv')
          ),
        'Akun piutang yang dipilih tidak valid.'
      );
    }
    if (data.owner_capital_account_id) {
      requireAccount(
        data.owner_capital_account_id,
        (account) => account.type === 'equity',
        'Akun Modal Pemilik yang dipilih tidak valid.'
      );
    }

    return byId;
  }

  private async validateInventory(
    data: FinanceOpeningBalanceDraftInputDTO,
    session?: ClientSession
  ) {
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
      if (!item.track_quantity && line.quantity > 0) {
        throw new FinanceDomainError(
          `Item ${item.sku} tidak melacak quantity.`,
          'FINANCE_OPENING_BALANCE_ITEM_INVALID'
        );
      }
      if (
        !item.track_value &&
        line.unit_cost !== undefined
      ) {
        throw new FinanceDomainError(
          `Item ${item.sku} tidak melacak nilai inventory.`,
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
  }
}
