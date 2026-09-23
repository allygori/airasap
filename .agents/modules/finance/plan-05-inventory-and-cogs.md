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

## Confirmed direction for the initial release [TARGET]

- Inventory is one shared pool per organization across its stores/brands and
  selling channels. Store/platform identifiers remain useful source metadata,
  but do not partition inventory balances in this release.
- Keep one primary Finance inventory location as the simple first-use path.
  Multi-location transfers remain deferred under Phase 5.3.
- Products remains the seller's catalog. Only products or variants the user
  chooses to stock need a Finance inventory item and mapping. A mapping links a
  catalog product/variant to a Finance stock item; it does not create stock or
  a stock movement.
- Imported marketplace sales and offline sales should consume the same shared
  stock source. Publishing or reading a quantity at a platform is not itself a
  stock movement or journal event.
- Finance remains optional. No Finance inventory side effect may run when the
  organization has not activated Finance.

## Current usability gap [CURRENT]

The stock view, adjustment form, purchase form, and opening-balance form read
existing Finance items and locations. There is no Finance UI/API flow to create
inventory items, locations, or product mappings. As a result, an organization
with an empty Finance inventory has no user-facing way to satisfy the setup
required by those workflows. Phase 5.5 is the next implementation priority.

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

- Finance reads active inventory items through Finance-owned repositories and
  Finance-owned collections: `finance_inventory_items`,
  `finance_inventory_locations`, `finance_inventory_item_mappings`, and
  `finance_inventory_movements`. Legacy Inventory data is not read or migrated.
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
- The draft movement, journal, and posted movement are finalized in sequence
  with stable idempotency keys for standalone MongoDB. A retry completes an
  interrupted finalization. Posted movements are immutable; any correction is
  another adjustment.
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
- HPP is integrated into Finance sales posting only. The Orders import seam
  may invoke Finance when the organization has activated the optional module,
  but Finance owns the copied sales snapshot and product-to-inventory mapping;
  Products and Reports remain unchanged.
- When mapping, quantity tracking, value tracking, account mapping, stock, and
  exactly one active location are ready, sales posting adds Dr HPP / Cr
  inventory lines and creates an immutable posted `sale` movement linked to
  the sales journal.
- When those prerequisites are not ready, the sales journal can still post
  revenue/receivable, but the transaction stores `inventory_cogs_status:
  deferred` and a user-visible reason. Finance never guesses a cost.
- HPP movement creation is idempotent. Reversing a sales journal in the
  Finance endpoint also creates an inbound `return` movement linked to the
  reversal journal; retry resumes this sequence if interrupted.
- The sales Finance screen shows whether HPP is posted or deferred and shows
  the calculated total when it is posted.

### Phase 5.5 — Inventory setup and first-use flow

Implementation status: [TARGET — NEXT]

Make the existing stock, purchase, adjustment, and opening-balance workflows
usable from a clean Finance setup without requiring manual database setup.

Acceptance criteria:

- An owner can create a Finance inventory item from a selected Products
  product/variant, with a concise review of SKU, name, unit, and quantity/value
  tracking. Non-catalog items such as packaging can be entered manually.
- Creating an item from a catalog product/variant also creates or confirms its
  Finance mapping in that same flow; mapping is not a separate mandatory
  wizard for every product in Products.
- The first-use path creates or reuses one active default location per
  organization idempotently. The common one-location path does not ask the
  seller to design a warehouse hierarchy.
- Empty states on stock, purchase, and adjustment lead to the setup action
  instead of ending at “data belum siap”. Setup may be skipped when the seller
  does not track inventory.
- Inventory items and the default location are available to the existing
  opening-balance flow before finalization, so starting stock is entered as an
  opening balance with quantity and unit cost—not disguised as a shrinkage
  adjustment.
- Duplicate SKU and ambiguous product/variant matches are shown for explicit
  resolution; matching by product name alone never silently combines stock.
- The setup remains tenant-scoped and uses only Finance-owned collections.

Before implementation, confirm how Finance should handle an organization that
has already activated using “start at zero” but later reports physical stock
that existed before activation. Do not post that balance as a purchase or
shrinkage adjustment without an agreed accounting treatment.

### Phase 5.6 — Simple product mapping and shared sales stock events

Implementation status: [TARGET]

Connect the already-integrated order sources to the shared organization
inventory with a minimal mapping experience and repeat-safe stock lifecycle.

Acceptance criteria:

- First inspect the identifiers and variant data that each current Orders
  importer provides. Mapping uses stable product/variant references; SKU may
  suggest a match, but ambiguous or missing identifiers require confirmation.
- Multiple channel listings that represent the same physical SKU can point to
  one Finance item when the source identity has been verified. Products that
  are dropshipped, non-stock, or not selected for tracking do not require a
  Finance mapping.
- A valid order event reserves stock once, lowering sellable availability;
  cancellation releases that reservation once. The marketplace's raw status
  names are not assumed to have identical meaning across platforms.
- The eligible fulfillment/completion event converts the reservation into the
  appropriate outbound inventory and HPP effects. The exact source status per
  platform must be agreed before posting behavior is changed. Existing revenue
  posting remains separate; missing mapping/cost must continue to defer HPP,
  never invent it.
- Re-imports and status enrichment are idempotent per source order line and
  event. A shortage is visible and never silently creates a negative stock
  balance. Finance failures do not roll back basic Orders import.
- A simple offline sale uses the same sales/stock workflow and reduces the
  shared pool; it is not represented as a generic stock adjustment. Its
  minimum payment and revenue fields must be defined with the Finance sales
  contract before implementation.
- Finance inactive: none of these Finance reservations, movements, or journals
  are created, and existing marketplace Orders import remains unaffected.

### Phase 5.7 — Platform availability, buffer, and synchronization

Implementation status: [TARGET — DISCOVERY REQUIRED]

Expose a safe sellable quantity from the shared inventory to supported sales
channels without creating duplicate per-platform stock ledgers.

Recommended simple starting policy (buffer granularity remains a proposal to
confirm before implementation):

- Keep physical/on-hand, reserved, unavailable, and sellable quantities
  conceptually distinct. Consider a per-item safety buffer held back from
  channel availability; it is not a stock movement.
- Publish a computed sellable quantity and refresh other connected channels
  after a relevant reservation, fulfillment, cancellation, receipt, or
  adjustment. Synchronization itself creates no movement or journal.
- Start with one shared pool and a simple buffer policy; defer per-channel
  stock quotas unless testing shows the oversell risk is unacceptable. A
  buffer reduces risk but cannot guarantee zero overselling while external
  platform quantities are stale or concurrent orders arrive.
- Before implementing a channel adapter, verify that the platform has a usable
  stock read/write API and that the application has the required connection
  credentials and permissions. Do not infer APIs from the existing file
  importers.
- Synchronization retries must be safe and failures visible; a failed platform
  update must not rewrite the Finance stock ledger.

This phase does not expand into a general warehouse system. It establishes the
first supported channel stock flow and records the remaining synchronization
limitations for users.

## Open questions

- Whether a future multi-location release needs transfers before allowing HPP
  posting for organizations with more than one active location.
- Which order status from each supported platform should reserve stock, release
  a reservation, and confirm the sale/stock issue.
- How to handle physical opening stock discovered after Finance was activated
  with an explicit zero-opening-balance choice.
- Whether the first channel-sync release can accept eventual consistency with
  a per-item buffer, or needs per-channel stock allocations to meet the
  seller's oversell tolerance.
- Which platform APIs and authorization scopes are actually available for
  stock synchronization; existing file import support does not establish
  stock-write capability.
- Whether FIFO or batch/lot costing is needed after real Finance usage. It is
  not part of the initial moving-average release.

## Not in scope

- product catalog redesign;
- broad marketplace catalog-mapping redesign beyond the minimal Finance
  product/variant-to-inventory link;
- per-store inventory partitioning within one organization in this release;
- multi-channel stock quotas and a guarantee of zero overselling in the first
  synchronization release;
- advanced batch/lot/serial tracking.
