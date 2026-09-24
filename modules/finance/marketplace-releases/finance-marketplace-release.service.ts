import { createHash } from 'node:crypto';
import { Types } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import { FinanceEntitlementService } from '../finance-entitlement.service';
import { FinanceLifecycleService } from '../finance-lifecycle.service';
import { FinanceAccountRoleResolverService } from '../accounts/finance-account-role-resolver.service';
import { FinanceJournalService } from '../journal/finance-journal.service';
import { FinanceSalesTransactionRepository } from '../sales/finance-sales-transaction.repository';
import { makeFinanceSalesIdempotencyKey } from '../sales/finance-sales.keys';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type { FinanceAccountRole } from '../accounts/finance-account-role-resolver.service';
import {
  FinanceMarketplaceReleaseResponseSchema,
  FinanceMarketplaceReleaseSourceSchema,
  type FinanceMarketplaceReleaseFeeLineDTO,
  type FinanceMarketplaceReleaseResponseDTO,
  type FinanceMarketplaceReleaseSourceDTO,
} from './finance-marketplace-release.schema';
import {
  FinanceMarketplaceReleaseRepository,
  type FinanceMarketplaceReleasePersistenceRecord,
  type FinanceMarketplaceReleaseSnapshot,
} from './finance-marketplace-release.repository';

type FeeRole = {
  field: keyof FinanceMarketplaceReleaseSourceDTO['fee'];
  category: string;
  role: FinanceAccountRole;
};

const FEE_ROLES: FeeRole[] = [
  {
    field: 'admin_fee',
    category: 'admin_fee',
    role: 'marketplace_admin_fee',
  },
  {
    field: 'processing_fee',
    category: 'processing_fee',
    role: 'payment_processing_fee',
  },
  {
    field: 'affiliate_fee',
    category: 'affiliate_fee',
    role: 'campaign_and_affiliate',
  },
  {
    field: 'gox_fee',
    category: 'shipping_promotion_fee',
    role: 'campaign_and_affiliate',
  },
  {
    field: 'service_fee',
    category: 'service_fee',
    role: 'marketplace_admin_fee',
  },
  {
    field: 'shipping_saver_program_fee',
    category: 'shipping_program_fee',
    role: 'campaign_and_affiliate',
  },
  {
    field: 'transaction_fee',
    category: 'transaction_fee',
    role: 'payment_processing_fee',
  },
  {
    field: 'campaign_fee',
    category: 'campaign_fee',
    role: 'campaign_and_affiliate',
  },
  {
    field: 'other_fee',
    category: 'other_marketplace_fee',
    role: 'marketplace_admin_fee',
  },
  {
    field: 'premium_fee',
    category: 'premium_fee',
    role: 'marketplace_admin_fee',
  },
  {
    field: 'fbs_fee',
    category: 'fbs_fee',
    role: 'marketplace_admin_fee',
  },
  {
    field: 'auto_top_up_fee_from_income',
    category: 'auto_top_up_fee',
    role: 'payment_processing_fee',
  },
  {
    field: 'return_shipping_fee',
    category: 'return_shipping_fee',
    role: 'shipping_and_transport',
  },
  {
    field: 'return_to_sender_shipping_fee',
    category: 'return_to_sender_fee',
    role: 'shipping_and_transport',
  },
];

type FinanceMarketplaceReleaseRepositoryPort = Pick<
  FinanceMarketplaceReleaseRepository,
  | 'findByIdempotencyKey'
  | 'savePending'
  | 'saveBlocked'
  | 'markPosted'
>;

type FinanceSalesTransactionRepositoryPort = Pick<
  FinanceSalesTransactionRepository,
  'findByIdempotencyKey'
>;

type FinanceRoleResolverPort = Pick<
  FinanceAccountRoleResolverService,
  'resolve'
>;

type FinanceJournalPort = Pick<
  FinanceJournalService,
  'postOperational'
>;

type FinanceReadinessPort = {
  isReady: () => Promise<boolean>;
};

type FeeLineWithRole =
  FinanceMarketplaceReleaseFeeLineDTO & {
    role: FinanceAccountRole;
  };

const safeReason = (error: unknown) =>
  error instanceof FinanceDomainError
    ? error.message
    : 'Released funds Finance gagal diposting dan perlu dicoba kembali.';

const makeIdempotencyKey = (
  organizationId: string,
  source: FinanceMarketplaceReleaseSourceDTO
) => {
  const fingerprint = createHash('sha256')
    .update(
      [
        organizationId,
        source.platform,
        source.source_order_id,
        source.settlement_reference ??
          source.released_at?.toISOString() ??
          'date-missing',
      ].join('|')
    )
    .digest('hex');

  return `finance-marketplace-release:${fingerprint}`;
};

const toResult = (
  value: FinanceMarketplaceReleaseResponseDTO
) => FinanceMarketplaceReleaseResponseSchema.parse(value);

const resultFromRecord = (
  record: FinanceMarketplaceReleasePersistenceRecord
): FinanceMarketplaceReleaseResponseDTO => ({
  id: String(record._id),
  status: record.status,
  source_order_id: record.source_order_id,
  journal_entry_id: record.journal_entry_id
    ? String(record.journal_entry_id)
    : null,
  reason: record.blocked_reason,
  expected_gross_amount: record.expected_gross_amount,
  fee_amount: record.fee_amount,
  refund_amount: record.refund_amount,
  released_amount: record.released_amount,
  reconciliation_difference:
    record.reconciliation_difference,
});

export class FinanceMarketplaceReleaseService {
  private readonly repository: FinanceMarketplaceReleaseRepositoryPort;
  private readonly salesTransactionRepository: FinanceSalesTransactionRepositoryPort;
  private readonly roleResolver: FinanceRoleResolverPort;
  private readonly journalService: FinanceJournalPort;
  private readonly readiness: FinanceReadinessPort;

  constructor(
    private readonly context: FinanceTenantContext,
    dependencies?: {
      repository?: FinanceMarketplaceReleaseRepositoryPort;
      salesTransactionRepository?: FinanceSalesTransactionRepositoryPort;
      roleResolver?: FinanceRoleResolverPort;
      journalService?: FinanceJournalPort;
      readiness?: FinanceReadinessPort;
    }
  ) {
    assertFinanceTenant(context);
    this.repository =
      dependencies?.repository ??
      new FinanceMarketplaceReleaseRepository(context);
    this.salesTransactionRepository =
      dependencies?.salesTransactionRepository ??
      new FinanceSalesTransactionRepository(context);
    this.roleResolver =
      dependencies?.roleResolver ??
      new FinanceAccountRoleResolverService(context);
    this.journalService =
      dependencies?.journalService ??
      new FinanceJournalService(context);
    this.readiness = dependencies?.readiness ?? {
      isReady: async () => {
        const entitlement =
          await new FinanceEntitlementService(
            context
          ).getAvailability();
        if (!entitlement.available) return false;
        const finance = await new FinanceLifecycleService(
          context
        ).getState();
        return finance.status === 'active';
      },
    };
  }

  async recordFromOrder(
    input: FinanceMarketplaceReleaseSourceDTO | unknown
  ): Promise<FinanceMarketplaceReleaseResponseDTO> {
    const source =
      FinanceMarketplaceReleaseSourceSchema.parse(input);
    if (
      source.organization_id !== this.context.organizationId
    ) {
      throw new FinanceDomainError(
        'Order source tidak berada pada organization Finance aktif.',
        'FINANCE_SALES_SOURCE_TENANT_CONFLICT'
      );
    }

    if (!(await this.readiness.isReady())) {
      return toResult({
        id: null,
        status: 'disabled',
        source_order_id: source.source_order_id,
        journal_entry_id: null,
        reason:
          'Finance belum aktif untuk organization ini.',
        expected_gross_amount: null,
        fee_amount: null,
        refund_amount: source.fee.refund_to_buyer,
        released_amount: source.released_amount ?? null,
        reconciliation_difference: null,
      });
    }

    const idempotencyKey = makeIdempotencyKey(
      this.context.organizationId,
      source
    );
    const existing =
      await this.repository.findByIdempotencyKey(
        idempotencyKey
      );
    if (existing?.status === 'posted') {
      return toResult(resultFromRecord(existing));
    }

    const salesTransaction =
      await this.salesTransactionRepository.findByIdempotencyKey(
        makeFinanceSalesIdempotencyKey({
          platform: source.platform,
          store_id: source.store_id ?? null,
          source_order_id: source.source_order_id,
        })
      );
    const feeLines = this.getFeeLines(source.fee);
    const feeAmount = feeLines.reduce(
      (sum, line) => sum + line.amount,
      0
    );
    const releasedAmount = source.released_amount ?? null;
    const expectedGrossAmount =
      salesTransaction?.sales_amount ?? null;
    const reconciliationDifference =
      releasedAmount !== null &&
      expectedGrossAmount !== null
        ? releasedAmount + feeAmount - expectedGrossAmount
        : null;
    const snapshot = this.buildSnapshot({
      source,
      idempotencyKey,
      feeLines,
      feeAmount,
      releasedAmount,
      expectedGrossAmount,
      reconciliationDifference,
    });

    const reason = this.getBlockedReason({
      source,
      salesTransaction,
      expectedGrossAmount,
      releasedAmount,
      reconciliationDifference,
    });

    if (reason) {
      const blocked = await this.repository.saveBlocked(
        snapshot,
        reason
      );
      if (!blocked) {
        throw new FinanceDomainError(
          'Released funds Finance gagal disimpan.',
          'FINANCE_MARKETPLACE_RELEASE_SAVE_FAILED'
        );
      }
      return toResult(resultFromRecord(blocked));
    }

    const pending =
      await this.repository.savePending(snapshot);
    if (!pending) {
      throw new FinanceDomainError(
        'Released funds Finance gagal disiapkan.',
        'FINANCE_MARKETPLACE_RELEASE_SAVE_FAILED'
      );
    }
    if (pending.status === 'posted') {
      return toResult(resultFromRecord(pending));
    }

    try {
      const journal = await this.postReleaseJournal({
        source,
        idempotencyKey,
        feeLines,
        feeAmount,
        releasedAmount: releasedAmount!,
        expectedGrossAmount: expectedGrossAmount!,
      });
      const posted = await this.repository.markPosted(
        idempotencyKey,
        journal.journal_entry.id
      );
      if (!posted || posted.status !== 'posted') {
        throw new FinanceDomainError(
          'Journal berhasil diposting tetapi status released funds gagal diperbarui.',
          'FINANCE_MARKETPLACE_RELEASE_FINALIZATION_FAILED'
        );
      }
      return toResult(resultFromRecord(posted));
    } catch (error: unknown) {
      const reason = safeReason(error);
      const blocked = await this.repository.saveBlocked(
        snapshot,
        reason
      );
      if (blocked?.status === 'posted') {
        return toResult(resultFromRecord(blocked));
      }
      if (blocked)
        return toResult(resultFromRecord(blocked));
      throw error;
    }
  }

  private getFeeLines(
    fee: FinanceMarketplaceReleaseSourceDTO['fee']
  ): FeeLineWithRole[] {
    return FEE_ROLES.flatMap((definition) => {
      const amount = fee[definition.field];
      return amount > 0
        ? [
            {
              category: definition.category,
              amount,
              role: definition.role,
            },
          ]
        : [];
    });
  }

  private getBlockedReason(input: {
    source: FinanceMarketplaceReleaseSourceDTO;
    salesTransaction: Awaited<
      ReturnType<
        FinanceSalesTransactionRepository['findByIdempotencyKey']
      >
    >;
    expectedGrossAmount: number | null;
    releasedAmount: number | null;
    reconciliationDifference: number | null;
  }) {
    const { source, salesTransaction } = input;

    if (!source.released_at) {
      return 'Tanggal released-funds tidak tersedia pada file sumber.';
    }
    if (input.releasedAmount === null) {
      return 'Nominal released-funds tidak tersedia pada file sumber.';
    }
    if (!source.store_id) {
      return 'Order belum memiliki store untuk dimensi journal Finance.';
    }
    if (source.has_returns) {
      return 'Order memiliki retur/refund; koreksi penjualan untuk retur belum diaktifkan.';
    }
    if (source.fee.refund_to_buyer > 0) {
      return 'File released-funds mencatat pengembalian dana ke pembeli; aturan jurnal refund belum diaktifkan.';
    }
    if (
      source.fee.tax_pph22 > 0 ||
      source.fee.import_duty_vat_income_tax > 0
    ) {
      return 'Komponen pajak pada fee marketplace ditunda sampai fitur pajak Finance tersedia.';
    }
    if (source.fee.shipping_fee_refund > 0) {
      return 'Refund biaya pengiriman belum memiliki rule posting Finance.';
    }
    if (salesTransaction?.status !== 'posted') {
      return 'Journal pengakuan penjualan Finance belum posted.';
    }
    if (input.expectedGrossAmount === null) {
      return 'Nominal piutang marketplace dari journal penjualan tidak tersedia.';
    }
    if (input.reconciliationDifference !== 0) {
      return `Released funds dan fee tidak cocok dengan piutang marketplace. Selisih: ${input.reconciliationDifference}.`;
    }

    return null;
  }

  private buildSnapshot(input: {
    source: FinanceMarketplaceReleaseSourceDTO;
    idempotencyKey: string;
    feeLines: FeeLineWithRole[];
    feeAmount: number;
    releasedAmount: number | null;
    expectedGrossAmount: number | null;
    reconciliationDifference: number | null;
  }): FinanceMarketplaceReleaseSnapshot {
    const { source } = input;
    const settlementReference =
      source.settlement_reference ||
      source.released_at?.toISOString() ||
      'date-missing';

    return {
      source_order_reference: new Types.ObjectId(
        source.source_order_reference
      ),
      source_order_id: source.source_order_id,
      source_order_number: source.source_order_number,
      store_id: source.store_id
        ? new Types.ObjectId(source.store_id)
        : null,
      platform: source.platform,
      settlement_reference: settlementReference,
      released_at: source.released_at ?? null,
      expected_gross_amount: input.expectedGrossAmount,
      fee_amount: input.feeAmount,
      refund_amount: source.fee.refund_to_buyer,
      released_amount: input.releasedAmount,
      reconciliation_difference:
        input.reconciliationDifference,
      fee_lines: input.feeLines.map(
        ({ category, amount }) => ({ category, amount })
      ),
      idempotency_key: input.idempotencyKey,
      source_file_id: source.source_file_id
        ? new Types.ObjectId(source.source_file_id)
        : null,
    };
  }

  private async postReleaseJournal(input: {
    source: FinanceMarketplaceReleaseSourceDTO;
    idempotencyKey: string;
    feeLines: FeeLineWithRole[];
    feeAmount: number;
    releasedAmount: number;
    expectedGrossAmount: number;
  }) {
    const accountIds = new Map<
      FinanceAccountRole,
      string
    >();
    const roles = new Set<FinanceAccountRole>([
      'marketplace_balance',
      'marketplace_receivable',
      ...input.feeLines.map((line) => line.role),
    ]);
    for (const role of roles) {
      const account = await this.roleResolver.resolve(role);
      accountIds.set(role, String(account._id));
    }

    const feeTotals = new Map<FinanceAccountRole, number>();
    for (const line of input.feeLines) {
      feeTotals.set(
        line.role,
        (feeTotals.get(line.role) ?? 0) + line.amount
      );
    }

    const dimensions = {
      platform: input.source.platform,
      store_id: input.source.store_id,
    };
    const lines = [
      ...(input.releasedAmount > 0
        ? [
            {
              account_id: accountIds.get(
                'marketplace_balance'
              )!,
              debit: input.releasedAmount,
              credit: 0,
              dimensions,
            },
          ]
        : []),
      ...[...feeTotals.entries()].map(([role, amount]) => ({
        account_id: accountIds.get(role)!,
        debit: amount,
        credit: 0,
        dimensions,
      })),
      {
        account_id: accountIds.get(
          'marketplace_receivable'
        )!,
        debit: 0,
        credit: input.expectedGrossAmount,
        dimensions,
      },
    ];

    return this.journalService.postOperational({
      transaction_date: input.source.released_at!,
      currency: 'IDR',
      description: `Dana dirilis ${input.source.platform} ${input.source.source_order_number}`,
      source_type: 'marketplace_release',
      source_id: input.source.source_order_id,
      source_event: 'funds_released',
      idempotency_key: input.idempotencyKey,
      lines,
    });
  }
}
