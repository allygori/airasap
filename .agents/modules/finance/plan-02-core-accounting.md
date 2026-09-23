# Finance Plan 02 — Core Accounting and Journal Contract

Status: [TARGET]

## Goal

Establish the minimum double-entry accounting core used by all Finance
transactions, with Finance-owned persistence and contracts.

## Reuse direction

The old account taxonomy is a reference for the Finance-owned default template.
Finance owns the account model, repository, seed lifecycle, and API contract;
no runtime import from `modules/accounting` is permitted. New Finance concepts
must not be forced into a legacy persistence contract.

## Implementation progress

### Phase 2.1 — [CURRENT / IMPLEMENTED] Finance-owned Chart of Accounts

Finance now exposes its own account filter, response DTO, service, repository,
model, and route under the Finance namespace. Finance persists its own chart in
`finance_accounts` and owns the default template in
`finance-account.seed.json`; the template is initialized idempotently when an
organization owner starts Finance onboarding. No Accounting model, service,
resolver, or collection is used at runtime. The Finance contract exposes
hierarchy depth and an explicit `is_selectable` flag, which is true only for
active, postable accounts. Role-based account mapping is intentionally not
persisted in this phase and remains part of onboarding design.

### Phase 2.2 — [CURRENT] Operational journal posting contract

Finance now owns a new `finance_journal_entries` collection and posting
service. Operational posting requires balanced lines, active/postable account
references, explicit source fields, and an idempotency key. A retry with the
same key and payload replays the existing entry; the same key with a different
payload returns a conflict. Manual journal entry, reversal, and closed-period
behavior remain separate lifecycle work.

### Phase 2.3 — [CURRENT] Lifecycle and correction behavior

Finance now owns accounting periods in `finance_accounting_periods`. A period
without a materialized record is implicitly open; an explicit close creates or
closes the period, and later posting is rejected. Reversal creates a new
balanced journal with swapped debit/credit lines, then transitions the original
entry to `reversed` without editing its lines. Draft, blocked, and voided
states are reserved for later onboarding/import and manual-journal workflows.

### Phase 2.4 — [CURRENT] Core read APIs and accounting surface

Finance now exposes tenant-scoped journal list, journal detail, and account
ledger reads. The journal list supports bounded pagination and filters for
period, status, source type, and text search. Journal detail joins account
metadata through the Finance account boundary so the UI can trace each line
without depending on the legacy accounting explorer. Ledger reads calculate a
normal-balance running balance and expose a bounded result indicator for very
large histories.

## Phases

### Phase 2.1 — Chart of Accounts contract

Define the Finance account taxonomy, default tree, postability rules, and
account roles needed by Finance transactions.

Acceptance criteria:

- account hierarchy supports the Finance menu requirements;
- account selection validates active and postable accounts;
- Finance owns a separate account collection and an organization-scoped
  default account template;
- account selection validates active and postable Finance accounts;
- logical roles resolve from Finance account subtypes before fallback codes;
- Finance's account code imports no legacy Accounting module.

### Phase 2.2 — Journal posting contract

Define the new Finance posting input and source reference contract.

Acceptance criteria:

- posted entries are balanced;
- source type, source ID, source event, and idempotency are explicit;
- journal posting is tenant-scoped;
- duplicate retries are safe;
- manual journal is separated from operational posting.

### Phase 2.3 — Lifecycle and correction behavior

Define draft, posted, blocked, reversed, and voided behavior where applicable.

Acceptance criteria:

- posted journal lines cannot be edited in place;
- correction creates a reversal or a new correcting transaction;
- closed periods reject new postings;
- predictable domain errors have stable codes.

### Phase 2.4 — Core read APIs and accounting surface

Expose the minimum account, journal, and ledger reads required by the Finance
UI and later transaction plans.

Acceptance criteria:

- reads are tenant-scoped and paginated where needed;
- account and journal details can be traced back to the source transaction;
- no old accounting explorer route is required by Finance.

## Open questions

- Is manual journal available in the first release or only after operational
  posting is stable?

## Not in scope

- tax calculations;
- bank statement matching;
- full historical reconstruction;
- automatic closing entries.
