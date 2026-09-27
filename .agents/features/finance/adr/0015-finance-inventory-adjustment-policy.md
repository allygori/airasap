# ADR 0015 — Finance inventory adjustment policy

Status: Accepted for Phase 5.2

## Context

Seller and UMKM users need to correct physical stock differences without
understanding double-entry bookkeeping. At the same time, an adjustment must
not create negative inventory or an unbalanced journal. Posted movements must
remain auditable and immutable.

## Decision

Finance uses one simple adjustment flow with four reasons:

- `stock_count` for an opname or count difference;
- `damage` for damaged goods;
- `loss` for missing goods; and
- `other` for an approved reason that does not fit those categories.

The user supplies item, location, increase/decrease, quantity, date, and—only
when the item tracks value—a positive unit cost. The UI does not require the
user to choose accounts.

The posting rules are:

1. Negative stock is rejected at the location level. The user must correct the
   source balance or record an increase before posting a decrease.
2. The inventory account comes from the item's explicit mapping when valid;
   otherwise Finance uses the item-type default (`1310` merchandise, `1320`
   packaging/supplies, or `1510` fixed asset).
3. The offset defaults to the active, postable `inventory_shrinkage` account
   (`6900`). An API caller may supply another active, postable expense,
   other-expense, or other-income account when the organization has approved
   a different treatment.
4. A value-tracked increase posts `Dr Inventory / Cr Offset`; a value-tracked
   decrease posts `Dr Offset / Cr Inventory`.
5. Quantity-only items post the movement without a journal because Finance has
   no value claim to record.
6. On standalone MongoDB, the draft movement, journal, and posted movement are
   written in order with stable idempotency keys. If finalization is interrupted,
   retry reuses the journal and completes the movement. A posted adjustment
   cannot be edited or deleted; a correction is a new adjustment.
7. An idempotency key is persisted. Replaying the same request returns the
   posted result, while reusing the key with different data is rejected.

Unknown or unresolved existing movements block a value-tracked adjustment at
that location. Finance does not guess the current balance or cost.

## Consequences

The common user path is short and safe: no account selection is necessary,
while custom integrations retain an override for the offset account. A
seller cannot post a decrease below zero, so operational correction may need
to happen before an adjustment can be recorded.

The default `6900` account is used for both count gains and losses. A gain is
therefore a credit to the shrinkage account, reducing the expense balance. If
an organization needs a separate gain account, it can use the API override
until a dedicated account-role configuration is introduced.

This phase intentionally does not decide FIFO versus moving average. Unit
cost entered for an adjustment is the cost of that adjustment; sales HPP
calculation remains a later phase.
