import type { ClientSession } from 'mongoose';
import { FinanceAccountRoleResolverService } from '../accounts/finance-account-role-resolver.service';
import { FinanceDomainError } from '../finance.error';
import { FinanceLifecycleService } from '../finance-lifecycle.service';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import { FinanceJournalService } from '../journal/finance-journal.service';
import type {
  FinanceSalesPostingDecisionDTO,
  FinanceSalesPostingIntentDTO,
  FinanceSalesPostingModeDTO,
  FinanceSalesProjectionDTO,
  FinanceSalesWorkflowResultDTO,
} from './finance-sales.dto';
import { FinanceSalesPostingRulesService } from './finance-sales-rules.service';
import {
  FinanceSalesTransactionRepository,
  type CreateFinanceSalesTransactionRecord,
  type FinanceSalesTransactionPersistenceRecord,
} from './finance-sales-transaction.repository';
import {
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

export type FinanceSalesWorkflowInput = {
  mode?: FinanceSalesPostingModeDTO;
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
  private readonly rulesService: FinanceSalesPostingRulesService;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      lifecycleService?: FinanceSalesLifecyclePort;
      transactionRepository?: FinanceSalesTransactionRepositoryPort;
      roleResolver?: FinanceSalesAccountResolverPort;
      journalService?: FinanceSalesJournalPort;
      rulesService?: FinanceSalesPostingRulesService;
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
    this.rulesService =
      dependencies?.rulesService ??
      new FinanceSalesPostingRulesService();
  }

  async process(
    projection: FinanceSalesProjectionDTO,
    input?: FinanceSalesWorkflowInput
  ): Promise<FinanceSalesWorkflowResultDTO> {
    const mode = input?.mode ?? 'manual';
    const session = input?.session;
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

    const decision = this.rulesService.evaluate(projection);
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
      session
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
      session
    );
  }

  private async postIntent(
    context: FinanceSalesPostingContext,
    intent: FinanceSalesPostingIntentDTO,
    transaction: FinanceSalesTransactionPersistenceRecord,
    mode: FinanceSalesPostingModeDTO,
    session?: ClientSession
  ): Promise<FinanceSalesWorkflowResultDTO> {
    try {
      const accountByRole = new Map<
        FinanceSalesPostingIntentDTO['lines'][number]['account_role'],
        string
      >();

      for (const line of intent.lines) {
        const account = await this.roleResolver.resolve(
          line.account_role,
          session
        );
        accountByRole.set(
          line.account_role,
          String(account._id)
        );
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
            source_type: 'order',
            source_id: context.source_order_id,
            source_event: intent.source_event,
            idempotency_key: intent.idempotency_key,
            lines: intent.lines.map((line) => ({
              account_id:
                accountByRole.get(line.account_role) ?? '',
              debit: line.debit,
              credit: line.credit,
              dimensions: {
                platform: context.platform,
                ...(context.store_id
                  ? { store_id: context.store_id }
                  : {}),
              },
            })),
          },
          session
        );

      const posted =
        await this.transactionRepository.markPosted(
          String(transaction._id),
          journalResult.journal_entry.id,
          session
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
      transaction.intent_lines.length === 0 ||
      !transaction.inventory_cogs_deferred_reason
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
          status: 'deferred',
          reason:
            transaction.inventory_cogs_deferred_reason,
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
      'idempotency_key' in decisionOrIntent
    ) {
      return decisionOrIntent.idempotency_key;
    }

    return `finance-sales:completed:${projection.source_order_id}`;
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
