# ADR 0022 — Finance-Owned Inventory Collections

Status: [CURRENT]

## Context

Finance initially used Finance-prefixed Mongoose models over the legacy
Inventory collections. That avoided importing legacy Inventory code, but it
still coupled Finance persistence to the legacy Inventory data lifecycle.
Finance is a separate optional module, and development data is intentionally
discardable; no production data or one-time migration needs to be preserved.

## Decision

1. Finance owns separate inventory collections:
   - `finance_inventory_items`;
   - `finance_inventory_locations`;
   - `finance_inventory_item_mappings`; and
   - `finance_inventory_movements`.
2. Finance models, repositories, services, and APIs use only these Finance
   collections. The legacy Inventory module and its collections remain outside
   the Finance persistence boundary.
3. Existing development records in the legacy collections are intentionally
   ignored. No migration, copy, or compatibility fallback is provided.
4. Finance domain fields such as `inventory_movements` may remain as names for
   references or response data; they do not identify the physical collection.

## Consequences

- Finance inventory can be initialized from a clean state independently of
  legacy Inventory.
- The stock read response identifies `finance_inventory_movements` as its
  source collection.
- Removing legacy Inventory later must not change Finance collection names or
  behavior.

## Scope boundary

This decision applies only to `modules/finance/inventory`. It does not change
the basic Products, Orders, or Reports modules, nor does it remove the legacy
Inventory module or its routes.
