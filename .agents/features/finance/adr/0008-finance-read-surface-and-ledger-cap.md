# ADR 0008: Finance Read Surface and Ledger Result Cap

- Status: [CURRENT]
- Date: 2026-09-22
- Scope: Finance journal and ledger reads

## Decision

Finance provides three tenant-scoped read contracts for the first accounting
surface:

1. paginated journal summaries with period, status, source type, and text
   filters;
2. journal detail with account metadata resolved through the Finance account
   repository; and
3. a paginated account ledger with a normal-balance running balance.

Ledger aggregation is capped at 5,000 matching lines per request. The response
sets `pagination.truncated` when the persisted result is larger than the
bounded read. This keeps the first UI/API surface predictable while leaving
room for an export or cursor-based history flow later.

## Rationale

The accounting UI needs source traceability and basic account history, but the
first Finance release is for sellers and UMKM rather than a full reporting
warehouse. Bounded reads avoid unbounded aggregation work and keep the API
contract explicit. Posted and reversed journal records remain read-only from
this surface; corrections continue to use the lifecycle reversal flow.

## Consequences

- Finance routes do not depend on the old accounting explorer.
- A ledger with more than 5,000 matching lines must later use an export,
  cursor, or another deliberate history contract.
- Running balances are calculated from posted lines in transaction order and
  use the selected account's normal balance.
