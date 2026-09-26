import { Types } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import type { FinanceLifecycleService } from '../finance-lifecycle.service';
import type { FinanceJournalService } from '../journal/finance-journal.service';
import type { FinanceAccountRoleResolverService } from '../accounts/finance-account-role-resolver.service';
import {
  FinanceSalesTransactionRepository,
  type CreateFinanceSalesTransactionRecord,
  type FinanceSalesTransactionPersistenceRecord,
} from './finance-sales-transaction.repository';
import { FinanceSalesProjectionService } from './finance-sales.service';
import { FinanceSalesWorkflowService } from './finance-sales-workflow.service';

const organizationId = '507f1f77bcf86cd799439010';
const sourceOrderId = '507f1f77bcf86cd799439099';

const sourceOrder = {
  source_order_id: sourceOrderId,
  source_order_number: 'SP-1001',
  organization_id: organizationId,
  store_id: '507f1f77bcf86cd799439011',
  platform: 'shopee' as const,
  status: 'selesai',
  completed_at: '2026-09-22T00:00:00.000Z',
  total_gross_sales: 125000,
  items: [
    {
      product_id: 'SKU-001',
      quantity: 1,
      subtotal: 125000,
    },
  ],
};

const getProjection = (overrides = {}) =>
  new FinanceSalesProjectionService({
    organizationId,
  }).projectOrder({
    ...sourceOrder,
    ...overrides,
  });

const lifecycle = (status: 'active' | 'not_started') =>
  ({
    getState: async () => ({
      status,
      onboarding_version: 1,
      calendar_timezone: 'Asia/Jakarta',
    }),
  }) satisfies Pick<FinanceLifecycleService, 'getState'>;

const makeRecord = (
  data: CreateFinanceSalesTransactionRecord
): FinanceSalesTransactionPersistenceRecord => ({
  ...data,
  _id: new Types.ObjectId(),
  organization: new Types.ObjectId(organizationId),
});

const account = (code: string) => ({
  _id: new Types.ObjectId(),
  organization: new Types.ObjectId(organizationId),
  code,
  name: code,
  type:
    code === '4100'
      ? ('revenue' as const)
      : ('asset' as const),
  parent_account: null,
  normal_balance:
    code === '4100'
      ? ('credit' as const)
      : ('debit' as const),
  is_system: true,
  is_postable: true,
  is_active: true,
  display_order: 1,
});

const journalResult = {
  journal_entry: {
    id: '507f1f77bcf86cd799439088',
    entry_number: 'FIN-1',
    transaction_date: '2026-09-22T00:00:00.000Z',
    posting_date: '2026-09-22T00:00:00.000Z',
    period: '2026-09',
    currency: 'IDR',
    description: 'Penjualan shopee SP-1001',
    source_type: 'order',
    source_id: sourceOrderId,
    source_event: 'completed_order',
    idempotency_key: `finance-sales:completed:shopee:507f1f77bcf86cd799439011:${sourceOrderId}`,
    status: 'posted' as const,
    posted_at: '2026-09-22T00:00:00.000Z',
    posted_by: null,
    reversal_of: null,
    lines: [],
  },
  replayed: false,
};

type RepositoryPort = Pick<
  FinanceSalesTransactionRepository,
  | 'findByIdempotencyKey'
  | 'findTransactionById'
  | 'createTransaction'
  | 'markBlocked'
  | 'markPosted'
>;

const makeRepository = () => {
  let current: FinanceSalesTransactionPersistenceRecord | null =
    null;
  const repository: RepositoryPort = {
    findByIdempotencyKey: async () => current,
    findTransactionById: async () => current,
    createTransaction: async (data) => {
      current = makeRecord(data);
      return current;
    },
    markBlocked: async (id, reason) => {
      if (!current || String(current._id) !== id)
        return null;
      current = {
        ...current,
        status: 'blocked',
        blocked_reason: reason,
      };
      return current;
    },
    markPosted: async (id, journalEntryId) => {
      if (!current || String(current._id) !== id)
        return null;
      current = {
        ...current,
        status: 'posted',
        journal_entry_id: new Types.ObjectId(
          journalEntryId
        ),
        blocked_reason: null,
      };
      return current;
    },
  };

  return {
    repository,
    getCurrent: () => current,
  };
};

const makeDependencies = (repository: RepositoryPort) => ({
  premiumAccessChecker: async () => true,
  lifecycleService: lifecycle('active'),
  transactionRepository: repository,
  roleResolver: {
    resolve: async (
      role: 'marketplace_receivable' | 'sales_revenue'
    ) =>
      role === 'sales_revenue'
        ? account('4100')
        : account('1210'),
  } satisfies Pick<
    FinanceAccountRoleResolverService,
    'resolve'
  >,
  journalService: {
    postOperational: async () => journalResult,
  } satisfies Pick<
    FinanceJournalService,
    'postOperational'
  >,
});

describe('FinanceSalesWorkflowService', () => {
  it('does not create a Finance transaction when Finance is disabled', async () => {
    const state = makeRepository();
    let journalCalled = false;
    const workflow = new FinanceSalesWorkflowService(
      { organizationId },
      {
        premiumAccessChecker: async () => true,
        lifecycleService: lifecycle('not_started'),
        transactionRepository: state.repository,
        journalService: {
          postOperational: async () => {
            journalCalled = true;
            return journalResult;
          },
        },
      }
    );

    const result = await workflow.process(getProjection());

    expect(result.status).toBe('disabled');
    expect(state.getCurrent()).toBeNull();
    expect(journalCalled).toBe(false);
  });

  it('keeps an eligible order pending in manual mode', async () => {
    const state = makeRepository();
    let journalCalled = false;
    const workflow = new FinanceSalesWorkflowService(
      { organizationId },
      {
        ...makeDependencies(state.repository),
        journalService: {
          postOperational: async () => {
            journalCalled = true;
            return journalResult;
          },
        },
      }
    );

    const result = await workflow.process(getProjection());

    expect(result.status).toBe('pending');
    expect(state.getCurrent()?.status).toBe('pending');
    expect(journalCalled).toBe(false);
  });

  it('posts a pending transaction through the explicit manual action', async () => {
    const state = makeRepository();
    const workflow = new FinanceSalesWorkflowService(
      { organizationId },
      makeDependencies(state.repository)
    );

    const pending = await workflow.process(getProjection());
    const result = await workflow.postTransaction(
      pending.transaction_id!
    );

    expect(pending.status).toBe('pending');
    expect(result.status).toBe('posted');
    expect(state.getCurrent()?.status).toBe('posted');
  });

  it('posts an eligible order automatically and marks the work item posted', async () => {
    const state = makeRepository();
    const workflow = new FinanceSalesWorkflowService(
      { organizationId },
      makeDependencies(state.repository)
    );

    const result = await workflow.process(getProjection(), {
      mode: 'automatic',
    });

    expect(result).toMatchObject({
      status: 'posted',
      journal_entry_id: journalResult.journal_entry.id,
    });
    expect(state.getCurrent()?.status).toBe('posted');
  });

  it('blocks the work item when automatic account mapping fails', async () => {
    const state = makeRepository();
    const workflow = new FinanceSalesWorkflowService(
      { organizationId },
      {
        ...makeDependencies(state.repository),
        roleResolver: {
          resolve: async () => {
            throw new FinanceDomainError(
              'Account Finance belum tersedia.',
              'FINANCE_SALES_ACCOUNT_MAPPING_MISSING'
            );
          },
        } satisfies Pick<
          FinanceAccountRoleResolverService,
          'resolve'
        >,
      }
    );

    const result = await workflow.process(getProjection(), {
      mode: 'automatic',
    });

    expect(result.status).toBe('blocked');
    expect(result.reason).toBe(
      'Account Finance belum tersedia.'
    );
    expect(state.getCurrent()?.status).toBe('blocked');
  });

  it('stores incomplete completed orders as blocked Finance work', async () => {
    const state = makeRepository();
    let journalCalled = false;
    const workflow = new FinanceSalesWorkflowService(
      { organizationId },
      {
        ...makeDependencies(state.repository),
        journalService: {
          postOperational: async () => {
            journalCalled = true;
            return journalResult;
          },
        },
      }
    );

    const result = await workflow.process(
      getProjection({ store_id: undefined }),
      { mode: 'automatic' }
    );

    expect(result.status).toBe('blocked');
    expect(state.getCurrent()?.status).toBe('blocked');
    expect(journalCalled).toBe(false);
  });
});
