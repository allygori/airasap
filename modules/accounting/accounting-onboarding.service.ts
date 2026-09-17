import mongoose, {
  Types,
  type ClientSession,
} from 'mongoose';
import { StoreModel } from '@/modules/stores/store.model';
import { ProductModel } from '@/modules/products/product.model';
import { InventoryItemRepository } from '@/modules/inventory/items/inventory-item.repository';
import { InventoryItemMappingRepository } from '@/modules/inventory/mappings/inventory-item-mapping.repository';
import { InventoryLocationRepository } from '@/modules/inventory/locations/inventory-location.repository';
import { InventoryMovementService } from '@/modules/inventory/movements/inventory-movement.service';
import { AccountingAccountRepository } from './accounts/account.repository';
import { AccountingAccountResolver } from './accounts/account-resolver.service';
import { AccountingAccountService } from './accounts/account.service';
import { AccountingDomainError } from './accounting.error';
import { AccountingLifecycleService } from './accounting-lifecycle.service';
import {
  getAccountingPeriodDateRange,
  getPeriodKeyFromDate,
  getZonedDateParts,
  parseAccountingCalendarDate,
  type AccountingTenantContext,
} from './accounting.types';
import { AccountingOnboardingFinalizeSchema } from './onboarding.schema';
import { OpeningBalanceRepository } from './opening-balances/opening-balance.repository';
import { OpeningBalanceService } from './opening-balances/opening-balance.service';
import { AccountingPeriodRepository } from './periods/accounting-period.repository';

type FinalizeInput = ReturnType<
  typeof AccountingOnboardingFinalizeSchema.parse
>;

type PreparedInventoryLine = {
  inventoryItemId: string;
  inventoryAccountId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  locationId: string;
  storeId?: string;
  platform?: string;
  productId?: string;
  variantId?: string;
};

type PreparedBankAccount = {
  accountId: string;
  balance: number;
};

export class AccountingOnboardingService {
  private readonly context: AccountingTenantContext;
  private readonly lifecycle: AccountingLifecycleService;
  private readonly accountService: AccountingAccountService;
  private readonly accountRepository: AccountingAccountRepository;
  private readonly accountResolver: AccountingAccountResolver;
  private readonly periodRepository: AccountingPeriodRepository;
  private readonly openingBalanceRepository: OpeningBalanceRepository;
  private readonly openingBalanceService: OpeningBalanceService;
  private readonly locationRepository: InventoryLocationRepository;
  private readonly itemRepository: InventoryItemRepository;
  private readonly mappingRepository: InventoryItemMappingRepository;
  private readonly movementService: InventoryMovementService;

  constructor(context: AccountingTenantContext) {
    this.context = context;
    this.lifecycle = new AccountingLifecycleService(
      context
    );
    this.accountService = new AccountingAccountService(
      context
    );
    this.accountRepository =
      new AccountingAccountRepository(context);
    this.accountResolver = new AccountingAccountResolver(
      context
    );
    this.periodRepository = new AccountingPeriodRepository(
      context
    );
    this.openingBalanceRepository =
      new OpeningBalanceRepository(context);
    this.openingBalanceService = new OpeningBalanceService(
      context
    );
    this.locationRepository =
      new InventoryLocationRepository(context);
    this.itemRepository = new InventoryItemRepository(
      context
    );
    this.mappingRepository =
      new InventoryItemMappingRepository(context);
    this.movementService = new InventoryMovementService(
      context
    );
  }

  async getStatus() {
    const state =
      await this.lifecycle.assertOnboardingAvailable();
    const stores = await StoreModel.find({
      organization: this.context.organizationId,
      is_active: true,
      $or: [
        { deleted_at: null },
        { deleted_at: { $exists: false } },
      ],
    })
      .select('_id name code timezone')
      .sort({ created_at: 1, _id: 1 })
      .lean();

    return {
      state,
      stores,
      can_start: state.status === 'not_started',
      can_finalize: state.status === 'in_progress',
      onboarding_locked: state.status === 'active',
    };
  }

  async start() {
    return this.lifecycle.start();
  }

  async finalize(input: unknown) {
    const data =
      AccountingOnboardingFinalizeSchema.parse(input);
    await this.lifecycle.assertOwner();

    const current = await this.lifecycle.getState();
    if (current.status === 'active') {
      throw new AccountingDomainError(
        'Accounting onboarding sudah selesai dan tidak dapat diulang.',
        'ONBOARDING_ALREADY_COMPLETED'
      );
    }
    if (current.status === 'not_started') {
      await this.lifecycle.start();
    }

    const state = await this.lifecycle.getState();
    const timezone =
      data.calendar_timezone ??
      state.calendar_timezone ??
      'Asia/Jakarta';

    try {
      getZonedDateParts(new Date(), timezone);
    } catch {
      throw new AccountingDomainError(
        'Timezone accounting tidak valid.',
        'ACCOUNTING_TIMEZONE_INVALID'
      );
    }

    const cutoverDate = parseAccountingCalendarDate(
      data.cutover_date,
      timezone,
      'cutover_date'
    );
    const periodKey = getPeriodKeyFromDate(
      cutoverDate,
      timezone
    );
    const session = await mongoose.startSession();

    try {
      return await session.withTransaction(async () => {
        const transactionState =
          await this.lifecycle.getState(session);
        if (transactionState.status === 'active') {
          return {
            state: transactionState,
            reused: true,
          };
        }
        if (transactionState.status !== 'in_progress') {
          throw new AccountingDomainError(
            'Accounting onboarding belum berada pada status in_progress.',
            'ACCOUNTING_LIFECYCLE_CONFLICT'
          );
        }

        await this.accountService.seedDefaultAccounts(
          session
        );
        const preparedBankAccounts =
          await this.ensureBankAccounts(
            data.bank_accounts,
            session
          );
        await this.validateAccountMappings(
          data.account_mappings,
          session
        );
        const defaultLocation =
          await this.locationRepository.ensureDefaultLocation(
            session
          );
        const period = await this.ensureOpenPeriod(
          periodKey,
          timezone,
          session
        );
        const preparedInventory =
          await this.prepareInventoryLines(
            data,
            defaultLocation._id.toString(),
            session
          );
        const openingLines = await this.buildOpeningLines(
          data,
          preparedInventory,
          preparedBankAccounts,
          session
        );

        let openingBalance = null;
        if (openingLines.length > 0) {
          openingBalance =
            await this.initializeOpeningBalance(
              {
                periodKey,
                cutoverDate,
                description: data.description,
                lines: openingLines,
              },
              session
            );

          for (const line of preparedInventory) {
            const movement =
              await this.movementService.createDraft(
                {
                  inventory_item: line.inventoryItemId,
                  location: line.locationId,
                  store: line.storeId,
                  platform: line.platform,
                  movement_type: 'opening_balance',
                  quantity: line.quantity,
                  unit_cost: line.unitCost,
                  total_cost: line.totalCost,
                  occurred_at: cutoverDate.toISOString(),
                  source_type: 'opening_balance',
                  source_id: String(openingBalance._id),
                  idempotency_key:
                    'opening-inventory:' +
                    String(openingBalance._id) +
                    ':' +
                    line.inventoryItemId +
                    ':' +
                    line.locationId,
                  reference: 'Accounting onboarding',
                  status: 'draft',
                },
                session
              );
            await this.movementService.postOpeningBalance(
              String(movement._id),
              String(openingBalance.journal_entry),
              this.context.userId,
              session
            );
          }
        }

        const activeState = await this.lifecycle.activate({
          onboarding_version:
            transactionState.onboarding_version || 1,
          calendar_timezone: timezone,
          cutover_date: cutoverDate,
          account_mappings: data.account_mappings,
          session,
        });

        return {
          state: activeState,
          period,
          opening_balance: openingBalance,
          inventory: {
            selected: preparedInventory.length,
            total_value: preparedInventory.reduce(
              (sum, line) => sum + line.totalCost,
              0
            ),
          },
          bank_accounts: preparedBankAccounts.map(
            (account) => account.accountId
          ),
          reused: false,
        };
      });
    } finally {
      await session.endSession();
    }
  }

  private async ensureOpenPeriod(
    periodKey: string,
    timezone: string,
    session: ClientSession
  ) {
    const existing =
      await this.periodRepository.findByPeriodKey(
        periodKey,
        session
      );
    if (existing) {
      if (existing.status === 'closed') {
        throw new AccountingDomainError(
          'Accounting period cutover sudah ditutup.',
          'PERIOD_NOT_OPEN'
        );
      }
      return existing;
    }

    const range = getAccountingPeriodDateRange(
      periodKey,
      timezone
    );
    try {
      return await this.periodRepository.createPeriod(
        {
          period_key: periodKey,
          start_date: range.start_date,
          end_date: range.end_date,
          status: 'open',
        },
        session
      );
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        return this.periodRepository.findByPeriodKey(
          periodKey,
          session
        );
      }
      throw error;
    }
  }

  private async prepareInventoryLines(
    data: FinalizeInput,
    defaultLocationId: string,
    session: ClientSession
  ): Promise<PreparedInventoryLine[]> {
    if (data.inventory_mode === 'aggregate') {
      if (data.inventory_lines.length > 0) {
        throw new AccountingDomainError(
          'Mode inventory aggregate tidak menerima detail item.',
          'INVENTORY_MODE_CONFLICT'
        );
      }
      return [];
    }

    const prepared: PreparedInventoryLine[] = [];
    for (const line of data.inventory_lines) {
      const product = line.product
        ? await ProductModel.findOne({
            _id: line.product,
            organization: this.context.organizationId,
            is_active: true,
            $or: [
              { deleted_at: null },
              { deleted_at: { $exists: false } },
            ],
          })
            .session(session)
            .lean()
        : null;

      if (line.product && !product) {
        throw new AccountingDomainError(
          'Product inventory onboarding tidak ditemukan pada organization aktif.',
          'INVENTORY_PRODUCT_NOT_FOUND'
        );
      }

      const variant = product?.variants?.find(
        (candidate: { variant_id?: string }) =>
          !line.variant_id ||
          String(candidate.variant_id) === line.variant_id
      );
      const sku =
        line.sku?.trim() ||
        variant?.child_sku ||
        (variant as { sku?: string } | undefined)?.sku ||
        product?.parent_sku ||
        product?.product_id;
      const itemName =
        line.name?.trim() ||
        (variant as { name?: string } | undefined)?.name ||
        product?.name;

      if (!sku || !itemName) {
        throw new AccountingDomainError(
          'Inventory opening line membutuhkan SKU dan nama item.',
          'INVENTORY_ITEM_IDENTITY_REQUIRED'
        );
      }

      let item = line.inventory_item
        ? await this.itemRepository.findItemById(
            line.inventory_item,
            session
          )
        : (
            await this.itemRepository.findActiveBySkus(
              [sku],
              session
            )
          )[0];

      if (item && item.item_type !== 'merchandise') {
        throw new AccountingDomainError(
          'Product hanya dapat dipetakan ke inventory item merchandise.',
          'INVENTORY_ITEM_TYPE_INVALID'
        );
      }

      if (!item) {
        item = await this.itemRepository.createItem(
          {
            sku,
            name: itemName,
            item_type: 'merchandise',
            unit: line.unit,
            track_quantity: true,
            track_value: true,
            is_active: true,
          },
          session
        );
      }

      if (product) {
        const existingMapping =
          await this.mappingRepository.findActiveByProductVariant(
            String(product._id),
            line.variant_id,
            session
          );
        if (
          existingMapping &&
          String(existingMapping.inventory_item) !==
            String(item._id)
        ) {
          throw new AccountingDomainError(
            'Product/variant sudah memiliki mapping inventory yang berbeda.',
            'INVENTORY_MAPPING_CONFLICT'
          );
        }
        if (!existingMapping) {
          await this.mappingRepository.createMapping(
            {
              product: product._id,
              variant_id: line.variant_id,
              variant_key: line.variant_id ?? '__product__',
              inventory_item: item._id,
              mapping_method: 'product_match',
              is_active: true,
            },
            session
          );
        }
      }

      if (line.quantity === 0) continue;
      if (!line.unit_cost || line.unit_cost <= 0) {
        throw new AccountingDomainError(
          'Inventory dengan quantity positif wajib memiliki unit cost.',
          'OPENING_INVENTORY_COST_REQUIRED'
        );
      }

      const inventoryAccount =
        await this.resolveInventoryAccount(
          data.account_mappings?.merchandise_inventory,
          session
        );
      const locationId = line.location ?? defaultLocationId;
      if (!Types.ObjectId.isValid(locationId)) {
        throw new AccountingDomainError(
          'Inventory location tidak valid.',
          'INVENTORY_LOCATION_INVALID'
        );
      }

      prepared.push({
        inventoryItemId: String(item._id),
        inventoryAccountId: String(inventoryAccount._id),
        quantity: line.quantity,
        unitCost: line.unit_cost,
        totalCost: line.quantity * line.unit_cost,
        locationId,
        ...(line.store ? { storeId: line.store } : {}),
        ...(line.platform
          ? { platform: line.platform }
          : {}),
        ...(product
          ? { productId: String(product._id) }
          : {}),
        ...(line.variant_id
          ? { variantId: line.variant_id }
          : {}),
      });
    }
    return prepared;
  }

  private async buildOpeningLines(
    data: FinalizeInput,
    inventory: PreparedInventoryLine[],
    bankAccounts: PreparedBankAccount[],
    session: ClientSession
  ) {
    if (
      data.inventory_mode === 'detailed' &&
      data.inventory_lines.length > 0 &&
      data.aggregate_inventory_value !== undefined
    ) {
      throw new AccountingDomainError(
        'Nilai inventory aggregate tidak boleh digabung dengan detail inventory.',
        'INVENTORY_MODE_CONFLICT'
      );
    }

    const inventoryTotals = new Map<string, number>();
    for (const line of inventory) {
      inventoryTotals.set(
        line.inventoryAccountId,
        (inventoryTotals.get(line.inventoryAccountId) ??
          0) + line.totalCost
      );
    }

    if (
      data.aggregate_inventory_value &&
      data.aggregate_inventory_value > 0
    ) {
      const account = await this.resolveInventoryAccount(
        data.account_mappings?.merchandise_inventory,
        session
      );
      inventoryTotals.set(
        String(account._id),
        (inventoryTotals.get(String(account._id)) ?? 0) +
          data.aggregate_inventory_value
      );
    }

    for (const bankAccount of bankAccounts) {
      if (bankAccount.balance <= 0) continue;
      inventoryTotals.set(
        bankAccount.accountId,
        (inventoryTotals.get(bankAccount.accountId) ?? 0) +
          bankAccount.balance
      );
    }

    if (data.opening_balance_lines) {
      for (const [accountId, amount] of inventoryTotals) {
        const debit = data.opening_balance_lines
          .filter((line) => line.account === accountId)
          .reduce((sum, line) => sum + line.debit, 0);
        if (debit !== amount) {
          throw new AccountingDomainError(
            'Opening balance line inventory tidak sama dengan nilai inventory detail.',
            'OPENING_INVENTORY_LINE_MISMATCH'
          );
        }
      }
      return data.opening_balance_lines;
    }

    if (inventoryTotals.size === 0) return [];

    const equity = await this.resolveOpeningEquity(
      data.account_mappings?.opening_balance_equity,
      session
    );
    const lines = Array.from(inventoryTotals.entries()).map(
      ([account, debit]) => ({
        account,
        debit,
        credit: 0,
      })
    );
    const totalDebit = lines.reduce(
      (sum, line) => sum + line.debit,
      0
    );
    lines.push({
      account: String(equity._id),
      debit: 0,
      credit: totalDebit,
    });
    return lines;
  }

  private async ensureBankAccounts(
    bankAccounts: FinalizeInput['bank_accounts'],
    session: ClientSession
  ): Promise<PreparedBankAccount[]> {
    if (bankAccounts.length === 0) return [];

    const parent = await this.accountRepository.findByCode(
      '1100',
      session
    );
    if (
      !parent ||
      !parent.is_active ||
      parent.is_postable
    ) {
      throw new AccountingDomainError(
        'Parent akun kas dan setara kas belum tersedia.',
        'BANK_ACCOUNT_PARENT_INVALID'
      );
    }

    const usedCodes = new Set(
      (
        await this.accountRepository.findAllActive(session)
      ).map((account) => account.code)
    );
    const usedAccountIds = new Set<string>();
    let nextGeneratedCode = 1121;
    const prepared: PreparedBankAccount[] = [];

    for (const [index, input] of bankAccounts.entries()) {
      let code = input.code?.trim();
      if (!code) {
        while (usedCodes.has(String(nextGeneratedCode))) {
          nextGeneratedCode += 1;
        }
        code = String(nextGeneratedCode);
        nextGeneratedCode += 1;
      }

      const existing =
        await this.accountRepository.findByCode(
          code,
          session
        );
      let account = existing;

      if (account) {
        const isBankChild =
          account.is_active &&
          account.is_postable &&
          account.subtype === 'bank' &&
          String(account.parent_account) ===
            String(parent._id);
        if (!isBankChild) {
          throw new AccountingDomainError(
            `Kode akun bank ${code} sudah digunakan akun lain.`,
            'BANK_ACCOUNT_CODE_CONFLICT'
          );
        }
      } else {
        account =
          await this.accountRepository.createAccount(
            {
              code,
              name: input.name,
              type: 'asset',
              subtype: 'bank',
              parent_account: parent._id,
              normal_balance: 'debit',
              is_system: false,
              is_postable: true,
              is_active: true,
              display_order: 1121 + index,
              account_metadata: {
                ...(input.institution
                  ? { institution: input.institution }
                  : {}),
                ...(input.account_last4
                  ? { account_last4: input.account_last4 }
                  : {}),
                ...(input.account_holder
                  ? { account_holder: input.account_holder }
                  : {}),
              },
            },
            session
          );
      }

      const accountId = String(account._id);
      if (usedAccountIds.has(accountId)) {
        throw new AccountingDomainError(
          'Satu akun bank tidak boleh dimasukkan lebih dari sekali.',
          'BANK_ACCOUNT_DUPLICATE'
        );
      }
      usedAccountIds.add(accountId);
      usedCodes.add(code);

      prepared.push({
        accountId,
        balance: input.balance,
      });
    }

    return prepared;
  }

  private async initializeOpeningBalance(
    input: {
      periodKey: string;
      cutoverDate: Date;
      description: string;
      lines: Array<{
        account: string;
        debit: number;
        credit: number;
      }>;
    },
    session: ClientSession
  ) {
    const number = 'ONBOARDING-' + input.periodKey;
    const existing =
      await this.openingBalanceRepository.findByNumber(
        number,
        session
      );
    if (existing?.status === 'posted') return existing;
    if (existing) {
      return this.openingBalanceService.post(
        String(existing._id),
        this.context.userId,
        session
      );
    }
    return this.openingBalanceService.initialize(
      {
        opening_balance_number: number,
        effective_date: input.cutoverDate.toISOString(),
        period: input.periodKey,
        currency: 'IDR',
        description: input.description,
        status: 'draft',
        lines: input.lines,
      },
      this.context.userId,
      session
    );
  }

  private async resolveInventoryAccount(
    configuredId: string | undefined,
    session: ClientSession
  ) {
    return configuredId
      ? this.getPostableAccount(configuredId, session, [
          'asset',
        ])
      : this.accountResolver.resolve({
          role: 'merchandise_inventory',
          fallbackCode: '1310',
          session,
        });
  }

  private async resolveOpeningEquity(
    configuredId: string | undefined,
    session: ClientSession
  ) {
    return configuredId
      ? this.getPostableAccount(configuredId, session, [
          'equity',
        ])
      : this.accountResolver.resolve({
          role: 'opening_balance_equity',
          fallbackCode: '3110',
          session,
        });
  }

  private async getPostableAccount(
    accountId: string,
    session: ClientSession,
    allowedTypes?: string[]
  ) {
    const accounts = await this.accountRepository.findByIds(
      [accountId],
      session
    );
    const account = accounts[0];
    if (
      !account ||
      !account.is_active ||
      !account.is_postable
    ) {
      throw new AccountingDomainError(
        'Account onboarding tidak ditemukan atau tidak dapat digunakan.',
        'ACCOUNT_MAPPING_INVALID'
      );
    }
    if (
      allowedTypes &&
      !allowedTypes.includes(account.type)
    ) {
      throw new AccountingDomainError(
        `Account ${account.code} memiliki tipe yang tidak sesuai mapping onboarding.`,
        'ACCOUNT_MAPPING_TYPE_INVALID'
      );
    }
    return account;
  }

  private async validateAccountMappings(
    mappings: FinalizeInput['account_mappings'],
    session: ClientSession
  ) {
    if (!mappings) return;

    const configured: Array<{
      accountId: string;
      allowedTypes: string[];
    }> = [];
    const add = (
      accountId: string | undefined,
      allowedTypes: string[]
    ) => {
      if (accountId)
        configured.push({ accountId, allowedTypes });
    };

    add(mappings.sales_revenue, [
      'revenue',
      'other_income',
    ]);
    add(mappings.marketplace_balance, ['asset']);
    add(mappings.merchandise_inventory, ['asset']);
    add(mappings.merchandise_cogs, [
      'cost_of_sales',
      'expense',
      'other_expense',
    ]);
    add(mappings.opening_balance_equity, ['equity']);
    add(mappings.expense_payable, ['liability']);

    for (const accountId of Object.values(
      mappings.marketplace_receivables ?? {}
    )) {
      add(accountId, ['asset']);
    }
    for (const accountId of Object.values(
      mappings.marketplace_balances ?? {}
    )) {
      add(accountId, ['asset']);
    }
    for (const accountId of Object.values(
      mappings.marketplace_fee_accounts ?? {}
    )) {
      add(accountId, [
        'expense',
        'other_expense',
        'cost_of_sales',
      ]);
    }

    for (const mapping of configured) {
      await this.getPostableAccount(
        mapping.accountId,
        session,
        mapping.allowedTypes
      );
    }
  }
}
