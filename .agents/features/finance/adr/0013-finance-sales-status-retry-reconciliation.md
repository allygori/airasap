# ADR 0013 — Finance sales status, retry, and reconciliation

- Status: Accepted
- Scope: Finance sales transaction work items
- Date: 2026-09-22

## Context

Sales posting can be pending because the organization chose manual mode, or
blocked because source data, account mapping, journal posting, or finalization
failed. The source Orders module must remain the operational source of truth;
retrying Finance must not silently fetch a changed order and produce a
different accounting result.

## Decision

1. Finance sales transactions use `pending`, `blocked`, `posted`, and
   `reversed` statuses.
2. A unique organization-scoped idempotency key identifies the completed-order
   Finance work item. Journal posting keeps its own immutable idempotency key.
3. The Finance sales API exposes tenant-scoped list/detail reads and explicit
   `post` and `retry` actions. Both actions operate on the stored Finance
   transaction intent and source snapshot.
4. A posted transaction is not posted again. A reversed transaction is a
   terminal trace state for that work item; a new correction must use a new
   Finance transaction or journal reversal workflow.
5. Reversing a linked Finance journal updates the linked sales transaction to
   `reversed` after the journal reversal succeeds. The original journal remains
   immutable.
6. Blocked reasons are safe, user-facing explanations. The action never mutates
   the canonical Orders record or changes its status.

## Consequences

- Repeated import and repeated posting are safe to retry.
- Finance can show actionable work through the importer seam without making
  Finance availability a prerequisite for Orders import.
- The transaction detail provides source and journal traceability while HPP and
  inventory effects remain deferred to Plan 05.
