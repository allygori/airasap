# Finance Plan 10 — Owner Withdrawals

Status: [CURRENT / Phases 10.1–10.2 implemented; manual browser review pending]
Phase 10.2: [CURRENT / IMPLEMENTED; manual browser review pending]
Phase 10.3: [FUTURE / NOT IMPLEMENTED]

## Goal

Provide a small, traceable Finance workflow to record money withdrawn by an
owner from the business when the transaction is an owner drawing from equity—
not an operating expense or employee payroll. Start with the current
small-business scenario and keep the design honest about which entity and
transaction types it supports.

## Boundary

- Finance remains optional. The workflow is available only to organizations
  with Finance active and is organization-scoped.
- This plan records an owner withdrawal that the user has already classified
  and authorized. It does not determine legal authority, distributable profit,
  tax treatment, or whether a payment is legally a dividend, salary, loan, or
  another transaction.
- The initial workflow is limited to a simple owner drawing posted to an
  existing Finance CoA account with subtype `owner_drawings`.
- It does not introduce an employee, payroll, supplier, or owner master-data
  collection. Products and Reports are not changed by this plan.
- It is separate from the Expense workflow: a genuine owner drawing must not
  reduce operating profit as an expense.
- Posted journal lines and amounts are never edited. Finance's reversal
  lifecycle may mark the original journal status as `reversed` and creates a
  separate posted reversal journal.

## Confirmed product direction

- The user's current business is not incorporated; two co-owners take small,
  regular monthly amounts from business profit. There are no employees, and
  the amounts described are not repayments of owner capital.
- The monthly cadence does not by itself make a payment salary. The MVP treats
  only a payment the user identifies as an owner drawing as an equity
  transaction; work compensation and formal-entity distributions are not
  inferred from the recipient or payment frequency.
- CoA seed `finance-account.seed.json` currently includes the non-postable
  parent `3300 Prive dan Distribusi Pemilik` and postable accounts `3310 Prive
  Pemilik 1` and `3320 Prive Pemilik 2`, both with subtype `owner_drawings`.
  Phase 10.1 offers eligible active/postable accounts from this Finance CoA;
  the seed accounts do not introduce separate owner master data.
- Supplier relationships, if added later, belong with Finance inventory
  items rather than marketplace listing documents in Products. Supplier
  management is unrelated to this plan and remains out of scope here.

## Accounting behavior

For an eligible owner drawing that has been paid from a business Cash or Bank
account, the intended journal is:

| Account | Debit | Credit |
| --- | ---: | ---: |
| Selected owner-drawings equity account | Withdrawal amount | — |
| Selected Cash or Bank account | — | Withdrawal amount |

This reduces cash and the owner's equity balance, not operating profit. The
workflow must not cap the amount using a simplistic “available profit” check:
the ledger may not contain complete history, and the product is not deciding
legal distributability. It may show relevant balances for context only when
clearly labelled as informational.

The initial workflow is for cash/bank payments that have actually left the
business account. Marketplace balances, unsettled receivables, and employee
compensation are not interchangeable with a paid owner withdrawal.

## Phases

### Phase 10.1 — Minimal owner-withdrawal transaction [CURRENT / IMPLEMENTED]

Phase 10.1 adds a Finance-owned source transaction and a focused form for
recording one owner withdrawal at a time. The workflow follows Finance's
existing draft-then-post transaction pattern and shared composed-form
conventions.

Implemented behavior:

- Capture transaction date, owner-drawings CoA account, Cash/Bank account,
  amount, and optional description/reference.
- Explain in the form that this workflow records an owner drawing only; it is
  not for salary, formal dividends, or owner loans, and it does not assess
  whether an amount is legally distributable.
- Offer active, postable accounts with subtype `owner_drawings` and active
  Cash/Bank accounts belonging to the same organization. Do not assume that
  only the two seeded owner accounts can ever be used; behavior for additional
  owners must follow the supported Finance CoA account-creation capability.
- Create an organization-scoped Finance source record, for example in
  `finance_owner_withdrawals`, then post one balanced journal with stable
  idempotency and standalone-MongoDB-safe recovery.
- Keep draft creation free of ledger effects. Posting reduces the selected
  cash/bank balance and records the debit to owner drawings; it must not create
  an expense or payroll payable.
- Respect Finance access, tenant scope, date/calendar rules, closed-period
  guards, and existing API/error conventions.
- Provide a visible journal reference after posting. Do not allow editing or
  deletion after posting.
- Include a compact, bounded recent-activity list so users can retry a saved
  draft after an interrupted post and open its journal. This is operational
  recovery/traceability only; Phase 10.2 still owns date/account filters,
  period totals, and correction workflows.

Implementation locations:

- Source model/repository/service: `modules/finance/owner-withdrawals/`.
- UI: `/dashboard/finance/owner-withdrawals`.
- API: `/api/v1/dashboard/finance/owner-withdrawals` and its
  `/:withdrawalId/post` action.
- Source records and journals use stable idempotency keys; posting is
  retry-safe on standalone MongoDB without a multi-document transaction.

Acceptance criteria:

- A posted withdrawal creates exactly one balanced journal and one source
  record; a retry cannot duplicate either effect.
- The resulting entry reduces the selected Cash/Bank account and increases
  the debit balance of the selected owner-drawings account, without changing
  revenue or expense totals.
- Finance-inactive organizations cannot create or post the transaction.
- A closed period rejects posting using the existing Finance lifecycle rule.
- An interrupted standalone MongoDB posting can be retried safely.

### Phase 10.2 — Withdrawal history and correction [CURRENT / IMPLEMENTED]

Make recorded withdrawals easy to review and correct without changing posted
journal lines or amounts. Finance's existing reversal lifecycle changes the
original journal status to `reversed`; the original entry's accounting lines
remain intact, and the reversal is a separate posted journal.

Implemented behavior:

- Provide a paginated list with date, owner-drawings account, amount,
  payment account, status, and journal links. The UI defaults to the current
  and preceding 11 Finance calendar months; users can select a range up to
  five years and optionally filter by owner-drawings account.
- Show monthly debit, credit, and net debit totals grouped by Finance journal
  period and owner-drawings account. The numbers are posted journal movements,
  not a calculation of legally distributable profit. Credits may include
  reversal/correction entries.
- Allow reversal of a posted withdrawal with an effective date in an open
  Finance period and a required reason. Use the Finance journal reversal
  workflow; never edit or delete the original journal lines.
- Link the Finance-owned withdrawal source to its original and reversal
  journals. Reversals initiated from the general-journal action also update
  the linked withdrawal source status and reversal link.
- Keep draft withdrawals postable; a reversed withdrawal cannot be posted
  again. To correct its details, reverse it and create a replacement
  withdrawal if appropriate.

Acceptance criteria:

- A user can filter and paginate withdrawals and trace each posted source to
  its original journal and, when reversed, its separate reversal journal.
- Reversal leaves the original journal lines and amounts intact, marks its
  lifecycle status as reversed according to the existing Finance workflow,
  and creates a separately traceable posted journal.
- Reversal is retry-safe on standalone MongoDB: a retry cannot create another
  reversal journal, and a source update can recover from a prior journal
  reversal that succeeded while source finalization failed.
- Monthly totals match the posted journal debit/credit lines for the selected
  owner-drawings accounts and date range; they are not expenses in Profit and
  Loss and are not presented as distributable profit.

### Phase 10.3 — Broader owner and entity scenarios [FUTURE / DISCOVERY]

Do not implement until users' needs and accounting treatment are clarified for
additional ownership and legal-entity cases.

Potential topics for a separate reviewed scope:

- More owners than the initial seeded accounts and how owner identity relates
  to organization membership and CoA subaccounts.
- Formal profit distributions that are declared before payment and may require
  a distribution payable lifecycle.
- Owner/director compensation for work, payroll, owner loans, and repayments;
  these must not be conflated with owner drawings.
- Any approval, tax, disclosure, or entity-specific reporting requirements.

This phase is not a prerequisite to Phases 10.1–10.2 and must not be treated as
implemented or as legal/accounting advice.

## Open questions

- Should the payment account remain limited to Cash/Bank, or should a later
  phase support other balance accounts when money is actually withdrawn from
  them?
- Does the existing Finance CoA workflow let an organization create additional
  postable `owner_drawings` accounts, and if so, what should happen when there
  are more owners than seeded accounts? This remains for Phase 10.3 discovery.

## Not in scope

- Employee, payroll, salary, or compensation management.
- Declaring/calculating dividends or determining legally distributable profit.
- Owner loans, capital contributions, capital repayments, or shareholder
  approval workflows.
- Automatically inferring transaction classification from owner identity,
  date, amount, or monthly repetition.
- Editing/deleting posted journals, or changing Orders, Products, or Reports.
- Supplier master data or supplier-to-Product relationships.
