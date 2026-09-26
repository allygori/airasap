# Finance Plan 08 — Reports and Period Closing

Status: [IN PROGRESS — PHASE 8.1 IMPLEMENTED; PHASE 8.2 CORE STATEMENTS IMPLEMENTED, CASH FLOW POLICY PENDING]

## Start gate

This plan is intentionally deferred. Begin it after the product owner is
comfortable that the core Finance workflows are working reliably enough in
realistic development use. The gate should cover onboarding/opening balances,
sales source integration, journal posting and reversal, inventory/HPP where
applicable, cash/bank transfers, purchases/expenses, and settlements—including
retry behavior on standalone MongoDB. This does not require every future edge
case to be complete. Basic period close/posting guards already exist in the
core accounting plan; this plan adds the reports and broader close-readiness
workflow.

The gate does not require the deferred tax phase (Plan 07.4), full historical
reconstruction (Plan 09), bank-statement import, or every marketplace return
case to be implemented first. Instead, Plan 08 must clearly disclose unsupported
or incomplete source data and must not present provisional results as complete.

## Current baseline [CURRENT]

- Finance has server-rendered pages for Neraca Saldo, Laba Rugi, and Neraca,
  backed by organization-scoped posted-journal aggregations. These are read
  pages, not a new reporting API contract. Arus Kas remains pending the policy
  decision below.
- Posted journals are the general-ledger source of truth. Reversals create new
  journal entries; draft/blocked source work does not become a posted financial
  statement amount.
- The account-ledger read is capped at 5,000 matching lines. Financial reports
  must use purpose-built, date-bounded aggregations; they must not calculate
  statement totals from a truncated UI ledger response.
- The period service already supports explicit close and rejects later
  postings into a closed period. A missing period is implicitly open. The
  current close operation does not run a report-based readiness checklist or
  define a period-reopen workflow.
- Journal `period` and Finance period bounds use the organization's Finance
  calendar timezone. The timezone is selected in the opening-balance onboarding
  and stored under `organizations.finance.calendar_timezone`; legacy
  `organizations.accounting.calendar_timezone` is not used. The default is
  `Asia/Jakarta` (WIB), and a change is rejected after a Finance journal exists.
- A completed-order sales journal can be posted while its HPP remains
  `deferred`. The deferred status/reason is shown in Finance Sales, but there
  is no Finance financial report yet to warn that resulting profit/margin is
  incomplete.
- A supported released-funds posting debits a Marketplace Balance account;
  it does not mean the funds have reached a bank. Cash/Bank views derive
  balances from posted journal lines, and an actual withdrawal is a separate
  Finance transfer.
- Inventory movement history and current stock views exist. A dated inventory
  valuation report and its reconciliation to the inventory control account are
  not established by those views alone.
- Plan 09 is a future reconstruction workflow. Its suspense account and
  completeness indicators do not exist yet and are not prerequisites for the
  first Plan 08 phase.

## Goal

Expose reliable financial reports and basic period controls based on posted
Finance data.

## Phases

### Phase 8.1 — Reporting foundation [CURRENT — CALENDAR FOUNDATION IMPLEMENTED]

Define report periods, filters, account grouping, dimensions, authoritative
source data, and visible completeness warnings before implementing statement
totals.

Target data rules:

- Finance accounting periods and default report periods are monthly
  (`YYYY-MM`). The month boundaries use the timezone selected for this
  organization's Finance calendar, not the server's local timezone.
- The selected calendar timezone is persisted under
  `organizations.finance.calendar_timezone`; Finance never reads or writes the
  legacy `organizations.accounting.calendar_timezone` field. Onboarding
  defaults to `Asia/Jakarta` and saves the selection before finalization. A
  timezone change is rejected if any Finance journal exists; the current UI
  does not offer a post-activation settings screen.
- Laba Rugi, Neraca, and Neraca Saldo derive from Finance posted journal lines.
  Source projections may provide labels and operational status, but must not
  silently replace the posted-ledger amount.
- A reversed original journal is excluded from effective posted balances; its
  separately posted reversal remains traceable and contributes the correcting
  effect. Draft and blocked records are excluded from statements.
- Treat `source_type`, `source_id`, and `source_event` as the trace identity.
  One order may have separate completed-sale, released-funds, HPP, or correction
  journals; a report must not assume one journal per order.
- Show deferred HPP as missing cost, not zero cost. Profit, gross margin, and
  stock margin affected by deferred HPP must be marked incomplete/provisional
  and expose the affected transaction count, related sales value, and reasons;
  do not invent an HPP amount.
- Separate cash/bank from marketplace balances. Released funds remain in the
  marketplace balance until a separately recorded transfer; do not show them
  as bank receipts. Whether marketplace balances are included in a cash-flow
  statement is a policy decision, not an assumption.
- Inventory valuation is based on posted Finance inventory movements at the
  report's as-of date and must be reconcilable to the Finance inventory
  control-account balance. Missing or deferred costing must be surfaced.
- If Plan 09 is implemented, show any reconstruction suspense balance and
  unresolved state explicitly. Reports can be built before Plan 09, and must
  not assume that its records exist.
- Report dimensions and source drill-down remain organization-scoped. Existing
  application Reports and their contracts are not replaced or changed.

Acceptance criteria:

- [x] monthly Finance journal period keys and close-period UTC boundaries use
  the organization's Finance calendar timezone, with month-boundary tests;
- [x] the timezone is organization-scoped and independent from legacy
  Accounting settings, with an Asia/Jakarta default;
- [x] onboarding persists the selected timezone and rejects a change after the
  first Finance journal exists;
- [x] month-end period bounds are deterministic and independent of the server's
  local timezone.

The posted-ledger, traceability, tenant-filtering, and completeness rules above
remain binding report contracts. Their implementation is verified with the
statement and operational reports in Phases 8.2 and 8.3, not by this calendar
foundation.

### Phase 8.2 — Core financial statements

Implement the first versions of:

- Neraca Saldo (trial balance), as the debit/credit and account-mapping
  verification surface;
- Laba Rugi;
- Neraca;
- Arus Kas.

All statements must drill down to journal detail and source events. The exact
cash-flow method, treatment/presentation of marketplace balances, comparative
period behavior, and behavior before the selected history start date remain
open. The report must not claim historical coverage before the available
opening position/source history.

Current implementation notes:

- Neraca Saldo shows cumulative account balances through the selected month;
  Laba Rugi shows activity within that month; Neraca shows cumulative balances
  through month-end in the organization's Finance timezone.
- Debit-normal contra-revenue balances (such as discounts/returns) reduce
  reported revenue. Balance-sheet equity includes cumulative unclosed
  profit/loss because this phase does not create closing journals.
- The pages are rendered on the server and read the Finance module directly;
  no database access is performed by the client component.
- Each account amount links to the organization-scoped General Journal with
  the corresponding month/account filters. Deferred HPP is shown as an
  explicit warning with affected transaction count, related sales amount,
  and recorded reasons; no HPP value is fabricated.
- The Finance start date is shown as a history-coverage notice. It is not
  treated as proof that source history before that date is complete.

Acceptance criteria:

- [x] Neraca Saldo, Laba Rugi, and Neraca use date-bounded, organization-scoped
  aggregations over posted Finance journal lines rather than the 5,000-line
  ledger UI cap;
- [x] reversed original journals are excluded while separately posted
  reversals remain traceable and contribute the correcting effect;
- [x] account rows drill down to matching posted journal entries, which link
  to journal details and their source events;
- [x] deferred HPP is identified as incomplete/provisional and does not get
  reported as zero cost;
- [ ] implement Arus Kas after the cash-flow method and marketplace-balance
  presentation policy are confirmed;
- [ ] decide comparative-period behavior and how to present periods before the
  available opening position/source history.

### Phase 8.3 — Operational and tax reports

Implement:

- Laporan Penjualan Finance, with separate source-event visibility for sale
  recognition and released funds;
- Laporan Stok dan Margin, with as-of quantity/value and explicit deferred-HPP
  indicators;
- Laporan Pajak only after Plan 07.4 is explicitly resumed and the relevant
  tax posting rules are implemented.

The existing operational Reports remain separate and are not replaced. Finance
operational reports must reconcile their accounting amounts to posted journals
where the value is presented as an accounting result.

Acceptance criteria:

- deferred HPP is shown as incomplete/provisional, not as zero cost;
- marketplace balances remain distinct from bank cash until an explicit
  Finance transfer is posted;
- inventory valuation is based on posted Finance movements at the selected
  as-of date and can be reconciled to the inventory control account;
- unresolved reconstruction balances are shown only if Plan 09 records exist.

### Phase 8.4 — Closing books

Close one calendar month (`YYYY-MM`) at a time using the organization's Finance
calendar timezone. The owner starts the close; the system presents a
pre-close report/checklist and clear period status. Do not rebuild the
already-implemented basic close and posting rejection behavior.

This phase closes and locks the posting period; it does not yet create automatic
closing journals that transfer revenue/expense balances to retained earnings.

Acceptance criteria:

- pre-close review shows trial-balance integrity, deferred HPP, blocked or
  pending Finance source events, open receivables/payables, and—when Plan 09
  exists—unresolved suspense/reconstruction state;
- the review distinguishes informational open balances from actual blockers;
- a closed period continues to reject new operational postings through the
  existing Finance service guard;
- correction path is explicit;
- close validation reports blockers and warnings before the owner confirms;
- closing creates an auditable status, while any reopen policy remains
  restricted and must be decided before implementing reopen behavior.

### Phase 8.5 — Scheduled closing journals [TARGET — FUTURE]

Add a separate scheduler-driven workflow for automatic closing journals after
the period-close and reporting controls are established. This is not part of
the initial monthly reporting release.

Target behavior:

- The scheduler follows the organization's Finance calendar timezone and an
  explicitly configured closing cadence.
- It runs close-readiness checks before creating entries. A failed check must
  leave the period/year open and provide a visible reason for retry or review.
- It creates an immutable, balanced journal to close eligible temporary
  revenue and expense balances to the designated retained-earnings account;
  it does not edit source journals.
- A stable organization-and-period idempotency identity prevents duplicate
  closing journals after scheduler retries or process restarts.
- Successful completion records the closing result and applies the agreed
  period/year lock. Corrections use an explicit reversal or correcting entry,
  never an edit to a posted closing journal.

The cadence (monthly, annual, or both), fiscal-year boundary, approval/override
behavior, and scheduler recovery/notification policy remain open decisions.

## Open questions

- Should cash flow use the direct or indirect method, and are marketplace
  wallet balances cash equivalents or a separately presented balance?
- Should deferred HPP, blocked releases, and unacknowledged reconstruction
  suspense block closing, or appear as warnings requiring explicit owner
  acknowledgement?
- Is comparative reporting required for the first release?
- Which tax reports are needed after Plan 07.4 resumes, and for which supported
  tax scenarios?
- Can a closed period be reopened, who may do it, and should corrections use a
  later adjustment period instead?
- Should scheduled closing journals run monthly, annually, or both? What
  fiscal-year boundary, review/override step, and failed-run notification are
  required?
- How should reports label periods before the organization's opening balance
  or before complete source history is available?

## Not in scope

- tax filing submission;
- bank statement reconciliation;
- foreign-exchange conversion or multi-currency consolidation;
- replacing the existing operational Reports module;
- assuming Plan 09 historical reconstruction is complete or available.
