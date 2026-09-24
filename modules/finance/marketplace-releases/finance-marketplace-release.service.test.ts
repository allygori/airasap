import { Types } from 'mongoose';
import type { FinanceAccountPersistenceRecord } from '../accounts/finance-account.repository';
import type { FinanceAccountRole } from '../accounts/finance-account-role-resolver.service';
import type { FinanceJournalPostResultDTO } from '../journal/finance-journal.dto';
import { FinanceOperationalPostingSchema } from '../journal/finance-journal.schema';
import type { FinanceSalesTransactionPersistenceRecord } from '../sales/finance-sales-transaction.repository';
import type {
  FinanceMarketplaceReleasePersistenceRecord,
  FinanceMarketplaceReleaseSnapshot,
} from './finance-marketplace-release.repository';
import type { FinanceMarketplaceReleaseSourceInputDTO } from './finance-marketplace-release.schema';
import { FinanceMarketplaceReleaseService } from './finance-marketplace-release.service';

const organizationId = '507f1f77bcf86cd799439010';
const orderReference = '507f1f77bcf86cd799439011';
const storeId = '507f1f77bcf86cd799439012';
const journalEntryId = '507f1f77bcf86cd799439013';

const source: FinanceMarketplaceReleaseSourceInputDTO = {
  source_order_reference: orderReference,
  source_order_id: 'SP-1001',
  source_order_number: 'SP-1001',
  organization_id: organizationId,
  store_id: storeId,
  platform: 'shopee',
  settlement_reference: 'SETTLEMENT-1',
  released_at: '2026-09-22T00:00:00.000Z',
  released_amount: 120000,
  has_returns: false,
  fee: { admin_fee: 5000 },
};

const salesTransaction =
  (): FinanceSalesTransactionPersistenceRecord => ({
    _id: new Types.ObjectId(),
    organization: new Types.ObjectId(organizationId),
    source_order_id: 'SP-1001',
    source_order_number: 'SP-1001',
    store_id: storeId,
    platform: 'shopee',
    source_status: 'selesai',
    transaction_date: new Date('2026-09-22T00:00:00.000Z'),
    currency: 'IDR',
    sales_amount: 125000,
    posting_mode: 'automatic',
    status: 'posted',
    idempotency_key:
      'finance-sales:completed:shopee:507f1f77bcf86cd799439012:SP-1001',
    blocked_reason: null,
    journal_entry_id: new Types.ObjectId(journalEntryId),
    source_lines: [],
    intent_source_event: 'completed_order',
    intent_transaction_date: new Date(
      '2026-09-22T00:00:00.000Z'
    ),
    intent_description: 'Penjualan Shopee SP-1001',
    intent_lines: [],
    inventory_cogs_deferred_reason: null,
    inventory_cogs_status: 'deferred',
    inventory_cogs_total_cost: null,
    inventory_movement_ids: [],
  });

const account = (
  role: FinanceAccountRole
): FinanceAccountPersistenceRecord =>
  ({
    _id: new Types.ObjectId(),
    organization: new Types.ObjectId(organizationId),
    code: role,
    name: role,
    type:
      role === 'marketplace_admin_fee'
        ? 'expense'
        : 'asset',
    normal_balance:
      role === 'marketplace_receivable'
        ? 'credit'
        : 'debit',
    is_system: true,
    is_postable: true,
    is_active: true,
    display_order: 1,
  }) satisfies FinanceAccountPersistenceRecord;

const journalResult: FinanceJournalPostResultDTO = {
  journal_entry: {
    id: journalEntryId,
    entry_number: 'FIN-RELEASE-1',
    transaction_date: '2026-09-22T00:00:00.000Z',
    posting_date: '2026-09-22T00:00:00.000Z',
    period: '2026-09',
    currency: 'IDR',
    description: 'Dana dirilis shopee SP-1001',
    source_type: 'marketplace_release',
    source_id: 'SP-1001',
    source_event: 'funds_released',
    idempotency_key: 'finance-marketplace-release:test',
    status: 'posted',
    posted_at: '2026-09-22T00:00:00.000Z',
    posted_by: null,
    reversal_of: null,
    lines: [],
  },
  replayed: false,
};

const createHarness = (options?: {
  salesExists?: boolean;
  financeReady?: boolean;
}) => {
  let current: FinanceMarketplaceReleasePersistenceRecord | null =
    null;
  let postedJournalLines: Array<{
    account_id: string;
    debit: number;
    credit: number;
    dimensions?: { platform?: string; store_id?: string };
  }> = [];

  const fromSnapshot = (
    snapshot: FinanceMarketplaceReleaseSnapshot,
    status: FinanceMarketplaceReleasePersistenceRecord['status'],
    blockedReason: string | null = null,
    postedJournalId: string | null = null
  ): FinanceMarketplaceReleasePersistenceRecord => ({
    ...snapshot,
    _id: new Types.ObjectId(),
    organization: new Types.ObjectId(organizationId),
    status,
    blocked_reason: blockedReason,
    journal_entry_id: postedJournalId
      ? new Types.ObjectId(postedJournalId)
      : null,
  });

  const service = new FinanceMarketplaceReleaseService(
    { organizationId },
    {
      readiness: {
        isReady: async () =>
          options?.financeReady !== false,
      },
      repository: {
        findByIdempotencyKey: async () => current,
        saveBlocked: async (snapshot, reason) => {
          current = fromSnapshot(
            snapshot,
            'blocked',
            reason
          );
          return current;
        },
        savePending: async (snapshot) => {
          current = fromSnapshot(snapshot, 'pending');
          return current;
        },
        markPosted: async (_idempotencyKey, id) => {
          if (!current) return null;
          current = {
            ...current,
            status: 'posted',
            blocked_reason: null,
            journal_entry_id: new Types.ObjectId(id),
          };
          return current;
        },
      },
      salesTransactionRepository: {
        findByIdempotencyKey: async () =>
          options?.salesExists === false
            ? null
            : salesTransaction(),
      },
      roleResolver: {
        resolve: async (role) => account(role),
      },
      journalService: {
        postOperational: async (input) => {
          postedJournalLines =
            FinanceOperationalPostingSchema.parse(
              input
            ).lines;
          return journalResult;
        },
      },
    }
  );

  return {
    service,
    getCurrent: () => current,
    getPostedJournalLines: () => postedJournalLines,
  };
};

describe('FinanceMarketplaceReleaseService', () => {
  it('does not persist a release or journal while Finance is inactive', async () => {
    const harness = createHarness({ financeReady: false });

    const result =
      await harness.service.recordFromOrder(source);

    expect(result.status).toBe('disabled');
    expect(harness.getCurrent()).toBeNull();
    expect(harness.getPostedJournalLines()).toHaveLength(0);
  });

  it('posts released funds to marketplace balance and reconciles fees', async () => {
    const harness = createHarness();

    const result =
      await harness.service.recordFromOrder(source);

    expect(result).toMatchObject({
      status: 'posted',
      expected_gross_amount: 125000,
      fee_amount: 5000,
      refund_amount: 0,
      released_amount: 120000,
      reconciliation_difference: 0,
    });
    expect(harness.getPostedJournalLines()).toHaveLength(3);
    expect(
      harness
        .getPostedJournalLines()
        .reduce((sum, line) => sum + line.debit, 0)
    ).toBe(125000);
    expect(
      harness
        .getPostedJournalLines()
        .reduce((sum, line) => sum + line.credit, 0)
    ).toBe(125000);
    expect(harness.getCurrent()?.status).toBe('posted');
  });

  it('blocks a released-funds mismatch without creating a journal', async () => {
    const harness = createHarness();

    const result = await harness.service.recordFromOrder({
      ...source,
      released_amount: 119000,
    });

    expect(result.status).toBe('blocked');
    expect(result.reconciliation_difference).toBe(-1000);
    expect(result.reason).toContain('tidak cocok');
    expect(harness.getPostedJournalLines()).toHaveLength(0);
  });

  it('blocks tax fields until Finance tax posting is implemented', async () => {
    const harness = createHarness();

    const result = await harness.service.recordFromOrder({
      ...source,
      fee: { admin_fee: 5000, tax_pph22: 1 },
    });

    expect(result.status).toBe('blocked');
    expect(result.reason).toContain('pajak');
    expect(harness.getPostedJournalLines()).toHaveLength(0);
  });

  it('blocks refunds reported by the marketplace released-funds file', async () => {
    const harness = createHarness();

    const result = await harness.service.recordFromOrder({
      ...source,
      fee: { admin_fee: 5000, refund_to_buyer: 25000 },
    });

    expect(result).toMatchObject({
      status: 'blocked',
      refund_amount: 25000,
    });
    expect(result.reason).toContain(
      'pengembalian dana ke pembeli'
    );
    expect(harness.getPostedJournalLines()).toHaveLength(0);
  });

  it('blocks release posting when the sale journal is not posted', async () => {
    const harness = createHarness({ salesExists: false });

    const result =
      await harness.service.recordFromOrder(source);

    expect(result.status).toBe('blocked');
    expect(result.reason).toContain('belum posted');
    expect(harness.getPostedJournalLines()).toHaveLength(0);
  });
});
