import type { ClientSession } from 'mongoose';
import { AccountingDomainError } from '../accounting.error';
import { AccountingAccountRepository } from '../accounts/account.repository';
import { createAccountingDimensions } from '../accounting-dimensions';
import { JournalEntryService } from '../journal-entries/journal-entry.service';
import {
  getPeriodKeyFromDate,
  parseAccountingDate,
  toAccountingObjectId,
  type AccountingTenantContext,
} from '../accounting.types';
import { createAuditLog } from '../audit/audit-log.model';
import { SettlementRepository } from './settlement.repository';
import { OrderRepository } from '@/modules/orders/order.repository';
import { StoreRepository } from '@/modules/stores/store.repository';

const DEFAULT_DESTINATION_ACCOUNT = '1130';
const MARKETPLACE_RECEIVABLE_ACCOUNT = '1210';

type SettlementContext = AccountingTenantContext & {
  storeId?: string;
};

export type RecordSettlementInput = {
  destination_account_id?: string;
  source_file?: string;
  retry?: boolean;
  session?: ClientSession;
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
    this.journalService = new JournalEntryService(context);
  }

  async recordFromOrder(
    orderId: string,
    input: RecordSettlementInput = {}
  ) {
    const order =
      await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AccountingDomainError(
        'Order tidak ditemukan pada organization aktif.',
        'SETTLEMENT_ORDER_NOT_FOUND'
      );
    }

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
        input.session
      );
    const receivableAccount =
      await this.accountRepository.findByCode(
        MARKETPLACE_RECEIVABLE_ACCOUNT,
        input.session
      );
    if (!receivableAccount) {
      throw new AccountingDomainError(
        'Akun Piutang Marketplace belum tersedia.',
        'SETTLEMENT_RECEIVABLE_ACCOUNT_NOT_CONFIGURED'
      );
    }

    const feeLines = await this.buildFeeLines(
      order.fee,
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
        period: getPeriodKeyFromDate(occurredAt),
        description: `Settlement ${order.platform} ${order.order_id}`,
        source_type: 'marketplace_settlement',
        source_id: String(settlement._id),
        source_event: 'settlement_posted',
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

  private async resolveDestinationAccount(
    accountId: string | undefined,
    session?: ClientSession
  ) {
    const account = accountId
      ? (
          await this.accountRepository.findByIds(
            [accountId],
            session
          )
        )[0]
      : await this.accountRepository.findByCode(
          DEFAULT_DESTINATION_ACCOUNT,
          session
        );
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

  private async buildFeeLines(
    fee: Record<string, unknown> | undefined,
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

      let accountId = accountCache.get(
        definition.accountCode
      );
      if (!accountId) {
        const account =
          await this.accountRepository.findByCode(
            definition.accountCode,
            session
          );
        if (
          !account ||
          !account.is_active ||
          !account.is_postable
        ) {
          throw new AccountingDomainError(
            `Akun fee marketplace ${definition.accountCode} belum tersedia atau tidak dapat diposting.`,
            'SETTLEMENT_FEE_ACCOUNT_INVALID'
          );
        }
        accountId = String(account._id);
        accountCache.set(definition.accountCode, accountId);
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
