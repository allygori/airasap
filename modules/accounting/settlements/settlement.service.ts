import type { ClientSession } from 'mongoose';
import { AccountingDomainError } from '../accounting.error';
import { AccountingAccountRepository } from '../accounts/account.repository';
import { createAccountingDimensions } from '../accounting-dimensions';
import { JournalEntryService } from '../journal-entries/journal-entry.service';
import {
  getPeriodKeyFromDate,
  parseAccountingCalendarDate,
  parseAccountingDate,
  toAccountingObjectId,
  type AccountingTenantContext,
} from '../accounting.types';
import { createAuditLog } from '../audit/audit-log.model';
import { assertAccountingModuleActive } from '../accounting-module.guard';
import { AccountingAccountResolver } from '../accounts/account-resolver.service';
import {
  SettlementRepository,
  type SettlementReconciliationFilter,
} from './settlement.repository';
import { OrderRepository } from '@/modules/orders/order.repository';
import { StoreRepository } from '@/modules/stores/store.repository';

const DEFAULT_DESTINATION_ACCOUNT = '1130';
const MARKETPLACE_RECEIVABLE_ACCOUNT = '1210';

type SettlementContext = AccountingTenantContext & {
  storeId?: string;
};

export type RecordSettlementInput = {
  destination_account_id?: string;
  settlement_stage?: 'funds_released' | 'payout_received';
  source_file?: string;
  retry?: boolean;
  session?: ClientSession;
};

export type RecordPayoutInput = {
  destination_account_id: string;
  payout_at: string;
  payout_reference: string;
  amount?: number;
  source_file?: string;
  session?: ClientSession;
};

export type SettlementReconciliationQuery =
  SettlementReconciliationFilter & {
    page?: number;
    limit?: number;
  };

type FeeDefinition = {
  field: string;
  category: string;
  accountCode: string;
};

const FEE_DEFINITIONS: FeeDefinition[] = [
  {
    field: 'admin_fee',
    category: 'admin_fee',
    accountCode: '6310',
  },
  {
    field: 'processing_fee',
    category: 'processing_fee',
    accountCode: '6320',
  },
  {
    field: 'transaction_fee',
    category: 'transaction_fee',
    accountCode: '6320',
  },
  {
    field: 'affiliate_fee',
    category: 'affiliate_fee',
    accountCode: '6330',
  },
  {
    field: 'gox_fee',
    category: 'shipping_promotion_fee',
    accountCode: '6330',
  },
  {
    field: 'service_fee',
    category: 'service_fee',
    accountCode: '6310',
  },
  {
    field: 'shipping_saver_program_fee',
    category: 'shipping_program_fee',
    accountCode: '6330',
  },
  {
    field: 'campaign_fee',
    category: 'campaign_fee',
    accountCode: '6330',
  },
  {
    field: 'other_fee',
    category: 'other_marketplace_fee',
    accountCode: '6310',
  },
  {
    field: 'premium_fee',
    category: 'premium_fee',
    accountCode: '6310',
  },
  {
    field: 'fbs_fee',
    category: 'fbs_fee',
    accountCode: '6310',
  },
  {
    field: 'tax_pph22',
    category: 'tax_pph22',
    accountCode: '6310',
  },
  {
    field: 'import_duty_vat_income_tax',
    category: 'import_duty_vat_income_tax',
    accountCode: '6310',
  },
  {
    field: 'auto_top_up_fee_from_income',
    category: 'auto_top_up_fee',
    accountCode: '6320',
  },
  {
    field: 'return_shipping_fee',
    category: 'return_shipping_fee',
    accountCode: '6200',
  },
  {
    field: 'return_to_sender_shipping_fee',
    category: 'return_to_sender_fee',
    accountCode: '6200',
  },
];

export class MarketplaceSettlementService {
  private readonly context: SettlementContext;
  private readonly repository: SettlementRepository;
  private readonly orderRepository: OrderRepository;
  private readonly accountRepository: AccountingAccountRepository;
  private readonly accountResolver: AccountingAccountResolver;
  private readonly journalService: JournalEntryService;
  private readonly storeRepository: StoreRepository;

  constructor(context: SettlementContext) {
    this.context = context;
    this.repository = new SettlementRepository({
      organizationId: context.organizationId,
    });
    // Settlement dimensions must come from the source order, even when the
    // settlement action is initiated from another active UI store.
    this.orderRepository = new OrderRepository({
      organizationId: context.organizationId,
    });
    this.storeRepository = new StoreRepository({
      organizationId: context.organizationId,
    });
    this.accountRepository =
      new AccountingAccountRepository(context);
    this.accountResolver = new AccountingAccountResolver(
      context
    );
    this.journalService = new JournalEntryService(context);
  }

  async recordFromOrder(
    orderId: string,
    input: RecordSettlementInput = {}
  ) {
    const settlementStage =
      input.settlement_stage ?? 'funds_released';
    if (settlementStage !== 'funds_released') {
      throw new AccountingDomainError(
        'Payout ke rekening bank membutuhkan event penerimaan bank yang terpisah.',
        'SETTLEMENT_PAYOUT_EVENT_REQUIRED'
      );
    }
    const order =
      await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AccountingDomainError(
        'Order tidak ditemukan pada organization aktif.',
        'SETTLEMENT_ORDER_NOT_FOUND'
      );
    }

    const accountingState =
      await assertAccountingModuleActive(
        this.context,
        input.session
      );

    if (!order.store) {
      throw new AccountingDomainError(
        'Order belum memiliki store/workspace. Tetapkan store pada order sebelum mencatat settlement.',
        'SETTLEMENT_STORE_REQUIRED'
      );
    }

    const sourceStore = await this.storeRepository.findById(
      String(order.store)
    );
    if (!sourceStore) {
      throw new AccountingDomainError(
        'Store/workspace pada order settlement tidak ditemukan dalam organization aktif.',
        'SETTLEMENT_STORE_NOT_FOUND'
      );
    }
    const storeId = String(sourceStore._id);

    if (!order.released_funds_at) {
      throw new AccountingDomainError(
        'Settlement membutuhkan tanggal dana dilepaskan.',
        'SETTLEMENT_DATE_REQUIRED'
      );
    }
    const settledAt = parseAccountingDate(
      order.released_funds_at,
      'released_funds_at'
    );
    if (
      accountingState.cutover_date &&
      settledAt < accountingState.cutover_date
    ) {
      throw new AccountingDomainError(
        'Settlement sebelum cutover harus diproses melalui reconstruction.',
        'SETTLEMENT_BEFORE_CUTOVER'
      );
    }
    const netAmount = Number(order.released_funds ?? 0);
    if (!Number.isInteger(netAmount) || netAmount < 0) {
      throw new AccountingDomainError(
        'Released funds harus berupa nominal IDR tidak negatif.',
        'SETTLEMENT_NET_AMOUNT_INVALID'
      );
    }

    const settlementReference =
      order.settlement_reference ||
      `${order.order_id}:${settledAt.toISOString()}`;
    const idempotencyKey = `marketplace-settlement:${String(
      order._id
    )}:${settlementReference}`;
    const existing =
      await this.repository.findByIdempotencyKey(
        idempotencyKey,
        input.session
      );

    if (existing?.status === 'posted') return existing;
    if (existing?.status === 'blocked' && !input.retry) {
      return existing;
    }
    if (existing?.status === 'blocked' && input.retry) {
      await this.repository.resetForRetry(
        String(existing._id),
        input.session
      );
    }

    const destinationAccount =
      await this.resolveDestinationAccount(
        input.destination_account_id,
        order.platform,
        input.session
      );
    const receivableAccount =
      await this.accountResolver.resolve({
        role: 'marketplace_receivable',
        platform: order.platform,
        fallbackCode: MARKETPLACE_RECEIVABLE_ACCOUNT,
        session: input.session,
      });

    const feeLines = await this.buildFeeLines(
      order.fee,
      order.platform,
      input.session
    );
    const feeAmount = feeLines.reduce(
      (sum, line) => sum + line.amount,
      0
    );
    const grossAmount = netAmount + feeAmount;
    const expectedGrossAmount =
      this.getExpectedGrossAmount(order);
    const reconciliationDifference =
      grossAmount - expectedGrossAmount;
    const reconciliationStatus =
      reconciliationDifference === 0
        ? 'matched'
        : 'exception';

    let settlement =
      existing ??
      (await this.repository.createSettlement(
        {
          order: order._id,
          store: sourceStore._id,
          order_id: order.order_id,
          platform: order.platform,
          settlement_reference: settlementReference,
          settled_at: settledAt,
          settlement_stage: settlementStage,
          destination_account: destinationAccount._id,
          gross_amount: grossAmount,
          fee_amount: feeAmount,
          net_amount: netAmount,
          fee_lines: feeLines,
          reconciliation_status: reconciliationStatus,
          reconciliation_difference:
            reconciliationDifference,
          source_file: input.source_file,
          idempotency_key: idempotencyKey,
          status: 'draft',
        },
        input.session
      ));

    if (existing && input.retry) {
      settlement =
        (await this.repository.updateForRetry(
          String(existing._id),
          {
            destination_account: destinationAccount._id,
            store: sourceStore._id,
            settled_at: settledAt,
            gross_amount: grossAmount,
            fee_amount: feeAmount,
            net_amount: netAmount,
            fee_lines: feeLines,
            reconciliation_status: reconciliationStatus,
            reconciliation_difference:
              reconciliationDifference,
            ...(input.source_file
              ? { source_file: input.source_file }
              : {}),
          },
          input.session
        )) ?? settlement;
    }

    if (order.accounting_status !== 'posted') {
      const blocked = await this.repository.markBlocked(
        String(settlement._id),
        'Settlement menunggu order recognition berstatus posted.',
        0,
        input.session
      );
      return {
        settlement: blocked,
        status: 'blocked' as const,
        reconciliation_difference: 0,
      };
    }

    if (reconciliationDifference !== 0) {
      const blocked = await this.repository.markBlocked(
        String(settlement._id),
        `Settlement tidak balance dengan Piutang Marketplace. Selisih: ${reconciliationDifference}.`,
        reconciliationDifference,
        input.session
      );
      return {
        settlement: blocked,
        status: 'blocked' as const,
        reconciliation_difference: reconciliationDifference,
      };
    }

    const occurredAt = settledAt;
    const dimensions = createAccountingDimensions({
      store: storeId,
      platform: order.platform,
    });
    const lines = [
      ...(netAmount > 0
        ? [
            {
              account: String(destinationAccount._id),
              debit: netAmount,
              credit: 0,
              dimensions,
            },
          ]
        : []),
      ...feeLines.map((line) => ({
        account: String(line.account),
        debit: line.amount,
        credit: 0,
        dimensions,
      })),
      {
        account: String(receivableAccount._id),
        debit: 0,
        credit: grossAmount,
        dimensions,
      },
    ];

    const journalEntry = await this.journalService.postNew(
      {
        entry_number: `SET-${order.order_id}-${String(
          settlement._id
        )}`,
        transaction_date: occurredAt.toISOString(),
        posting_date: occurredAt.toISOString(),
        period: getPeriodKeyFromDate(
          occurredAt,
          accountingState.calendar_timezone
        ),
        description: `Settlement ${order.platform} ${order.order_id}`,
        source_type: 'marketplace_settlement',
        source_id: String(settlement._id),
        source_event: 'funds_released_posted',
        idempotency_key: `marketplace-settlement-journal:${String(
          settlement._id
        )}`,
        status: 'draft',
        lines,
      },
      this.context.userId,
      input.session
    );
    const posted = await this.repository.markPosted(
      String(settlement._id),
      String(journalEntry._id),
      input.session
    );

    await createAuditLog(
      this.context,
      {
        action: 'marketplace_settlement.posted',
        entity_type: 'settlement',
        entity_id: settlement._id,
        ...(this.context.userId
          ? {
              actor_id: toAccountingObjectId(
                this.context.userId,
                'userId'
              ),
            }
          : {}),
        metadata: {
          order_id: order.order_id,
          journal_entry_id: String(journalEntry._id),
          gross_amount: grossAmount,
          fee_amount: feeAmount,
          net_amount: netAmount,
        },
      },
      input.session
    );

    return {
      settlement: posted,
      status: 'posted' as const,
      journal_entry_id: String(journalEntry._id),
    };
  }

  async retry(
    settlementId: string,
    input: Omit<RecordSettlementInput, 'retry'> = {}
  ) {
    const settlement =
      await this.repository.findSettlementById(
        settlementId
      );
    if (!settlement) {
      throw new AccountingDomainError(
        'Settlement tidak ditemukan pada organization aktif.',
        'SETTLEMENT_NOT_FOUND'
      );
    }
    return this.recordFromOrder(String(settlement.order), {
      ...input,
      retry: true,
    });
  }

  async recordPayout(
    settlementId: string,
    input: RecordPayoutInput
  ) {
    const accountingState =
      await assertAccountingModuleActive(
        this.context,
        input.session
      );
    const sourceSettlement =
      await this.repository.findSettlementById(
        settlementId,
        input.session
      );
    if (!sourceSettlement) {
      throw new AccountingDomainError(
        'Settlement dana dilepas tidak ditemukan.',
        'SETTLEMENT_NOT_FOUND'
      );
    }
    if (
      sourceSettlement.settlement_stage !== 'funds_released'
    ) {
      throw new AccountingDomainError(
        'Payout hanya dapat dibuat dari settlement funds_released.',
        'PAYOUT_SOURCE_STAGE_INVALID'
      );
    }
    if (sourceSettlement.status !== 'posted') {
      throw new AccountingDomainError(
        'Funds released harus posted sebelum payout dicatat.',
        'PAYOUT_SOURCE_NOT_POSTED'
      );
    }
    if (!input.payout_reference.trim()) {
      throw new AccountingDomainError(
        'Payout reference wajib diisi.',
        'PAYOUT_REFERENCE_REQUIRED'
      );
    }

    const payoutAt = parseAccountingCalendarDate(
      input.payout_at,
      accountingState.calendar_timezone ?? 'UTC',
      'payout_at'
    );
    if (
      accountingState.cutover_date &&
      payoutAt < accountingState.cutover_date
    ) {
      throw new AccountingDomainError(
        'Payout sebelum cutover harus diproses melalui reconstruction.',
        'PAYOUT_BEFORE_CUTOVER'
      );
    }

    const amount =
      input.amount ?? Number(sourceSettlement.net_amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new AccountingDomainError(
        'Nominal payout harus berupa bilangan bulat lebih besar dari nol.',
        'PAYOUT_AMOUNT_INVALID'
      );
    }

    const idempotencyKey = `marketplace-payout:${String(
      sourceSettlement._id
    )}:${input.payout_reference.trim()}`;
    const existing =
      await this.repository.findByIdempotencyKey(
        idempotencyKey,
        input.session
      );
    if (existing?.status === 'posted') return existing;
    if (existing && existing.status !== 'draft') {
      throw new AccountingDomainError(
        'Payout memiliki settlement yang tidak dapat diulang.',
        'PAYOUT_RETRY_NOT_ALLOWED'
      );
    }
    if (
      existing &&
      (existing.net_amount !== amount ||
        String(existing.destination_account) !==
          input.destination_account_id)
    ) {
      throw new AccountingDomainError(
        'Payout reference sudah digunakan dengan nominal atau rekening berbeda.',
        'PAYOUT_IDEMPOTENCY_CONFLICT'
      );
    }

    const paidAmount =
      await this.repository.getPostedPayoutTotal(
        String(sourceSettlement._id),
        input.session
      );
    if (
      !existing &&
      paidAmount + amount > sourceSettlement.net_amount
    ) {
      throw new AccountingDomainError(
        'Total payout melebihi net amount funds released.',
        'PAYOUT_AMOUNT_EXCEEDS_RELEASED_FUNDS'
      );
    }

    const bankAccount = await this.resolveBankDestination(
      input.destination_account_id,
      input.session
    );
    const marketplaceBalance =
      await this.accountResolver.resolve({
        role: 'marketplace_balance',
        platform: sourceSettlement.platform,
        fallbackCode: DEFAULT_DESTINATION_ACCOUNT,
        session: input.session,
      });

    const payout =
      existing ??
      (await this.repository.createSettlement(
        {
          order: sourceSettlement.order,
          source_settlement: sourceSettlement._id,
          store: sourceSettlement.store,
          order_id: sourceSettlement.order_id,
          platform: sourceSettlement.platform,
          settlement_reference:
            input.payout_reference.trim(),
          settled_at: payoutAt,
          settlement_stage: 'payout_received',
          destination_account: bankAccount._id,
          gross_amount: amount,
          fee_amount: 0,
          net_amount: amount,
          fee_lines: [],
          reconciliation_status: 'matched',
          reconciliation_difference: 0,
          source_file: input.source_file,
          idempotency_key: idempotencyKey,
          status: 'draft',
        },
        input.session
      ));

    const dimensions = createAccountingDimensions({
      store: String(sourceSettlement.store),
      platform: sourceSettlement.platform,
    });
    const journalEntry = await this.journalService.postNew(
      {
        entry_number: `SET-PAYOUT-${sourceSettlement.order_id}-${String(
          payout._id
        )}`,
        transaction_date: payoutAt.toISOString(),
        posting_date: payoutAt.toISOString(),
        period: getPeriodKeyFromDate(
          payoutAt,
          accountingState.calendar_timezone
        ),
        description: `Payout ${sourceSettlement.platform} ${sourceSettlement.order_id}`,
        source_type: 'marketplace_settlement',
        source_id: String(payout._id),
        source_event: 'payout_received_posted',
        idempotency_key: `marketplace-payout-journal:${String(
          payout._id
        )}`,
        status: 'draft',
        lines: [
          {
            account: String(bankAccount._id),
            debit: amount,
            credit: 0,
            dimensions,
          },
          {
            account: String(marketplaceBalance._id),
            debit: 0,
            credit: amount,
            dimensions,
          },
        ],
      },
      this.context.userId,
      input.session
    );
    const posted = await this.repository.markPosted(
      String(payout._id),
      String(journalEntry._id),
      input.session
    );
    if (!posted) {
      const latest =
        await this.repository.findSettlementById(
          String(payout._id),
          input.session
        );
      if (latest?.status === 'posted') return latest;
      throw new AccountingDomainError(
        'Journal payout berhasil diposting tetapi settlement gagal diperbarui.',
        'PAYOUT_FINALIZATION_FAILED'
      );
    }

    await createAuditLog(
      this.context,
      {
        action: 'marketplace_payout.posted',
        entity_type: 'settlement',
        entity_id: payout._id,
        ...(this.context.userId
          ? {
              actor_id: toAccountingObjectId(
                this.context.userId,
                'userId'
              ),
            }
          : {}),
        metadata: {
          source_settlement_id: String(
            sourceSettlement._id
          ),
          journal_entry_id: String(journalEntry._id),
          amount,
          destination_account_id: String(bankAccount._id),
        },
      },
      input.session
    );

    return {
      settlement: posted,
      status: 'posted' as const,
      journal_entry_id: String(journalEntry._id),
    };
  }

  async getReconciliation(
    input: SettlementReconciliationQuery = {}
  ) {
    await assertAccountingModuleActive(this.context);
    const page = input.page ?? 1;
    const limit = input.limit ?? 25;
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new AccountingDomainError(
        'Pagination reconciliation settlement tidak valid.',
        'SETTLEMENT_RECONCILIATION_PAGINATION_INVALID'
      );
    }

    return this.repository.findReconciliationPage(
      {
        ...(input.status ? { status: input.status } : {}),
        ...(input.settlement_stage
          ? { settlement_stage: input.settlement_stage }
          : {}),
        ...(input.platform
          ? { platform: input.platform }
          : {}),
        ...(input.source_file
          ? { source_file: input.source_file }
          : {}),
      },
      page,
      limit
    );
  }

  private async resolveDestinationAccount(
    accountId: string | undefined,
    platform: string,
    session?: ClientSession
  ) {
    const marketplaceBalance =
      await this.accountResolver.resolve({
        role: 'marketplace_balance',
        platform,
        fallbackCode: DEFAULT_DESTINATION_ACCOUNT,
        session,
      });
    const account = accountId
      ? (
          await this.accountRepository.findByIds(
            [accountId],
            session
          )
        )[0]
      : marketplaceBalance;
    if (
      accountId &&
      (!account ||
        String(account._id) !==
          String(marketplaceBalance._id))
    ) {
      throw new AccountingDomainError(
        'Released funds harus masuk ke account saldo marketplace, bukan rekening bank.',
        'SETTLEMENT_DESTINATION_MUST_BE_MARKETPLACE_BALANCE'
      );
    }
    if (
      !account ||
      !account.is_active ||
      !account.is_postable
    ) {
      throw new AccountingDomainError(
        'Akun tujuan settlement tidak ditemukan atau tidak dapat diposting.',
        'SETTLEMENT_DESTINATION_ACCOUNT_INVALID'
      );
    }
    if (account.type !== 'asset') {
      throw new AccountingDomainError(
        'Akun tujuan settlement harus bertipe asset.',
        'SETTLEMENT_DESTINATION_ACCOUNT_INVALID'
      );
    }
    return account;
  }

  private async resolveBankDestination(
    accountId: string,
    session?: ClientSession
  ) {
    const account = (
      await this.accountRepository.findByIds(
        [accountId],
        session
      )
    )[0];
    const cashGroup =
      await this.accountRepository.findByCode(
        '1100',
        session
      );
    if (
      !account ||
      !account.is_active ||
      !account.is_postable ||
      account.type !== 'asset' ||
      account.subtype !== 'bank' ||
      !cashGroup ||
      String(account.parent_account) !==
        String(cashGroup._id)
    ) {
      throw new AccountingDomainError(
        'Payout harus diarahkan ke child account bank yang aktif.',
        'PAYOUT_BANK_ACCOUNT_INVALID'
      );
    }
    return account;
  }

  private async buildFeeLines(
    fee: Record<string, unknown> | undefined,
    platform: string,
    session?: ClientSession
  ) {
    const accountCache = new Map<string, string>();
    const lines: Array<{
      category: string;
      account: string;
      amount: number;
    }> = [];
    for (const definition of FEE_DEFINITIONS) {
      const amount = Number(fee?.[definition.field] ?? 0);
      if (!Number.isInteger(amount) || amount < 0) {
        throw new AccountingDomainError(
          `Fee ${definition.category} harus berupa nominal IDR tidak negatif.`,
          'SETTLEMENT_FEE_INVALID'
        );
      }
      if (amount === 0) continue;

      const cacheKey = `${platform}:${definition.category}`;
      let accountId = accountCache.get(cacheKey);
      if (!accountId) {
        const account = await this.accountResolver.resolve({
          role: 'marketplace_fee',
          platform,
          feeCategory: definition.category,
          fallbackCode: definition.accountCode,
          session,
        });
        accountId = String(account._id);
        accountCache.set(cacheKey, accountId);
      }
      lines.push({
        category: definition.category,
        account: accountId,
        amount,
      });
    }
    return lines;
  }

  private getExpectedGrossAmount(order: {
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
        'Nilai Piutang Marketplace order tidak valid.',
        'SETTLEMENT_EXPECTED_GROSS_INVALID'
      );
    }
    return amount;
  }
}
