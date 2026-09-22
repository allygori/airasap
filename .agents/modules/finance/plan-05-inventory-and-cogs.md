# Finance Plan 05 — Inventory and Cost of Sales

Status: [CURRENT / IN PROGRESS]

## Goal

Provide Finance inventory behavior for stock visibility, adjustments, deferred
warehouse transfers, and cost of sales while leaving the basic Products module
intact.

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

Implementation status: [CURRENT]

- A user-facing Finance adjustment form and versioned API now support stock
  count, damage, loss, and other adjustments.
- Negative stock is rejected per location. Finance does not silently allow a
  seller to create an invalid on-hand balance.
- A value-tracked item requires a positive unit cost. Its posted adjustment
  creates a balanced journal: increase debits inventory and credits the
  inventory shrinkage account; decrease debits that account and credits
  inventory.
- Inventory account resolution uses the item's explicit account first, then
  the Finance default for its item type. The offset account defaults to the
  selectable `inventory_shrinkage` account (code `6900`) and can be overridden
  by an API caller when a different approved account is required.
- A quantity-only item can post the movement without a journal because no
  value claim is being made.
- The posted movement and journal are created in one database transaction.
  Posted movements are immutable; any correction is another adjustment.
- Idempotency keys replay the original posted adjustment and reject a reused
  key with different adjustment data.

Phase 5.2 decisions: quantity-only Finance use is supported; packaging and
supplies use the existing packaging inventory default unless an item-specific
inventory account is configured. The costing method for sales HPP remains a
Phase 5.4 decision.

### Phase 5.3 — Warehouse transfers

Support transfer between locations without incorrectly changing total
organization stock value.

Acceptance criteria:

- source and destination locations are different and valid;
- quantity movement is atomic;
- transfer is traceable;
- transfer does not create revenue or expense by itself.

Implementation status: [DEFERRED]

This phase is intentionally deferred from the initial Finance release. The
initial target is the common single-location seller/UMKM workflow, so adding a
transfer form before the multi-location policy is needed would add UI and
posting complexity without helping that workflow. No transfer endpoint or
transfer-specific journal behavior is part of the current release.

Phase 5.4 therefore only calculates HPP when exactly one active Finance
inventory location exists. If an organization has multiple active locations,
HPP remains explicitly deferred until the transfer/location policy is
implemented.

### Phase 5.4 — Cost of sales integration

Connect eligible sales events to inventory reduction and HPP.

Acceptance criteria:

- sales posting and inventory posting are consistent;
- cost is not silently guessed when required data is unavailable;
- selected costing method is documented;
- inventory value and HPP can be traced to source movements.

Implementation status: [CURRENT]

- The initial costing method is moving average. The service uses the posted
  quantity and value balance for the active location, then carries the
  calculated balance across lines in the same sale.
- HPP is integrated into Finance sales posting only. The existing Orders and
  Products modules are not changed, and Finance uses the copied Finance sales
  source-line contract and Finance-owned product-to-inventory mapping.
- When mapping, quantity tracking, value tracking, account mapping, stock, and
  exactly one active location are ready, sales posting adds Dr HPP / Cr
  inventory lines and creates an immutable posted `sale` movement linked to
  the sales journal.
- When those prerequisites are not ready, the sales journal can still post
  revenue/receivable, but the transaction stores `inventory_cogs_status:
  deferred` and a user-visible reason. Finance never guesses a cost.
- HPP movement creation is idempotent. Reversing a sales journal in the
  Finance endpoint also creates an inbound `return` movement linked to the
  reversal journal, inside the same database transaction.
- The sales Finance screen shows whether HPP is posted or deferred and shows
  the calculated total when it is posted.

## Open questions

- Whether a future multi-location release needs transfers before allowing HPP
  posting for organizations with more than one active location.
- Whether FIFO or batch/lot costing is needed after real Finance usage. It is
  not part of the initial moving-average release.
- Which existing inventory collections remain canonical for future migrations;
  the current Finance repositories intentionally isolate that decision.

## Not in scope

- product catalog redesign;
- marketplace product mapping redesign;
- advanced batch/lot/serial tracking.
