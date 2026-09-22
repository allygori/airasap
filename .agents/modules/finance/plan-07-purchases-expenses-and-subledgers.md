# Finance Plan 07 — Purchases, Expenses, Receivables, and Payables

Status: [CURRENT / IN PROGRESS]

## Goal

Create the Finance transaction workflows for purchases, direct expenses,
outflows, receivables, and payables without reusing the legacy Expense module
as the new source of truth.

## Boundary

The old Expense module is a legacy reference only. New Finance expense and
outflow contracts are Finance-owned.

Purchases, expenses, payments, and receipts must be distinguishable. A
transaction that creates a payable must not be treated as if it were already
paid.

## Phases

### Phase 7.1 — Purchase transaction

Define purchase document, supplier reference, line items, tax treatment if
needed, inventory impact, and payable or cash impact.

Acceptance criteria:

- purchase can be draft and posted;
- purchase posting is linked to inventory or expense classification;
- payment timing is explicit;
- duplicate import or submission is safe.

Implementation status: [CURRENT]

- The new Finance purchase source transaction is stored in the
  `finance_purchases` collection. It is separate from the legacy Expense
  module and does not change Orders, Products, Reports, or their importers.
- A purchase starts as `draft`. Draft creation only validates and snapshots
  inventory item/location data; it does not create a journal or change stock.
- Posting creates a balanced journal and one posted `purchase` inventory
  movement per line in the same database transaction. Inventory lines are
  limited to active items that track both quantity and value.
- Payment timing is explicit: `paid` credits a selected active Cash, Bank,
  E-wallet, or Marketplace Balance account; `payable` credits the configured
  Accounts Payable account (subtype `accounts_payable`, with `2100` as the
  compatibility fallback). A payable purchase is not treated as paid.
- Supplier data is transactional (`supplier_name` and
  `supplier_reference`); no supplier master is introduced in this phase.
- Request idempotency is stored on the purchase and journal/movement keys are
  derived from the purchase id. Repeating the same request replays the
  existing source transaction instead of creating duplicate effects.
- The API surface is `GET/POST /api/v1/dashboard/finance/purchases`,
  `GET /api/v1/dashboard/finance/purchases/:purchaseId`, and
  `POST /api/v1/dashboard/finance/purchases/:purchaseId/post`. The UI is
  `/dashboard/finance/purchase` with a detail view under the same path.
- Tax fields, partial settlement, supplier master data, purchase invoice vs
  goods-receipt separation, and direct operating expenses remain outside this
  phase.

### Phase 7.2 — Expense and outflow transaction

Define direct operating expense and cash outflow without depending on the old
Expense model.

Acceptance criteria:

- expense category maps to a valid account;
- payment account is optional when the transaction creates a payable;
- attachments or notes are optional and bounded;
- posted expense is traceable to a journal.

### Phase 7.3 — Receivable and payable balances

Provide minimal outstanding balance views and settlement actions.

Acceptance criteria:

- receivable and payable source documents are identifiable;
- partial and full settlement behavior is defined;
- balances agree with the journal;
- overdue behavior is explicit.

### Phase 7.4 — Basic controls and tax inputs

Add only the tax and control fields required by the first release.

Acceptance criteria:

- tax is not silently mixed into revenue, expense, or inventory value;
- required evidence and references are explicit;
- unsupported tax scenarios fail safely rather than produce misleading reports.

## Open questions

- Is supplier/customer master data required now or can names remain transactional?
- Are partial payments needed in the first release?
- What tax scenarios are actually required for target sellers?
- Should purchase invoices and goods receipt be separate workflows?

## Not in scope

- deletion of historical legacy expense data;
- payroll;
- advanced procurement approval;
- recurring bills.
