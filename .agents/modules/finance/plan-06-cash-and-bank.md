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

Implementation status: [CURRENT]

- A Finance-owned transfer source transaction is stored in the new
  `finance_cash_bank_transfers` collection before journal posting. It keeps
  both COA account snapshots, amount, date, reference, description, status,
  and journal link for traceability.
- Only active, postable COA asset accounts with subtype `cash`, `bank`,
  `e_wallet`, or `marketplace_balance` may be selected. Source and destination
  must be different accounts.
- The transfer journal is balanced as Dr destination / Cr source and uses its
  own source type and idempotency key. The source transaction and journal are
  created or finalized in one database transaction at the API boundary.
- The API is `POST /api/v1/dashboard/finance/cash-and-bank-transfers` and the
  form is `/dashboard/finance/cash-and-bank-transfers`.
- Repeating a request with the same idempotency key and payload returns the
  existing transfer without creating another journal. Reusing the key with a
  different payload is rejected.
- Transfers post immediately. Approval queues, bank statement import, and
  reconciliation remain outside this phase.

### Phase 6.3 — Correction and usability

Support transfer detail, reversal/correction, pending/error states, and
practical account history.

Bank reconciliation and bank mutation import remain deferred. The existing
Rekonsiliasi Bank menu should not imply a full feature until its scope is
decided.

Implementation status: [CURRENT]

- Transfer history is available from the transfer page with tenant-scoped
  list, search, status filter support, and a transfer detail endpoint.
- Transfer source transactions expose `pending`, `posted`, and `reversed`
  states. A pending record remains retryable when journal finalization is
  interrupted; the API reports finalization conflicts instead of silently
  marking the transfer complete.
- A posted transfer is corrected by creating a new reversal journal. The
  original journal is never edited, and the transfer stores the reversal
  journal link with status `reversed`.
- Reversal is available through a dedicated transfer endpoint. Reversing the
  source journal through the general journal endpoint also synchronizes a
  matching Finance transfer record when one exists.
- The UI exposes links to the transfer detail and source journal, and shows a
  reversal action only for posted transfers. No bank statement import or
  reconciliation workflow is introduced.

## Open questions

- [DECIDED] Marketplace balances are included because they are liquid-asset
  accounts already represented in the COA, but they remain visibly labeled as
  marketplace balances rather than bank cash.
- [DECIDED] Transfers post immediately in the initial release. Approval flow
  can be added later if the operating workflow requires it.
- [DECIDED] Phase 6.1 only displays existing optional metadata: institution,
  last four digits, account holder, and provider. Full bank identity and
  statement import remain outside this phase.
