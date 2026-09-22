# ADR 0010: Finance Sales Source Boundary

- Status: [CURRENT]
- Date: 2026-09-22
- Scope: Finance sales/order integration Phase 4.1

## Decision

Finance defines its own normalized sales-source contract under
`modules/finance/sales`. The contract retains the source order ID and order
number, organization/store, platform, source status, dates, monetary totals,
and line-level product references and costs needed by later posting and COGS
work.

The adapter is pure and produces either a `ready` or `incomplete` projection
with explicit data-shape issues. It does not import the Orders or Products
module, mutate their collections, decide which order statuses are eligible, or
post a journal.

## Rationale

Orders and Products remain the operational source of truth, while Finance must
remain removable and independently evolvable. Copying the narrow boundary into
Finance prevents legacy accounting side effects from entering the new flow and
keeps the product/status decision available for discussion in Phase 4.2.

## Consequences

- Existing Orders, Products, Reports, and importers are unchanged.
- An importer or future Finance orchestration service must explicitly map its
  source snapshot into the Finance contract.
- Currency defaults to IDR at the transaction boundary; it is not an
  onboarding question in this phase.
- Posting, retry, blocked state, and persistence are intentionally deferred to
  later sales-integration phases.
