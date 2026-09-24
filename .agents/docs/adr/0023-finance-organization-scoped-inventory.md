# ADR 0023 — Organization-Scoped Finance Inventory

Status: [CURRENT]

## Context

One organization can operate multiple stores or brands and sell through
multiple marketplace and offline channels. The initial Finance inventory
experience targets sellers and UMKM users, not large-company warehouse
operations. For the first release, requiring a separate stock pool for each
store would add setup and mapping work before the user has a reliable central
stock view.

Finance owns inventory collections separate from legacy Inventory. Finance
items and locations are organization-scoped. The setup flow reads catalog
sources through a narrow public Products service, and writes only Finance
items, locations, and product/variant mappings.

## Decision

1. The initial Finance inventory balance is shared at the organization level
   across the organization's stores/brands and sales channels. Store and
   platform identifiers remain source metadata for traceability, not balance
   partitions.
2. The initial setup provides one primary active Finance inventory location
   per organization. Multi-location transfers remain deferred as described in
   Plan 05 and ADR 0016.
3. Products remains the catalog source. A user-selected stock-tracked
   product/variant links to a Finance inventory item through a concise setup
   flow. A mapping links identities; it does not itself add quantity or create
   a stock movement. Non-stock products do not need a mapping for HPP.
4. Sales from connected marketplace channels and offline sales consume the
   same organization-level stock pool when their supported source events are
   processed. Platform stock synchronization is a projection of availability,
   not a stock movement or journal.
5. Finance remains optional: if Finance is inactive, its inventory and
   accounting side effects do not run.

Implementation details: the first-use location is an idempotent organization
record with code `MAIN` and name `Gudang Utama`. Creating or mapping an item
does not add stock or create a movement. Initial quantity and unit cost are
entered through opening balance before activation. Catalog product and variant
identity is explicit; SKU is a suggested value, never an automatic merge key.

## Consequences

- Sellers can manage a common stock pool without maintaining a separate
  quantity for every channel.
- A user-facing setup flow is required before purchase, adjustment, opening
  balance, or HPP workflows can be used from a clean database; that flow is
  implemented in Finance inventory setup.
- The initial release cannot report independent on-hand balances by store or
  brand. Adding that capability later requires an explicit store-level stock
  dimension and corresponding movement, mapping, and reporting rules.
- A shared quantity pushed to several external platforms may be stale between
  updates. Plan 05 proposes a simple buffer and defers per-channel quotas
  unless user testing requires stronger oversell controls; buffer granularity
  remains open before implementation.
- Exact product/variant matching and per-platform reservation status mappings
  must be verified against current importer data before implementing those
  flows; this ADR does not invent those source contracts.
- The treatment of pre-existing physical stock after an organization has
  activated Finance with “start at zero” remains unresolved. Do not represent
  that stock as a purchase or shrinkage adjustment until an accounting policy
  is agreed.

## Scope boundary

This decision applies to the new optional Finance module and its Finance-owned
inventory collections. It does not partition or replace the existing Products,
Orders, or Reports modules and does not introduce a generic warehouse or
feature-flag system.
