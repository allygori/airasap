# ADR 0010: Finance Sales Source Boundary

- Status: [CURRENT]
- Date: 2026-09-22
- Scope: Finance sales/order integration Phase 4.1

## Decision

Finance defines its own normalized sales-source contract under
`modules/finance/sales`. The contract retains the source order ID and order
number, organization/store, platform, source status, dates, monetary totals,
and line-level product references and costs needed by posting and COGS work.

The projection service is pure and produces either a `ready` or `incomplete`
projection with explicit data-shape issues. A narrow adapter in the Orders
import flow maps persisted Orders into that contract. Finance does not import
Orders or Products, mutate their collections, or decide the source order's
operational status. The Finance workflow owns eligibility and journal posting.

## Rationale

Orders and Products remain the operational source of truth, while Finance must
remain removable and independently evolvable. Copying the narrow boundary into
Finance prevents legacy accounting side effects from entering the new flow and
keeps the product/status decision available for discussion in Phase 4.2.

## Consequences

- Orders remains the source of truth; its import/enrichment flow invokes the
  optional Finance adapter only for eligible events.
- Products and Reports are not changed by this integration.
- Finance stores its own source snapshot and never modifies the canonical
  order while projecting or posting it.
- Currency defaults to IDR at the transaction boundary; it is not an
  onboarding question in this phase.
- Posting, retry, blocked state, and persistence are owned by later Finance
  sales workflow layers; the projection itself remains side-effect free.
