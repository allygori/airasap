# ADR 0014 — Finance inventory stock source and read boundary

Status: Accepted for Phase 5.1

## Context

Finance needs a stock view without changing the existing Products, Orders,
Reports, or legacy Inventory modules. The repository already contains
inventory item, location, mapping, and movement collections, but the old
inventory service also contains lifecycle and accounting behavior that is not
yet the agreed Finance contract.

The first Finance inventory phase must therefore expose a safe read model
while leaving adjustment, transfer, and cost-of-sales rules for later phases.

## Decision

Finance uses Finance-owned models and repositories as a compatibility boundary
over the existing inventory collections:

- `inventory_items` supplies active inventory item metadata and tracking flags;
- `inventory_locations` validates an optional active location filter;
- `inventory_item_mappings` supplies active mapping visibility; and
- `inventory_movements` supplies only tenant-scoped movements with
  `status: posted` for the balance aggregate.

The Finance implementation does not import the legacy Inventory module. The
read service classifies only explicitly supported inbound and outbound
movement types. Unknown types are counted as unresolved and produce
`needs_review`; they are not assigned an arbitrary direction.

Quantity and value are exposed only when the inventory item tracks them.
Negative quantity and missing `total_cost` on value-tracked known movements are
also surfaced as `needs_review`. Items with no movement remain visible with a
zero balance, and mapping count is shown separately so missing mappings are
observable.

Phase 5.1 does not select FIFO, moving average, or another costing method. The
displayed average unit cost is an informational aggregate only and cannot be
used as the final HPP calculation.

## Consequences

This gives Finance a tenant-scoped, read-only stock contract and avoids
duplicating inventory ledgers. It also means the current view cannot yet post
adjustments, transfers, or COGS. Those operations must define their own
transaction and costing rules in later phases instead of being inferred from
the read aggregate.

The existing collections remain the transitional storage source for Phase 5.1.
If a future migration changes the canonical source, the Finance repository
boundary can be changed without coupling Finance UI or routes to legacy
Inventory services.
