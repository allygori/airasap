import type { ClientSession } from 'mongoose';
import { FinanceAccountRoleResolverService } from '../accounts/finance-account-role-resolver.service';
import { FinanceDomainError } from '../finance.error';
import { FinanceLifecycleService } from '../finance-lifecycle.service';
import { FinanceEntitlementService } from '../finance-entitlement.service';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import { FinanceJournalService } from '../journal/finance-journal.service';
import type {
  FinanceSalesCogsRetryResultDTO,
  FinanceSalesPostingDecisionDTO,
  FinanceSalesPostingIntentDTO,
  FinanceSalesPostingModeDTO,
  FinanceSalesProjectionDTO,
  FinanceSalesWorkflowResultDTO,
} from './finance-sales.dto';
import {
  makeFinanceSalesCogsRetryJournalIdempotencyKey,
  makeFinanceSalesIdempotencyKey,
} from './finance-sales.keys';
import { FinanceSalesPostingRulesService } from './finance-sales-rules.service';
import { FinanceInventoryCogsService } from '../inventory/finance-inventory-cogs.service';
import {
  FinanceSalesTransactionRepository,
  type CreateFinanceSalesTransactionRecord,
  type FinanceSalesTransactionPersistenceRecord,
} from './finance-sales-transaction.repository';
import type { TFinanceSalesCogsRetryPlan } from './finance-sales-transaction.model';
import {
  FinanceSalesCogsRetryResultSchema,
  FinanceSalesPostingIntentSchema,
  FinanceSalesWorkflowResultSchema,
} from './finance-sales.schema';

type FinanceSalesPostingContext = {
  source_order_id: string;
  platform: string;
  store_id: string | null;
};

type FinanceSalesLifecyclePort = Pick<
  FinanceLifecycleService,
  'getState'
>;

type FinancePremiumAccessChecker = () => Promise<boolean>;

type FinanceSalesTransactionRepositoryPort = Pick<
  FinanceSalesTransactionRepository,
  | 'findByIdempotencyKey'
  | 'findTransactionById'
  | 'createTransaction'
  | 'markBlocked'
  | 'markPosted'
>;

type FinanceSalesAccountResolverPort = Pick<
  FinanceAccountRoleResolverService,
  'resolve'
>;

type FinanceSalesJournalPort = Pick<
  FinanceJournalService,
  'postOperational'
>;

type FinanceSalesCogsRetryJournalPort = Pick<
  FinanceJournalService,
  'postOperational' | 'findByIdempotencyKey'
>;

type FinanceSalesCogsRetryRepositoryPort = Pick<
  FinanceSalesTransactionRepository,
  | 'findTransactionById'
  | 'saveCogsRetryPlan'
  | 'updateDeferredCogsReason'
  | 'clearCogsRetryPlan'
  | 'markInventoryCogsPosted'
>;

type FinanceSalesCogsPort = Pick<
  FinanceInventoryCogsService,
  'prepare' | 'finalize'
>;

export type FinanceSalesWorkflowInput = {
  mode?: FinanceSalesPostingModeDTO;
  payment_account_id?: string;
  require_inventory_cogs?: boolean;
  session?: ClientSession;
};

const isDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  if (!('code' in error)) return false;
  return (error as { code?: unknown }).code === 11000;
};

const getSafeFailureReason = (error: unknown) => {
  if (error instanceof FinanceDomainError) {
    return error.message;
  }

  return 'Posting sales Finance gagal dan perlu dicoba kembali.';
};

export class FinanceSalesWorkflowService {
  private readonly lifecycleService: FinanceSalesLifecyclePort;
  private readonly transactionRepository: FinanceSalesTransactionRepositoryPort;
  private readonly roleResolver: FinanceSalesAccountResolverPort;
  private readonly journalService: FinanceSalesJournalPort;
  private readonly cogsRetryJournalService: FinanceSalesCogsRetryJournalPort;
  private readonly cogsRetryRepository: FinanceSalesCogsRetryRepositoryPort;
  private readonly rulesService: FinanceSalesPostingRulesService;
  private readonly cogsService: FinanceSalesCogsPort;
  private readonly premiumAccessChecker: FinancePremiumAccessChecker;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      lifecycleService?: FinanceSalesLifecyclePort;
      transactionRepository?: FinanceSalesTransactionRepositoryPort;
      roleResolver?: FinanceSalesAccountResolverPort;
      journalService?: FinanceSalesJournalPort;
      cogsRetryJournalService?: FinanceSalesCogsRetryJournalPort;
      cogsRetryRepository?: FinanceSalesCogsRetryRepositoryPort;
      rulesService?: FinanceSalesPostingRulesService;
      cogsService?: FinanceSalesCogsPort;
      premiumAccessChecker?: FinancePremiumAccessChecker;
    }
  ) {
    assertFinanceTenant(context);
    this.lifecycleService =
      dependencies?.lifecycleService ??
      new FinanceLifecycleService(context);
    this.transactionRepository =
      dependencies?.transactionRepository ??
      new FinanceSalesTransactionRepository(context);
    this.roleResolver =
      dependencies?.roleResolver ??
      new FinanceAccountRoleResolverService(context);
    this.journalService =
      dependencies?.journalService ??
      new FinanceJournalService(context);
    this.cogsRetryJournalService =
      dependencies?.cogsRetryJournalService ??
      new FinanceJournalService(context);
    this.cogsRetryRepository =
      dependencies?.cogsRetryRepository ??
      new FinanceSalesTransactionRepository(context);
    this.rulesService =
      dependencies?.rulesService ??
      new FinanceSalesPostingRulesService();
    this.cogsService =
      dependencies?.cogsService ??
      new FinanceInventoryCogsService(context);
    this.premiumAccessChecker =
      dependencies?.premiumAccessChecker ??
      (async () =>
        (
          await new FinanceEntitlementService(
            context
          ).getAvailability()
        ).available);
  }

  async process(
    projection: FinanceSalesProjectionDTO,
    input?: FinanceSalesWorkflowInput
  ): Promise<FinanceSalesWorkflowResultDTO> {
    const mode = input?.mode ?? 'manual';
    const session = input?.session;
    if (!(await this.premiumAccessChecker())) {
      return this.result({
        status: 'disabled',
        mode,
        source_order_id: projection.source_order_id,
        transaction_id: null,
        journal_entry_id: null,
        reason:
          'Finance tidak tersedia untuk paket organisasi ini.',
      });
    }
    const finance =
      await this.lifecycleService.getState(session);

    if (finance.status !== 'active') {
      return this.result({
        status: 'disabled',
        mode,
        source_order_id: projection.source_order_id,
        transaction_id: null,
        journal_entry_id: null,
        reason: 'Finance module belum aktif.',
      });
    }

    const decision = this.rulesService.evaluate(
      projection,
      {
        payment_account_id: input?.payment_account_id,
      }
    );
    const existing =
      await this.transactionRepository.findByIdempotencyKey(
        this.getIdempotencyKey(decision, projection),
        session
      );

    if (
      existing?.status === 'posted' ||
      existing?.status === 'reversed'
    ) {
      return this.resultFromTransaction(existing);
    }

    if (decision.decision === 'not_eligible') {
      return this.result({
        status: 'not_eligible',
        mode,
        source_order_id: projection.source_order_id,
        transaction_id: null,
        journal_entry_id: null,
        reason: decision.message,
      });
    }

    if (decision.decision === 'blocked') {
      const transaction = existing
        ? await this.blockExisting(
            existing,
            decision.message,
            session
          )
        : await this.createTransaction(
            this.buildTransactionRecord(
              projection,
              mode,
              'blocked',
              decision.message,
              null
            ),
            session
          );

      return this.result({
        status: 'blocked',
        mode,
        source_order_id: projection.source_order_id,
        transaction_id: String(transaction._id),
        journal_entry_id: null,
        reason: decision.message,
      });
    }

    const intent = decision.intent;
    if (!intent) {
      return this.result({
        status: 'blocked',
        mode,
        source_order_id: projection.source_order_id,
        transaction_id: null,
        journal_entry_id: null,
        reason:
          'Posting sales Finance belum memiliki intent yang valid.',
      });
    }

    const transaction =
      existing ??
      (await this.createTransaction(
        this.buildTransactionRecord(
          projection,
          mode,
          'pending',
          null,
          intent
        ),
        session
      ));

    if (mode === 'manual') {
      return this.result({
        status: transaction.status,
        mode,
        source_order_id: projection.source_order_id,
        transaction_id: String(transaction._id),
        journal_entry_id: transaction.journal_entry_id
          ? String(transaction.journal_entry_id)
          : null,
        reason: transaction.blocked_reason,
      });
    }

    return this.postIntent(
      {
        source_order_id: projection.source_order_id,
        platform: projection.platform,
        store_id: projection.store_id,
      },
      intent,
      transaction,
      mode,
      session,
      input?.require_inventory_cogs ?? false
    );
  }

  async postTransaction(
    transactionId: string,
    session?: ClientSession
  ): Promise<FinanceSalesWorkflowResultDTO> {
    const transaction =
      await this.transactionRepository.findTransactionById(
        transactionId,
        session
      );

    if (!transaction) {
      throw new FinanceDomainError(
        'Transaksi sales Finance tidak ditemukan.',
        'FINANCE_SALES_TRANSACTION_NOT_FOUND'
      );
    }

    const finance =
      await this.lifecycleService.getState(session);
    if (finance.status !== 'active') {
      return this.result({
        status: 'disabled',
        mode: transaction.posting_mode,
        source_order_id: transaction.source_order_id,
        transaction_id: String(transaction._id),
        journal_entry_id: transaction.journal_entry_id
          ? String(transaction.journal_entry_id)
          : null,
        reason: 'Finance module belum aktif.',
      });
    }

    if (
      transaction.status === 'posted' ||
      transaction.status === 'reversed'
    ) {
      return this.resultFromTransaction(transaction);
    }

    const intent = this.getPersistedIntent(transaction);
    if (!intent) {
      const reason =
        transaction.blocked_reason ??
        'Transaksi sales Finance belum memiliki intent posting yang lengkap.';
      const blocked =
        transaction.status === 'pending'
          ? await this.transactionRepository.markBlocked(
              String(transaction._id),
              reason,
              session
            )
          : transaction;

      return this.result({
        status: 'blocked',
        mode: transaction.posting_mode,
        source_order_id: transaction.source_order_id,
        transaction_id: String(
          blocked?._id ?? transaction._id
        ),
        journal_entry_id: null,
        reason,
      });
    }

    return this.postIntent(
      {
        source_order_id: transaction.source_order_id,
        platform: transaction.platform,
        store_id: transaction.store_id,
      },
      intent,
      transaction,
      transaction.posting_mode,
      session,
      transaction.platform === 'offline'
    );
  }

  async retryDeferredCogs(
    transactionId: string,
    session?: ClientSession
  ): Promise<FinanceSalesCogsRetryResultDTO> {
    let transaction =
      await this.cogsRetryRepository.findTransactionById(
        transactionId,
        session
      );
    if (!transaction) {
      throw new FinanceDomainError(
        'Transaksi sales Finance tidak ditemukan.',
        'FINANCE_SALES_TRANSACTION_NOT_FOUND'
      );
    }

    if (!(await this.premiumAccessChecker())) {
      throw new FinanceDomainError(
        'Finance tidak tersedia untuk paket organisasi ini.',
        'FINANCE_NOT_ACTIVE'
      );
    }
    const finance =
      await this.lifecycleService.getState(session);
    if (finance.status !== 'active') {
      throw new FinanceDomainError(
        'Finance module belum aktif.',
        'FINANCE_NOT_ACTIVE'
      );
    }

    if (
      transaction.status === 'posted' &&
      (transaction.inventory_cogs_status ?? 'deferred') ===
        'posted'
    ) {
      return this.toCogsRetryResult(transaction, 'posted');
    }
    if (
      transaction.status !== 'posted' ||
      (transaction.inventory_cogs_status ?? 'deferred') !==
        'deferred'
    ) {
      throw new FinanceDomainError(
        'Retry HPP hanya tersedia untuk transaksi posted dengan HPP tertunda.',
        'FINANCE_SALES_COGS_NOT_RETRYABLE'
      );
    }

    let plan =
      transaction.inventory_cogs_retry_plan ?? null;
    if (!plan) {
      const retryDate = new Date();
      const preparation = await this.cogsService.prepare(
        {
          source_order_id: transaction.source_order_id,
          source_order_number:
            transaction.source_order_number,
          platform: transaction.platform,
          store_id: transaction.store_id,
          transaction_date: retryDate,
          lines: transaction.source_lines,
        },
        session
      );

      if (
        preparation.status === 'deferred' ||
        preparation.total_cost === null
      ) {
        const updated =
          await this.cogsRetryRepository.updateDeferredCogsReason(
            String(transaction._id),
            preparation.reason ??
              'HPP belum dapat dihitung.',
            session
          );
        if (updated) {
          return this.toCogsRetryResult(
            updated,
            'deferred'
          );
        }
        const latest =
          await this.cogsRetryRepository.findTransactionById(
            String(transaction._id),
            session
          );
        if (
          latest?.status === 'posted' &&
          latest.inventory_cogs_status === 'posted'
        ) {
          return this.toCogsRetryResult(latest, 'posted');
        }
        throw new FinanceDomainError(
          'Status HPP berubah saat retry dijalankan. Muat ulang transaksi lalu coba lagi.',
          'FINANCE_SALES_COGS_NOT_RETRYABLE'
        );
      }

      const candidate: TFinanceSalesCogsRetryPlan = {
        retry_date: retryDate,
        total_cost: preparation.total_cost,
        journal_lines: preparation.journal_lines,
        movements: preparation.movements,
      };
      const saved =
        await this.cogsRetryRepository.saveCogsRetryPlan(
          String(transaction._id),
          candidate,
          session
        );
      if (saved) {
        transaction = saved;
      } else {
        const latest =
          await this.cogsRetryRepository.findTransactionById(
            String(transaction._id),
            session
          );
        if (
          latest?.status === 'posted' &&
          latest.inventory_cogs_status === 'posted'
        ) {
          return this.toCogsRetryResult(latest, 'posted');
        }
        if (!latest?.inventory_cogs_retry_plan) {
          throw new FinanceDomainError(
            'Rencana retry HPP berubah sebelum dapat disimpan. Muat ulang transaksi lalu coba lagi.',
            'FINANCE_SALES_COGS_NOT_RETRYABLE'
          );
        }
        transaction = latest;
      }
      plan = transaction.inventory_cogs_retry_plan ?? null;
    }

    if (!plan) {
      throw new FinanceDomainError(
        'Rencana retry HPP tidak tersedia.',
        'FINANCE_INVENTORY_COGS_FINALIZATION_FAILED'
      );
    }

    const idempotencyKey =
      makeFinanceSalesCogsRetryJournalIdempotencyKey(
        String(transaction._id)
      );
    let journalResult;
    try {
      journalResult =
        await this.cogsRetryJournalService.postOperational(
          {
            transaction_date: plan.retry_date,
            posting_date: plan.retry_date,
            currency: transaction.currency,
            description: `HPP retry penjualan ${transaction.source_order_number}`,
            source_type:
              transaction.platform === 'offline'
                ? 'offline_sale'
                : 'order',
            source_id: transaction.source_order_id,
            source_event: 'inventory_cogs_retry',
            idempotency_key: idempotencyKey,
            lines: plan.journal_lines,
          },
          session
        );
    } catch (error: unknown) {
      const existing =
        await this.cogsRetryJournalService.findByIdempotencyKey(
          idempotencyKey,
          session
        );
      if (!existing) {
        await this.cogsRetryRepository.clearCogsRetryPlan(
          String(transaction._id),
          session
        );
      }
      throw error;
    }

    const preparation = {
      status: 'posted' as const,
      reason: null,
      total_cost: plan.total_cost,
      journal_lines: plan.journal_lines,
      movements: plan.movements,
    };
    const movementIds = await this.cogsService.finalize(
      preparation,
      journalResult.journal_entry.id,
      session
    );
    const posted =
      await this.cogsRetryRepository.markInventoryCogsPosted(
        String(transaction._id),
        journalResult.journal_entry.id,
        {
          total_cost: plan.total_cost,
          movement_ids: movementIds,
        },
        session
      );
    if (posted) {
      return this.toCogsRetryResult(posted, 'posted');
    }

    const latest =
      await this.cogsRetryRepository.findTransactionById(
        String(transaction._id),
        session
      );
    if (
      latest?.status === 'posted' &&
      latest.inventory_cogs_status === 'posted' &&
      String(latest.inventory_cogs_journal_entry_id) ===
        journalResult.journal_entry.id
    ) {
      return this.toCogsRetryResult(latest, 'posted');
    }

    throw new FinanceDomainError(
      'Jurnal HPP berhasil dibuat tetapi status transaksi gagal diperbarui. Retry kembali untuk melanjutkan finalisasi.',
      'FINANCE_INVENTORY_COGS_FINALIZATION_FAILED'
    );
  }

  private toCogsRetryResult(
    transaction: FinanceSalesTransactionPersistenceRecord,
    status: 'posted' | 'deferred'
  ): FinanceSalesCogsRetryResultDTO {
    return FinanceSalesCogsRetryResultSchema.parse({
      status,
      transaction_id: String(transaction._id),
      inventory_cogs_journal_entry_id:
        transaction.inventory_cogs_journal_entry_id
          ? String(
              transaction.inventory_cogs_journal_entry_id
            )
          : null,
      total_cost:
        transaction.inventory_cogs_total_cost ?? null,
      reason:
        status === 'deferred'
          ? (transaction.inventory_cogs_deferred_reason ??
            'HPP belum dapat dihitung.')
          : null,
    });
  }

  private async postIntent(
    context: FinanceSalesPostingContext,
    intent: FinanceSalesPostingIntentDTO,
    transaction: FinanceSalesTransactionPersistenceRecord,
    mode: FinanceSalesPostingModeDTO,
    session?: ClientSession,
    requireInventoryCogs = false
  ): Promise<FinanceSalesWorkflowResultDTO> {
    let journalPosted = false;

    try {
      const cogs = await this.cogsService.prepare(
        {
          source_order_id: context.source_order_id,
          source_order_number:
            transaction.source_order_number,
          platform: transaction.platform,
          store_id: transaction.store_id,
          transaction_date: new Date(
            intent.transaction_date
          ),
          lines: transaction.source_lines,
        },
        session
      );
      if (
        requireInventoryCogs &&
        cogs.status !== 'posted'
      ) {
        throw new FinanceDomainError(
          cogs.reason ??
            'HPP dan pengurangan stok belum dapat diproses.',
          'FINANCE_INVENTORY_COGS_FINALIZATION_FAILED'
        );
      }
      const accountByRole = new Map<string, string>();

      for (const line of intent.lines) {
        if ('account_role' in line) {
          const account = await this.roleResolver.resolve(
            line.account_role,
            session
          );
          accountByRole.set(
            line.account_role,
            String(account._id)
          );
        }
      }

      const journalResult =
        await this.journalService.postOperational(
          {
            transaction_date: new Date(
              intent.transaction_date
            ),
            posting_date: new Date(intent.transaction_date),
            currency: intent.currency,
            description: intent.description,
            source_type:
              context.platform === 'offline'
                ? 'offline_sale'
                : 'order',
            source_id: context.source_order_id,
            source_event: intent.source_event,
            idempotency_key: intent.idempotency_key,
            lines: [
              ...intent.lines.map((line) => ({
                account_id:
                  ('account_id' in line
                    ? line.account_id
                    : accountByRole.get(
                        line.account_role
                      )) ?? '',
                debit: line.debit,
                credit: line.credit,
                dimensions: {
                  platform: context.platform,
                  ...(context.store_id
                    ? { store_id: context.store_id }
                    : {}),
                },
              })),
              ...cogs.journal_lines,
            ],
          },
          session
        );
      journalPosted = true;

      const movementIds = await this.cogsService.finalize(
        cogs,
        journalResult.journal_entry.id,
        session
      );

      const posted =
        await this.transactionRepository.markPosted(
          String(transaction._id),
          journalResult.journal_entry.id,
          session,
          {
            status: cogs.status,
            reason: cogs.reason,
            total_cost: cogs.total_cost,
            movement_ids: movementIds,
          }
        );

      if (!posted) {
        const latest =
          await this.transactionRepository.findByIdempotencyKey(
            intent.idempotency_key,
            session
          );
        if (latest?.status === 'posted') {
          return this.resultFromTransaction(latest);
        }

        throw new FinanceDomainError(
          'Transaksi sales Finance gagal ditandai posted.',
          'FINANCE_JOURNAL_CREATE_CONFLICT'
        );
      }

      return this.result({
        status: 'posted',
        mode,
        source_order_id: context.source_order_id,
        transaction_id: String(posted._id),
        journal_entry_id: journalResult.journal_entry.id,
        reason: null,
      });
    } catch (error: unknown) {
      // On standalone MongoDB the journal cannot be rolled back together
      // with its source transaction. Keep the source retryable if any step
      // fails after the journal has been posted.
      if (journalPosted) {
        throw error;
      }

      const reason = getSafeFailureReason(error);
      const blocked =
        await this.transactionRepository.markBlocked(
          String(transaction._id),
          reason,
          session
        );

      return this.result({
        status: 'blocked',
        mode,
        source_order_id: context.source_order_id,
        transaction_id: String(
          blocked?._id ?? transaction._id
        ),
        journal_entry_id: blocked?.journal_entry_id
          ? String(blocked.journal_entry_id)
          : null,
        reason,
      });
    }
  }

  private async createTransaction(
    data: CreateFinanceSalesTransactionRecord,
    session?: ClientSession
  ): Promise<FinanceSalesTransactionPersistenceRecord> {
    try {
      return await this.transactionRepository.createTransaction(
        data,
        session
      );
    } catch (error: unknown) {
      if (!isDuplicateKeyError(error)) throw error;

      const existing =
        await this.transactionRepository.findByIdempotencyKey(
          data.idempotency_key,
          session
        );
      if (existing) return existing;
      throw new FinanceDomainError(
        'Transaksi sales Finance gagal dibuat karena konflik data.',
        'FINANCE_JOURNAL_CREATE_CONFLICT'
      );
    }
  }

  private getPersistedIntent(
    transaction: FinanceSalesTransactionPersistenceRecord
  ): FinanceSalesPostingIntentDTO | null {
    if (
      !transaction.intent_source_event ||
      !transaction.intent_transaction_date ||
      !transaction.intent_description ||
      transaction.intent_lines.length === 0
    ) {
      return null;
    }

    const parsed =
      FinanceSalesPostingIntentSchema.safeParse({
        source_order_id: transaction.source_order_id,
        source_order_number:
          transaction.source_order_number,
        source_event: transaction.intent_source_event,
        transaction_date:
          transaction.intent_transaction_date.toISOString(),
        currency: transaction.currency,
        description: transaction.intent_description,
        idempotency_key: transaction.idempotency_key,
        lines: transaction.intent_lines,
        inventory_cogs: {
          status:
            transaction.inventory_cogs_status ?? 'deferred',
          reason:
            transaction.inventory_cogs_status === 'posted'
              ? null
              : (transaction.inventory_cogs_deferred_reason ??
                'HPP belum diposting.'),
        },
      });

    return parsed.success ? parsed.data : null;
  }

  private async blockExisting(
    existing: FinanceSalesTransactionPersistenceRecord,
    reason: string,
    session?: ClientSession
  ) {
    if (existing.status === 'blocked') return existing;

    return (
      (await this.transactionRepository.markBlocked(
        String(existing._id),
        reason,
        session
      )) ?? existing
    );
  }

  private buildTransactionRecord(
    projection: FinanceSalesProjectionDTO,
    mode: FinanceSalesPostingModeDTO,
    status: 'pending' | 'blocked',
    blockedReason: string | null,
    intent: FinanceSalesPostingIntentDTO | null
  ): CreateFinanceSalesTransactionRecord {
    return {
      source_order_id: projection.source_order_id,
      source_order_number: projection.source_order_number,
      store_id: projection.store_id,
      platform: projection.platform,
      source_status: projection.source_status,
      transaction_date: projection.transaction_date
        ? new Date(projection.transaction_date)
        : null,
      currency: projection.currency,
      sales_amount: projection.sales_amount,
      posting_mode: mode,
      status,
      idempotency_key: this.getIdempotencyKey(
        intent,
        projection
      ),
      blocked_reason: blockedReason,
      journal_entry_id: null,
      source_lines: projection.lines,
      intent_source_event: intent?.source_event ?? null,
      intent_transaction_date: intent
        ? new Date(intent.transaction_date)
        : null,
      intent_description: intent?.description ?? null,
      intent_lines: intent?.lines ?? [],
      inventory_cogs_deferred_reason:
        intent?.inventory_cogs.reason ?? null,
      inventory_cogs_status:
        intent?.inventory_cogs.status ?? 'deferred',
      inventory_cogs_total_cost: null,
      inventory_cogs_journal_entry_id: null,
      inventory_cogs_retry_plan: null,
      inventory_movement_ids: [],
    };
  }

  private getIdempotencyKey(
    decisionOrIntent:
      | FinanceSalesPostingDecisionDTO
      | FinanceSalesPostingIntentDTO
      | null,
    projection: FinanceSalesProjectionDTO
  ) {
    if (
      decisionOrIntent &&
      'intent' in decisionOrIntent &&
      decisionOrIntent.intent
    ) {
      return decisionOrIntent.intent.idempotency_key;
    }

    if (
      decisionOrIntent &&
      'idempotency_key' in decisionOrIntent
    ) {
      return decisionOrIntent.idempotency_key;
    }

    return makeFinanceSalesIdempotencyKey(
      projection,
      projection.platform === 'offline'
        ? 'offline-sale'
        : 'completed'
    );
  }

  private result(
    value: FinanceSalesWorkflowResultDTO
  ): FinanceSalesWorkflowResultDTO {
    return FinanceSalesWorkflowResultSchema.parse(value);
  }

  private resultFromTransaction(
    transaction: FinanceSalesTransactionPersistenceRecord
  ) {
    return this.result({
      status: transaction.status,
      mode: transaction.posting_mode,
      source_order_id: transaction.source_order_id,
      transaction_id: String(transaction._id),
      journal_entry_id: transaction.journal_entry_id
        ? String(transaction.journal_entry_id)
        : null,
      reason: transaction.blocked_reason,
    });
  }
}
