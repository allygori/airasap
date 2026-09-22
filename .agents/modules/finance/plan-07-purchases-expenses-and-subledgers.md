# Finance Plan 07 — Purchases, Expenses, Receivables, and Payables

Status: [TARGET]

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

