# ADR 0011: Finance Completed-Order Posting Rule

- Status: [CURRENT]
- Date: 2026-09-22
- Scope: Finance sales posting rules Phase 4.2

## Decision

The first Finance sales rule recognizes only the existing order status
`selesai` as the `completed_order` event. A ready projection produces a
balanced journal intent:

- debit `marketplace_receivable`;
- credit `sales_revenue`.

The intent uses `finance-sales:completed:<source_order_id>` as its stable
idempotency key. It does not resolve concrete account IDs or write a journal;
that remains an orchestration/posting concern after the rule contract is
reviewed.

Orders with other statuses are returned as `not_eligible`. A completed order
whose Finance projection is incomplete is returned as `blocked` with an
actionable reason. If any source line has a returned quantity, the completed
sale is blocked until the Finance return/refund correction rule is available;
Finance must not recognize the unreduced amount as a normal sale. HPP is
governed by Plan 05. Released funds and payout are separate events and are not
silently inferred from the completed-order event. If a return is discovered
after a sale is posted, the original journal stays immutable; a separate
Finance reversal/correction is required until dedicated refund handling is
implemented.

## Rationale

The existing order workflow already uses `selesai` as its completed state, and
this is the smallest predictable first slice for marketplace sellers. Keeping
logical account roles in the intent avoids coupling the sales rule to a
particular COA code or to the legacy accounting resolver.

## Consequences

- The rule is deterministic and easy to replay without changing the source
  order.
- Settlement timing does not get confused with revenue recognition.
- The completed-order event itself does not post marketplace fees, funds
  release, or payout. The separate released-funds event is specified in Plan
  04. Returns/refunds remain safely blocked until their correction rule is
  implemented; HPP is governed by Plan 05.
- Changing eligible statuses later is a deliberate rule/ADR change rather than
  an accidental importer side effect.
