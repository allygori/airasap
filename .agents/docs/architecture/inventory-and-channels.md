# Inventory and Sales Channels

> This guide separates verified behavior from the agreed product direction and unresolved policy. It does not describe every future workflow as an implemented capability.

## Scope and status

- The accepted target stock semantics are recorded in [ADR-0001 — Organization-Level Physical Inventory and Store Allocation](../../ADR/0001-organization-inventory-allocation.md). This ADR records direction, not a completed implementation or a schema choice.
- **[CURRENT]** Finance contains the inventory implementation. Finance is an optional Organization-level module, and Inventory is part of Finance.
- **[TARGET]** Model physical stock at Organization level, with persistent logical allocations to Stores and temporary reservations for Orders. Assume one warehouse in the initial operating model while keeping a path to multiple warehouses.
- **[OPEN]** Product ownership, allocation, channel stock policy/freshness, and Order reconciliation remain unresolved; see the relevant IDs in [Open Questions](../open-questions.md): Q-001, Q-008–Q-011.

## Terms

| Term | Meaning |
| --- | --- |
| **Physical on-hand** | Quantity physically recorded at a warehouse/location. It changes through posted stock movements such as receipts, fulfillment, returns, and adjustments. |
| **Store allocation** | A logical assignment of some Organization stock to a Store. It does not move goods physically. |
| **Order reservation** | A temporary hold against available allocated stock for an Order. It reduces the Store's available-to-sell amount while the Order is unresolved. |
| **Sales channel** | A way a Store sells, such as Shopee, Tokopedia, WhatsApp, offline, or the Store's own website. |
| **Channel account** | A particular seller account or connection for a channel platform. A Store may have multiple accounts for the same platform. |
| **Channel listing quantity** | A quantity shown or maintained for a particular product listing/account on a sales channel. This is distinct from warehouse on-hand, Store allocation, and Order reservation. |

Do not use “stock” without clarifying which quantity is meant when a workflow depends on the distinction.

## Current implementation

### Inventory data and behavior

- **[CURRENT]** Inventory items, locations, movements, reservations, and product mappings are Organization-scoped in Finance.
- **[CURRENT]** A movement belongs to an item and location; it can also carry Store and platform context. Movement records have draft, posted, or voided lifecycle states and an idempotency key.
- **[CURRENT]** The stock read path derives on-hand quantity from posted movements and subtracts active reservations to calculate sellable quantity. It reports unresolved movement/reservation issues; the displayed average cost is an indicator, not a final costing policy.
- **[CURRENT]** Reservations record Order and line references, platform, Store, product/variation references, item, location, quantity, status, and source status. The reservation service maps imported Order statuses to reserve, release, or consume behavior and can record shortages when available stock is insufficient.
- **[CURRENT]** For the configured Shopee values, `perlu-dikirim`, `sedang-dikirim`, and `telah-dikirim` reserve stock; `batal` releases an unconsumed reservation; and `selesai` consumes it after the sales HPP movement posts. An active reservation reduces sellable quantity without reducing on-hand. The current Shopee sales flow posts the stock-out movement with the completed-order workflow, not when `shipping_arranged_at` is set.
- **[CURRENT]** The seller's `shipping_arranged_at` value means the shipping label is ready to print and is not a courier handoff timestamp. The configured `pengembalian` and `pengembalian-dana` values have not been verified against source Shopee files; current code flags those values for review. See [Q-011](../open-questions.md#q-011--imported-order-shortage-cancellation-and-return-reconciliation).
- **[CURRENT]** Finance setup maps products and variants from across the Organization's Stores to Organization-level inventory items. This mapping behavior does not decide the future owner or sharing policy for the product catalog.
- **[CURRENT]** The schema permits multiple locations and includes transfer-in/transfer-out movement types. This alone does not establish a complete multi-warehouse transfer workflow.
- **[CURRENT]** No persistent Store allocation entity was found in the reviewed inventory model. A reservation carrying Store context is not the same thing as a standing Store allocation.
- **[CURRENT]** The reviewed reservation fields identify Store and platform, but do not establish independent stock pools or quotas for multiple accounts on the same platform.

### Channel integration limits

- **[CURRENT]** Marketplace data currently enters through file-based workflows; there is no verified real-time stock integration with Shopee, Tokopedia, TikTok Shop, or other channels.
- **[CURRENT]** A local reservation can reflect an Order after its data is imported, but cannot guarantee that a channel listing was updated before another buyer placed an Order.
- **[CURRENT]** Channel-specific low-stock warnings cannot be treated as continuously accurate or as overselling prevention. Any future manually entered or imported channel quantity should carry its source and observed time so users can judge its freshness.

## Target stock model

The target distinguishes the Organization's physical stock, Store allocations, Order reservations, and external channel quantities. Only the first three are part of the agreed inventory direction; how channel accounts consume or publish quantities remains open.

### Example with one warehouse

1. The Organization records **100 units on-hand** in its warehouse.
2. The Organization allocates **30 units to Store A**. This is a logical allocation; the goods remain in the same warehouse. **70 units remain unallocated**.
3. An Order for 4 units reserves 4 of Store A's allocation. Store A now has **26 available** and **4 reserved**; total allocated to Store A remains 30 until the reservation is fulfilled or otherwise resolved.
4. On fulfillment, the system records a 4-unit stock-out movement and consumes the reservation. On-hand becomes **96**, Store A's remaining allocation becomes **26**, and the unallocated amount stays **70**.
5. On Order cancellation before fulfillment, the reservation is released. Store A's available allocation returns to **30**; physical on-hand and total Store allocation do not change.

The quantities in this example should reconcile: allocations cannot exceed on-hand stock, and active reservations cannot exceed the relevant available allocation. If imported channel activity arrives late or conflicts with local availability, the system should record and surface the shortage rather than imply that channel overselling was prevented.

### Inventory concepts and ownership

- **[TARGET]** Finance Inventory owns stock records, allocation/reservation rules, and stock movements while Finance is active for an Organization.
- **[TARGET]** Orders owns Order lifecycle and its source facts. Inventory applies the stock consequences of those facts through an explicit module seam; Orders should not write Inventory models directly.
- **[TARGET]** A logical Store allocation must not be represented as a physical transfer. Physical transfers are meaningful only when goods move between actual locations.
- **[TARGET]** Keep channel listing quantities conceptually separate from local inventory. If a later integration publishes stock, that integration must state which local quantity it publishes and how competing channel accounts are reconciled.
- **[OPEN]** Product catalog ownership and the product-to-inventory mapping model are tracked in [Q-001 — Product catalog ownership across Stores](../open-questions.md#q-001--product-catalog-ownership-across-stores).

### Useful quantity definitions

For a given item and physical location, the basic physical availability is:

```text
physical available = physical on-hand - active reservations
```

For a Store allocation:

```text
Store available = Store allocation balance - active reservations against that allocation
unallocated = physical on-hand - total Store allocation balances
```

These definitions are a shared vocabulary for the target model. They do not imply that each quantity is currently stored as a field or that a new schema has been decided. The implementation should prevent allocating more than available physical stock and should handle concurrent reservations safely.

## Channel accounts, warnings, and future integrations

- **[TARGET]** Keep Store and channel-account identity separate. A Store can have multiple accounts for the same platform.
- **[OPEN]** Whether accounts on one Store share the Store's allocation or have explicit per-account quotas is tracked in [Q-009](../open-questions.md#q-009--shared-store-pool-versus-per-account-channel-quotas). The current design must not silently assume either policy.
- **[CURRENT]** Without channel APIs, local inventory cannot guarantee immediate listing updates or prevent a sale made concurrently on another channel.
- **[TARGET]** Future reminders should say what they measure (for example, local Store availability or a manually observed channel listing quantity), its source, and when it was last observed. Do not label stale or approximate data as a live channel balance.
- **[TARGET]** Keep a future platform integration behind an explicit adapter/seam so adding one platform does not make core allocation and reservation rules depend on that platform's data format.
- **[OPEN]** Source/freshness rules and future integration behavior are tracked in [Q-010](../open-questions.md#q-010--channel-quantity-source-freshness-and-warnings) and [Q-011](../open-questions.md#q-011--imported-order-shortage-cancellation-and-return-reconciliation). Do not promise automatic stock synchronization before they are resolved.

## Warehouse growth path

- **[TARGET]** The initial user-facing model may assume one warehouse and avoid multi-warehouse operational complexity.
- **[TARGET]** Do not encode that assumption in a way that equates Store allocation with a warehouse or prevents stock from being assigned to a physical location later.
- **[CURRENT]** Multiple inventory locations can be represented in the current schema, but a complete transfer lifecycle was not verified. Do not treat location records or transfer movement types alone as proof that multi-warehouse inventory is supported end to end.
- **[TARGET]** If multi-warehouse support is introduced, distinguish a logical Store allocation from a physical transfer between source and destination locations. Transfers need a traceable lifecycle and must preserve total stock while goods are in transit.
- **[OPEN]** Allocation and reservation behavior across multiple warehouses is tracked in [Q-012 — Multi-warehouse operating model](../open-questions.md#q-012--multi-warehouse-operating-model).

## Data modeling guidance

- **[TARGET]** Choose embedded arrays versus separate documents based on boundedness, lifecycle, access patterns, indexing needs, and concurrent updates—not merely because MongoDB allows embedding.
- **[TARGET]** Movement and reservation histories grow independently and need their own lifecycle and queries, so keep them independently addressable rather than embedding unbounded histories in an item document.
- **[OPEN]** The persisted representation for Store allocations is tracked in [Q-008 — Store allocation persistence and constraints](../open-questions.md#q-008--store-allocation-persistence-and-constraints).
- **[TARGET]** If a bounded set of per-location balances is embedded for efficient reads, keep auditable movements as the source of stock changes and define how concurrent updates remain consistent. This is a design option, not an accepted schema decision.

## Related guidance and open questions

- [Domain and tenancy](./domain-and-tenancy.md) describes Organization, Store, and channel-account relationships.
- [Module boundaries](./module-boundaries.md) describes current cross-module coupling and the target for explicit module seams.
- [Optional modules and flags](./optional-modules-and-flags.md) and [ADR-0002 — Organization-Scoped Optional Module Activation](../../ADR/0002-organization-scoped-module-activation.md) explain why disabling Finance also disables its Inventory capability.
- See [Open Questions](../open-questions.md) for Q-001 and Q-008–Q-012. Those entries remain unresolved; this guide records the relevant inventory concepts, not additional decisions.
