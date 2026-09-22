# Finance Plan 06 — Cash and Bank

Status: [TARGET]

## Goal

Show cash and bank balances from Chart of Accounts and provide simple,
auditable transfers without implementing bank-feed or statement import.

## Principles

The account balance is derived from posted journal lines. Cash and Bank is an
operational view over eligible COA accounts, not a second ledger.

Transfers create a new source transaction and a balanced journal. Posted
journals are immutable.

## Phases

### Phase 6.1 — Cash and bank account view

Show eligible cash, bank, e-wallet, and marketplace balance accounts.

Acceptance criteria:

- only valid postable accounts are shown;
- current balance is derived consistently from posted entries;
- account details are tenant-scoped;
- opening balance behavior is visible.

### Phase 6.2 — Transfer transaction

Create a transfer form with source account, destination account, amount, date,
reference, and description.

Acceptance criteria:

- source and destination accounts are valid;
- transfer creates debit/credit lines with equal value;
- duplicate submissions are idempotent;
- transfer remains traceable to its journal.

### Phase 6.3 — Correction and usability

Support transfer detail, reversal/correction, pending/error states, and
practical account history.

Bank reconciliation and bank mutation import remain deferred. The existing
Rekonsiliasi Bank menu should not imply a full feature until its scope is
decided.

## Open questions

- Are marketplace balances included in the first Cash and Bank view?
- Should transfers support pending approval or post immediately?
- Which account metadata is required for a bank account?

