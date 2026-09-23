# Finance Plan 04 — Sales and Order Integration

Status: [CURRENT / INTEGRATED — CORE SETTLEMENT CASES BLOCK SAFELY]

## Goal

Connect the optional Finance module to existing Orders import workflows without
making Finance a prerequisite for order import or changing Reports.

## Boundary

Orders remains the operational source of truth. A narrow adapter in
`modules/orders/services/order-finance-integration.service.ts` maps stored
orders into Finance contracts. Finance owns its sales work items,
marketplace-release records, journals, account roles, and idempotency keys.
No runtime path in the new Finance module imports legacy Accounting,
Inventory, or Expenses.

The old Order Accounting fields/service are retained as [LEGACY] compatibility
only while the old Accounting package remains in the repository; active order
import and row actions no longer invoke them. Remove these compatibility
contracts together with the legacy Accounting package in the later cleanup,
not as a one-off data migration.

## Implemented behavior

### Phase 4.1 — Sales source projection

Finance has its own normalized projection and source snapshot. The Orders-side
adapter maps organization/store, order/platform/status, dates, totals, line
references, quantities, returns, and product cost fields. The Finance
projection validates this input and never mutates the canonical order.

### Phase 4.2 — Completed-order recognition

Only an order with status `selesai` is an eligible completed-order event.
When Finance is active, current Shopee import and completed-order enrichment
call the Finance workflow in automatic mode. The resulting journal debits
Marketplace Receivable and credits Sales Revenue. Processing is idempotent.
Orders with returned quantity are blocked until Finance return/refund rules are
implemented; they are not posted as unreduced sales. A return found after a
sale journal is already posted does not edit that journal. The import result
flags the marketplace return and blocks release posting; correction of the
already-posted sale requires a separate explicit Finance reversal/correction
until dedicated refund handling is implemented.

If Finance is not active, the workflow returns `disabled` without creating a
Finance work item or journal. Import still succeeds. A Finance posting or
mapping failure is reported in that order's result and does not fail the
underlying order import.

### Phase 4.3 — Automatic/manual workflow and recovery

Finance supports `automatic` and `manual` modes. The current importer seam
uses automatic mode only after the Finance lifecycle is active. Manual mode
remains available through the Finance work-item workflow/API. Work items use
`pending`, `blocked`, `posted`, and `reversed` states; retry uses the
stored Finance snapshot and journal idempotency contract. Posted journal lines
are immutable; corrections use reversal/correcting transactions.

### Phase 4.4 — Importer integration and existing orders

Both new and already-imported completed orders can reach the Finance workflow
when the relevant import/enrichment is run again. Finance failure is isolated
from order persistence and surfaced as a safe per-order message. This provides
a practical reprocessing path without silently changing an existing order's
accounting snapshot.

### Phase 4.5 — Released funds to marketplace balance

The released-funds importer updates Orders as before, then passes the stored
order snapshot to the Finance-owned `FinanceMarketplaceReleaseService`.
Finance stores source/reconciliation state in
`finance_marketplace_releases`. It does not reuse the legacy settlement
collection.

The posting is attempted only when Finance is active and the completed-sale
journal is already posted. A fully reconciled release creates a new balanced
journal:

- debit the COA account with role `marketplace_balance` for net released
  funds (the money is still in the marketplace wallet, not the bank);
- debit mapped marketplace-fee expense accounts;
- credit `marketplace_receivable` for the original gross receivable.

The fee total plus released amount must exactly reconcile to the posted sale
receivable. Missing source values, mismatch, tax components, unsupported
shipping-fee refunds, buyer-refund amounts from either supported Shopee file
format, or order returns are saved as `blocked`; the buyer-refund amount is
retained on the Finance release record. They do not create a journal. The
event is idempotent and the importer continues to succeed. Tax posting remains
deliberately deferred by product decision.

A later withdrawal from marketplace balance to a real bank account is a
separate user-entered Finance Cash & Bank transfer. The released-funds file
does not imply that a bank payout already happened, and no bank mutation or
statement import is part of this flow.

## Remaining boundaries

- Due dates are not inferred from order or transaction dates. Subledger
  `overdue_status: not_configured` remains intentional until a source or
  explicit user-entered due date is designed.
- Returns/refunds need a supported marketplace source, recognition/correction
  rule, and test cases before Finance can post them. Until then, affected sales
  and releases are blocked with a reason.
- Tax components are blocked and Phase 7.4 remains deferred.
- A future generic feature-flag/entitlement platform is out of scope. For
  development testing, the premium-plan check is temporarily bypassed; the
  Finance lifecycle still controls whether posting occurs.

## Verification criteria

- A new order and an existing completed order can be processed without
  duplicate sales journals.
- Finance inactive: no Finance work item/journal is created and order import
  remains successful.
- Finance active: mapping or source failures become visible blocked work and
  do not undo the imported order.
- Released funds debit marketplace balance—not bank—only after exact
  reconciliation with a posted sales journal.
- Unsupported returns, refunds, tax, and mismatches never produce guessed
  journal lines.
- Reports and the legacy Orders/Products/Reports user experience are not
  replaced by this plan.

## Deferred follow-up

- Decide whether the Sales page needs a manual “post” action in addition to
  importer-triggered automatic posting.
- Define due-date sources and overdue behavior only when marketplace or
  supplier source data supports it.
- Add marketplace-specific return/refund accounting once the core flows have
  been exercised successfully.
