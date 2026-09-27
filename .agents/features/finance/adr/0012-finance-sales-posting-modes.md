# ADR 0012 — Finance sales posting modes

- Status: Accepted
- Scope: Finance sales workflow
- Date: 2026-09-22

## Context

Finance is optional for seller and UMKM organizations. The existing Orders
module and importer must continue to work when Finance is disabled, while an
active Finance module needs a controlled path from an eligible completed order
to a journal entry.

The first sales rule is intentionally limited to the `selesai` order status.
Account mapping may be incomplete during the transition from the old
accounting implementation, so posting failures must be recoverable Finance
work rather than importer failures.

## Decision

1. Finance exposes two workflow modes: `automatic` and `manual`.
2. If Finance is not active, the workflow is a no-op from a persistence and
   journal perspective and returns a `disabled` result.
3. In `manual` mode, an eligible sales event creates a Finance transaction in
   `pending` status. It does not create a journal until a later explicit posting
   action exists.
4. In `automatic` mode, the workflow creates a pending Finance transaction,
   resolves logical roles through the Finance-owned account resolver, and
   posts through the Finance journal service.
5. A successful post changes the Finance transaction to `posted`. Mapping,
   journal, or finalization failures change it to `blocked` with a safe reason.
6. Until an organization-level Finance mode setting is implemented, an omitted
   mode falls back to `manual`. This keeps the default conservative and does
   not expand onboarding.
7. The workflow stores a Finance-owned source snapshot and source order ID for
   traceability. The Orders importer calls the Finance adapter at a narrow
   seam only when Finance is active; Finance does not modify canonical order
   records, and an unavailable/failed Finance workflow does not fail import.

## Consequences

- Finance stays optional: the existing import path continues to succeed when
  Finance is inactive, while an active module can post eligible orders
  automatically.
- Automatic posting is idempotent through the Finance transaction key and the
  journal service key.
- Manual posting and retry/reconciliation UI/API remain follow-up work in
  Phase 4.4.
- Released funds, payout, returns, and refunds are separate events. Plan 04
  defines released funds as marketplace balance; withdrawal is a separate
  transfer. Return/refund posting remains blocked until its correction rule is
  implemented. HPP is governed by Plan 05.
