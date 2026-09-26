# Finance Plan 09 — Historical Reconstruction

Status: [TARGET / NOT IMPLEMENTED]

## Goal

Provide a small, understandable way for a Finance-enabled organization to
record selected historical merchandise purchases and existing order activity,
review deferred HPP, and transparently track unexplained reconstruction
differences. The initial release must reuse the current Finance Purchase form
and Orders import path rather than creating parallel transaction-entry flows.

This plan is deliberately narrower than a complete historical-accounting
backfill. It must not imply that reconstructed purchases and orders alone make
all historical financial statements complete.

## Boundary

- Finance remains optional. Reconstruction is available only after the Finance
  lifecycle is active and must have server-side organization access checks.
- Reconstruction starts after onboarding. Onboarding continues to establish an
  explicitly chosen opening position; it must not silently import historical
  purchases or orders.
- The opening-balance date and the selected reconstruction date range are
  distinct concepts. Each organization chooses its own history boundary and
  opening state. Starting at zero is an explicit user choice, not a global
  default.
- Historical purchases use the Finance-owned Purchase workflow and
  `finance_purchases`; order and released-funds events continue to come through
  the existing Orders import/enrichment integration described in Plan 04.
- Orders, Products, and Reports remain their own modules and are not replaced.
  Do not add runtime dependencies on legacy Accounting, Inventory, or Expenses.
- Plan 08 remains deferred until the product owner is satisfied with the core
  Finance workflows. Plan 09 does not implement financial statements or period
  closing.

## Confirmed product direction

- The user's current test scenario starts from a zero opening position before
  April 2026 and reconstructs activity through 26 September 2026. These dates
  are an example, not a system default or a constraint for other organizations.
- Purchase entry should reuse the current Finance Purchase form. A
  reconstruction entry point may open that same form with historical context;
  do not create a second purchase form with duplicate fields and behavior.
- Orders continue through the existing Orders import/enrichment flow. Do not
  create a Finance sales-entry form for imported orders or post a second copy
  of an order manually.
- At most one system-managed, organization-scoped suspense account is allowed
  for reconstruction. It is not a general-purpose account for routine
  transactions or a way to bypass unsupported source data.
- Posted journals and inventory movements are immutable. Corrections and
  suspense resolution use new, traceable journal entries.
- No bank mutation or bank-statement import is required for this plan.

## Current baseline [CURRENT]

- Plan 03 implements an explicit opening-balance choice, including an explicit
  zero-start option. It does not backfill historical orders or purchases.
- Plan 04 integrates completed-order and released-funds events from the
  existing import/enrichment flow when Finance is active and uses idempotent
  posting behavior. Re-running an import is not a substitute for retrying
  deferred HPP.
- Plan 05 posts HPP when the current inventory costing prerequisites are met.
  Otherwise the sales journal may be posted with HPP marked `deferred` and a
  visible reason. There is no dedicated historical deferred-HPP recovery
  workflow yet.
- Plan 07 provides the Finance-owned Purchase transaction and posting flow.
- Plan 06 explicitly defers bank statement and mutation import.

These are current behaviors. The phases below are [TARGET] and must not be
described as implemented until verified in code and tests.

## Phases

### Phase 9.1 — Guided manual reconstruction MVP [TARGET]

Provide one small Reconstruction overview that guides the owner through the
existing transaction workflows and makes progress visible. Do not build a
general-purpose import-batch engine in this phase.

Target behavior:

- The owner selects a history start and end date. The UI explains how the
  opening position relates to the first included transaction date, using the
  organization's Finance business-date rules. It does not assume every user
  starts on 1 April or starts with zero balances.
- A “Catat pembelian historis” action opens the existing Finance Purchase form
  with reconstruction context. The transaction retains its original purchase
  date and normal source/journal/inventory references. Reconstruction context
  must be searchable or filterable; it must not change ordinary purchase
  posting semantics.
- An “Import/perbarui order” action links to the existing Orders import or
  enrichment workflow. Finance posting remains gated by `organization.finance`
  and uses the existing source-event idempotency behavior.
- The overview shows selected period totals and statuses available from
  Finance: purchases, eligible orders, posted/blocked sales, released funds,
  and HPP posted/deferred. It links to the source workflow rather than copying
  its form or table behavior.
- A repeat import or retry cannot create duplicate sales, release, purchase,
  journal, or movement effects. Conflicting source data remains visible for
  review; it is not silently overwritten.
- The UI clearly labels the result as a partial reconstruction when only
  purchases and order activity have been entered. Missing expenses, owner
  funding, withdrawals, fee components not covered by successful release
  imports, refunds, and other events must not be implied to have been
  reconstructed.

Acceptance criteria:

- A user can follow one guided path while using the existing Purchase and
  Orders workflows.
- Finance-inactive organizations cannot create reconstruction records or
  Finance journals; basic Orders, Products, and Reports continue to work.
- The chosen history range and reconstruction marker can be reviewed after a
  refresh and are organization-scoped.
- Re-importing an already-processed order does not duplicate its Finance
  effects.
- Deferred HPP remains visible and is never presented as posted or estimated.

### Phase 9.2 — Deferred historical HPP recovery [TARGET]

Allow the user to retry HPP after historical purchases have established the
required valued stock, without editing the already-posted sales journal.

Target behavior:

- Provide a clearly named action such as “Coba proses HPP” on the Finance Sales
  record and/or Reconstruction overview. The action is owned by Finance, not
  the basic Orders page.
- Re-evaluate eligible deferred sale lines using Finance's documented moving
  average policy and the stock/value history available at the sale date. A
  purchase occurring after a sale must never supply cost to that earlier sale.
- If cost and stock are valid, create a separate balanced HPP journal and
  linked outbound inventory movement. Link both to the original sale source.
- Never edit or replace the posted revenue journal. If the historical stock
  chronology cannot support the HPP calculation, keep HPP deferred with a
  specific user-visible reason.
- Use stable idempotency keys and recoverable steps for standalone MongoDB;
  repeating the action must not duplicate the HPP journal or movement.

Acceptance criteria:

- A retry either posts one traceable HPP effect or remains safely deferred.
- Costing uses only eligible inventory history as of the sale date and respects
  the existing moving-average policy in ADR 0016.
- A retry does not mutate the order, original sales snapshot, or posted sales
  journal.
- Interrupted retries can resume without duplicate journal or movement
  records.

### Phase 9.3 — Reconstruction suspense and balance review [TARGET]

Make incomplete reconstruction differences visible and controllable without
pretending that unknown transactions have been identified.

Target behavior:

- Create or ensure at most one system-managed reconstruction suspense account
  per organization, using Finance-owned CoA data. Its final account grouping,
  normal-balance presentation, and creation timing must be confirmed before
  implementation.
- Allow the owner to enter a dated ending-balance snapshot for selected
  cash/bank and marketplace-balance accounts. Do not import bank mutations or
  infer payout-to-bank transfers.
- Compare that snapshot with the reconstructed ledger balance and show each
  unresolved difference and the aggregate suspense balance transparently.
- Any posted balancing/reconciliation entry must have an explicit
  reconstruction source, date, amount, account, and explanation. Suspense must
  not be used to force unsupported sales, fees, returns, or purchases through
  validation.
- Resolve a suspense item only with a new correcting/reclassification journal
  supported by the user's investigation. Never edit the original posted
  journal or silently sweep the balance to an arbitrary account.
- Show unresolved balances as provisional/incomplete. Do not call the
  reconstruction reconciled while an unacknowledged difference remains.

Acceptance criteria:

- Users cannot create duplicate suspense accounts or select the reconstruction
  account for ordinary transactions.
- The account balance and source-level unresolved items are visible and
  traceable to their reconstruction entry.
- Reconciliation adjustments are balanced, organization-scoped, idempotent,
  and append-only.
- A cleared suspense item has a traceable correcting journal and no longer
  contributes to the outstanding reconstruction balance.

### Phase 9.4 — Assisted purchase backfill and stronger review [TARGET]

Reduce manual entry only after the guided workflow and accounting behavior have
been tested. This phase is intentionally later than the minimal workflow.

Potential scope:

- bounded CSV/template import for historical merchandise purchases;
- preview and validation before posting;
- explicit product/inventory, payment, and account mapping;
- duplicate detection based on source references and transaction identity;
- per-row posted, blocked, or skipped status with safe retry;
- suspense aging indicators, reminders, and an explicit completion review.

This phase does not introduce OCR, bank-statement imports, or an alternate
order importer. Any dedicated order-history selection/backfill flow requires a
separate product decision; the current Orders import/enrichment path remains
the Plan 09 source for order events.

## Open decisions

- Exact boundary semantics for the opening-balance date versus the first
  reconstruction date, including Asia/Jakarta business-date handling.
- The smallest Finance-owned way to persist the selected date range and
  reconstruction marker without introducing a general batch/run engine.
- CoA type, parent group, code, normal-balance presentation, and initialization
  timing for the system-managed suspense account.
- Whether ending-balance review is per account, which account types it includes,
  and whether a user may finish with an explicitly acknowledged unresolved
  suspense balance.
- Whether suspense aging is informational only, has reminder thresholds, or
  blocks marking a reconstruction complete. No automatic expiry or automatic
  reclassification is assumed.
- Which CSV purchase source format and duplicate identity are supported in
  Phase 9.4.
- Required ordering and replay rules for recalculating moving-average HPP over
  already-posted historical sales.

## Not in scope

- Changing or replacing the existing Orders, Products, or Reports modules.
- A second transaction-entry form for purchases or imported orders.
- Automatically backfilling history during Finance onboarding.
- A general historical import engine for every accounting domain.
- Bank statement or bank mutation import and automatic bank matching.
- Reconstructing all expenses, owner contributions/withdrawals, packaging
  consumption, tax, returns/refunds, or unsupported marketplace fees in the
  initial phases.
- Editing/deleting posted journals or inventory movements.
- Financial statements and period closing; see deferred Plan 08.

## Relationship to the historical reconstruction PRD

`PRD — Historical Accounting Reconstruction.md` is a broader product/design
reference that describes a fuller batch, packaging, settlement, audit, and
reporting workflow. It is not evidence that those capabilities exist and does
not expand this plan's initial scope. Plan 09 is the smaller phased delivery
target for Finance; any broader PRD requirements must be reviewed and approved
before they are added to an implementation phase.
