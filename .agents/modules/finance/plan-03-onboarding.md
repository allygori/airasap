# Finance Plan 03 — Onboarding

Status: [CURRENT / IMPLEMENTED]

## Goal

Provide a guided but practical setup flow for activating Finance for one
organization.

The onboarding must establish a reliable opening position before normal
Finance transactions begin. It is intentionally small enough for sellers and
UMKM users, but it must not create an opening journal that cannot be traced to
cash, inventory, or outstanding obligations.

The attached reference `List_Opening_Balance_Toko_Online.md` is used as a
product reference, not as a requirement to expose every possible account in
the first release.

## Reuse direction

The old accounting onboarding UI components and relevant validation or
preview logic may be reused after review. The Finance onboarding service,
contracts, and activation behavior must be explicit and must not inherit
unneeded legacy complexity automatically.

Reuse means copying and adapting useful behavior into the Finance boundary.
Finance must not depend on the legacy accounting module remaining installed.

## Implementation progress

### Phase 3.1 — [CURRENT] Readiness and setup state

Finance now exposes a server-computed readiness contract alongside the
organization-owned lifecycle state. It reports the effective state for the
current actor, owner access, whether start or resume is allowed, and stable
blocker codes. Starting an already in-progress onboarding remains idempotent,
and the onboarding page can reload the saved state without losing progress.

The persisted Finance state supports `blocked` and an optional
`blocked_reason`; final activation and the configuration steps remain in the
later onboarding phases. This phase does not introduce a second database
connection, authentication path, tenant context, or response envelope.

## Phases

### Phase 3.1 — Readiness and setup state

Show whether Finance is not started, in progress, blocked, or active.

Acceptance criteria:

- basic Orders, Products, and Reports remain usable in every non-active state;
- onboarding can resume safely;
- activation is idempotent;
- blockers come from the server, not hardcoded UI assumptions.

### Phase 3.2 — Required setup and opening balance draft [CURRENT / IMPLEMENTED]

Define the smallest setup that produces a meaningful opening position. Currency
and accounting timezone are not required in the first Finance release. The
current product does not need them to establish the initial ledger, and adding
them here would make onboarding look more complete without solving an actual
seller problem.

Required setup:

- a Finance cut-off date;
- a usable Finance Chart of Accounts template or existing COA selection;
- confirmation that Finance should be activated after validation;
- an explicit opening-balance choice: enter balances now or start at zero.

When the user chooses to enter balances, the first-release core is:

- Kas, Bank, E-wallet, and marketplace/payment-gateway balances, entered per
  mapped postable account;
- inventory entered per Finance item and location with quantity and unit cost,
  rather than as one unsupported total;
- supplier payables entered as one or more opening items with supplier or
  reference text, so they can be shown and settled later;
- Modal Pemilik as the user-provided equity input;
- Saldo Laba/retained earnings as a system-calculated balancing equity amount.

The UI should allow an explicit zero or “not used” choice for a category that
does not apply. Missing values must not silently become zero. Revenue,
expenses, tax balances, and historical order reconstruction are not opening
balance inputs.

The following remain optional or deferred: opening receivables, advances or
deposits, fixed assets and accumulated depreciation, other liabilities, VAT,
loans, and prive. Opening receivables may be entered only with a counterparty
or reference; an aggregate value without a source is not settlement-ready.

Implementation status:

- Finance-owned opening balance draft contracts, persistence, and server-side
  validation are implemented under `modules/finance/onboarding`.
- The draft endpoint is `GET/PUT
  /api/v1/dashboard/finance/onboarding/opening-balance`.
- The onboarding UI now supports cut-off date, explicit entered/zero mode,
  cash and bank balances, detailed inventory lines, payable/receivable draft
  lines, and owner capital input.
- Saving a draft does not create a journal, inventory movement, subledger
  source, or active Finance state.

### Phase 3.3 — Opening balance validation and finalization [CURRENT / IMPLEMENTED]

Validate the draft opening position, create its Finance effects atomically, and
then make future Finance routes available.

Acceptance criteria:

- the cut-off date is present; every account referenced by an entered opening
  balance is active, postable, and of the expected account role;
- choosing “start at zero” creates no journal or movements and does not require
  journal account mappings;
- the opening draft is balanced using permanent accounts only: assets,
  liabilities, and equity;
- inventory opening lines create traceable Finance inventory movements linked
  to the opening journal; the valuation is based on the entered quantity and
  unit cost;
- supplier payable and optional receivable opening items retain their source
  label/reference so the subledger can display them;
- the system creates one idempotent opening batch for an organization,
  cut-off date, and onboarding version. The batch produces a balanced journal
  with `source_type: opening_balance` and any required inventory or subledger
  records;
- choosing “start at zero” is stored as an explicit decision and does not
  create misleading non-zero entries;
- a posted opening journal and its related movements are immutable. A mistake
  is corrected with a reversal or a separate adjustment transaction, not by
  editing posted lines;
- activation does not mass-post old orders implicitly. Order posting is
  attempted only by the Finance-aware import flow when Finance is active;
- incomplete setup cannot activate Finance, and refresh or retry cannot
  duplicate the opening batch.

Implementation status:

- The server preview validates account roles, opening totals, inventory
  valuation, and source labels before the user confirms finalization.
- One Finance journal is posted for an entered opening balance. Inventory
  movements and per-source opening payable/receivable items are created in the
  same MongoDB transaction and linked to that journal.
- Opening subledger items retain a distinct source-item ID, so settlement
  totals remain separate even though those items share one opening journal.
- Finalization records the batch state and cut-off date on the organization,
  activates `organization.finance`, and is safe to retry. The explicit
  zero-start choice records a skipped opening batch and activates Finance
  without ledger entries.
- Posted journal and movement records are not editable through onboarding.
  This phase does not seed or migrate Chart of Accounts data; Finance uses the
  available Finance COA adapter and validates any accounts used by the opening
  input.

Period locking before the cut-off date, tax setup, and financial reporting are
deliberately outside this phase. The cut-off date is still required as the
reference point for the opening batch; it must not be described as a complete
historical period-locking feature until that control is implemented.

## Open questions

- Should Finance provide its own account-template seeding for organizations
  that do not already have usable COA records, or is the existing COA adapter
  and data lifecycle sufficient after legacy Accounting is removed?

## Not in scope

- historical reconstruction;
- bank statement import;
- advanced tax setup;
- currency and timezone configuration;
- automatic migration of legacy accounting opening balances;
- replacing existing organization/store setup.
