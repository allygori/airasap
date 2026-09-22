# Finance Plan 06 — Cash and Bank

Status: [CURRENT / IN PROGRESS]

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

Implementation status: [CURRENT]

- Finance reads eligible postable asset accounts from the existing COA. The
  first view includes `cash`, `bank`, `e_wallet`, and
  `marketplace_balance` subtypes; group accounts and receivables are excluded.
- Current balances are calculated from posted journal lines using each
  account's normal balance. Journal entries with status `reversed` are not
  counted; their separate reversal journal remains the traceable correction.
- Opening balance is displayed separately from the current balance by
  classifying posted journal lines whose source type is `opening_balance`.
- Accounts with no journal activity remain visible with a zero balance, so a
  newly created bank or cash account is not mistaken for missing data.
- Optional bank metadata is limited to safe display fields such as institution
  and last four digits. No full bank account number or bank statement data is
  introduced.
- The new API is `GET /api/v1/dashboard/finance/cash-and-bank` and the UI is
  `/dashboard/finance/cash-and-bank`. Both enforce the Finance activation
  guard and tenant context.

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

- [DECIDED] Marketplace balances are included because they are liquid-asset
  accounts already represented in the COA, but they remain visibly labeled as
  marketplace balances rather than bank cash.
- Should transfers support pending approval or post immediately?
- [DECIDED] Phase 6.1 only displays existing optional metadata: institution,
  last four digits, account holder, and provider. Full bank identity and
  statement import remain outside this phase.
