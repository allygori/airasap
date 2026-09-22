# Finance Plan 04 — Sales and Order Integration

Status: [TARGET]

## Goal

Allow Finance to create sales transactions and journals from the existing
Orders/importer flow without replacing the Orders module.

## Boundary

Orders remains the operational source of truth. Finance stores its own
transaction/reference data only as needed for financial posting and traceability.

The old importer must continue to import orders when Finance is disabled.

## Implementation progress

### Phase 4.1 — [CURRENT] Finance sales projection and adapter

Finance now owns a narrow sales-source contract and a pure projection adapter.
It copies only the order fields needed for future financial posting and
traceability: source order identity, organization/store, platform, source
status, dates, monetary totals, and line-level product references/cost data.
The adapter reports `ready` or `incomplete` with actionable data-shape issues,
but it does not choose eligible order statuses, post journals, or mutate the
Orders collection. Those decisions remain in later phases.

## Phases

### Phase 4.1 — Finance sales projection and adapter

Create the Finance-side sales contract and a narrow adapter from existing order
data/import results.

Acceptance criteria:

- Finance does not duplicate the canonical order master;
- the adapter accepts the existing order shape through an explicit boundary;
- old accounting side effects are not copied accidentally;
- source order ID is retained for traceability.

### Phase 4.2 — Sales posting rules

Define which order event creates which accounting result.

Candidate events:

- completed order: revenue, receivable, and inventory/HPP impact;
- released funds: marketplace receivable to marketplace balance;
- payout: marketplace balance to cash or bank;
- return/refund: reversal or correcting financial event.

The exact order status mapping is an open product decision.

### Phase 4.3 — Automatic and manual modes

Support the agreed posting modes:

- Finance disabled: no Finance transaction or journal;
- Finance enabled and automatic: eligible events attempt posting;
- Finance enabled and manual: eligible events remain pending until posted.

Posting failures must not fail the underlying order import. They become
blocked Finance work with a safe retry path.

### Phase 4.4 — Status, retry, and reconciliation behavior

Implement and verify pending, posted, blocked, and reversed states.

Acceptance criteria:

- repeated import is idempotent;
- repeated posting does not create duplicate journal entries;
- blocked records explain the actionable reason;
- retry does not silently change the source order;
- Finance can trace the resulting journal and inventory effects.

## Open questions

- Which exact order statuses are eligible?
- Should Finance post automatically by default or require an organization
  choice?
- Should already-imported eligible orders be backfilled?
- Should released funds and payout be included in the first sales release?

## Not in scope

- replacing order import parsers;
- changing order status semantics;
- redesigning Products;
- marketplace-specific settlement features beyond the agreed first slice.
