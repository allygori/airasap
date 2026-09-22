# Finance Plan 05 — Inventory and Cost of Sales

Status: [TARGET]

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

## Not in scope

- product catalog redesign;
- marketplace product mapping redesign;
- advanced batch/lot/serial tracking.

