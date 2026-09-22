# Finance Plan 05 — Inventory and Cost of Sales

Status: [CURRENT / IN PROGRESS]

## Goal

Provide Finance inventory behavior for stock visibility, adjustments, warehouse
transfers, and cost of sales while leaving the basic Products module intact.

## Boundary

Products remains the product/catalog source. Finance inventory references
products or variants but owns financial stock transactions only when required by
the final data contract.

Existing inventory logic may be reused selectively after checking its lifecycle,
cost, location, and journal behavior.

## Phases

### Phase 5.1 — Stock view and inventory contract

Define the Finance stock view, item references, locations, quantity behavior,
and value behavior.

Acceptance criteria:

- stock quantities have one documented source of truth;
- product-to-stock relationship is explicit;
- inactive or unmapped products are handled safely;
- tenant and location scope are enforced.

Implementation status: [CURRENT]

- Finance now reads active inventory items through Finance-owned repositories
  over the existing `inventory_items`, `inventory_locations`,
  `inventory_item_mappings`, and `inventory_movements` collections.
- Only tenant-scoped `posted` movements are included in the stock balance.
  Known inbound and outbound movement types are classified explicitly; an
  unknown movement type is not guessed and marks the item as `needs_review`.
- `location_id` is optional. When supplied, it must resolve to an active
  tenant-scoped location before movement aggregation runs.
- Product/catalog records remain outside this Finance boundary. Active
  inventory items with zero movement remain visible, and their active mapping
  count is shown so an unmapped item is visible rather than silently omitted.
- Quantity and value tracking follow the inventory item's existing tracking
  flags. A negative quantity, an unresolved movement, or a missing cost on a
  value-tracked item is surfaced as `needs_review`.
- The displayed average unit cost is an indicator calculated from the current
  aggregate only. It is not a selection of FIFO or moving average and must not
  be used as the final HPP calculation.

The Phase 5.1 read contract is intentionally read-only. It does not create
movements, journals, adjustments, or duplicate inventory ledgers.

### Phase 5.2 — Stock adjustments

Support increases, decreases, damage, loss, and other approved adjustments.

Acceptance criteria:

- adjustment requires a reason;
- posted adjustment creates balanced accounting impact when value-tracked;
- adjustment correction uses a new transaction;
- negative stock behavior is explicitly defined.

### Phase 5.3 — Warehouse transfers

Support transfer between locations without incorrectly changing total
organization stock value.

Acceptance criteria:

- source and destination locations are different and valid;
- quantity movement is atomic;
- transfer is traceable;
- transfer does not create revenue or expense by itself.

### Phase 5.4 — Cost of sales integration

Connect eligible sales events to inventory reduction and HPP.

Acceptance criteria:

- sales posting and inventory posting are consistent;
- cost is not silently guessed when required data is unavailable;
- selected costing method is documented;
- inventory value and HPP can be traced to source movements.

## Open questions

- Moving average, FIFO, or another costing method?
- Can a seller use Finance without value-tracked inventory?
- Which existing inventory collections remain canonical?
- Is packaging inventory part of the first release?

The costing method and adjustment semantics remain open for Phase 5.2 and
Phase 5.4; Phase 5.1 does not silently choose either one.

## Not in scope

- product catalog redesign;
- marketplace product mapping redesign;
- advanced batch/lot/serial tracking.
