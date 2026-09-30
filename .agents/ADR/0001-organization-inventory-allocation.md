# ADR-0001: Organization-Level Physical Inventory and Store Allocation

- **Status:** accepted
- **Date:** 2026-09-30
- **Decision scope:** [TARGET] direction
- **Supersedes:** None
- **Superseded by:** None

## Context

The product serves multiple Organizations. Each Organization can contain multiple Stores/brands, and each Store can sell through multiple channel accounts. Finance is optional per Organization, and Inventory is part of Finance.

Inventory should let an Organization consolidate physical stock while still tracking which part of its stock is intended for each Store. A Store allocation is a logical assignment: it does not mean that the goods were moved to a different physical location. An Order reservation temporarily holds part of a Store's allocation while the Order is unresolved.

For the initial product direction, assume one warehouse. Preserve a path to multiple warehouses without making warehouse transfers part of the initial user workflow. Marketplace API integration is currently unavailable, so local stock records cannot guarantee real-time channel quantities or prevent a concurrent external sale.

## Decision drivers

- Maintain one understandable physical stock picture for an Organization operating several Stores.
- Distinguish physical goods, logical Store allocations, Order reservations, and externally listed channel quantities.
- Make the basic workflow understandable to general small and mid-sized business users.
- Keep Finance and its Inventory capability optional per Organization.
- Preserve a future path to multiple physical warehouses and channel integrations.
- Avoid presenting imported or manually observed channel data as live or authoritative.

## Options considered

### Store-owned physical stock as the only stock record

This keeps each Store's numbers local, but makes consolidation across Stores harder and risks treating a Store allocation as if goods had physically moved.

### Organization physical stock with logical Store allocations

This keeps physical quantity at Organization scope and records how much is allocated to each Store. Orders reserve from a Store allocation; fulfillment changes physical stock, and cancellation releases an active reservation. This is the selected option.

### Channel-account quantities as the primary stock records

This could model each platform listing independently, but the current product has no real-time marketplace integration. Those values cannot serve as the authoritative physical stock record and would create an unsupported accuracy expectation.

### One undivided Organization pool with no Store allocation

This is simpler initially, but does not provide Store-level availability attribution or the agreed Store allocation concept.

## Decision

1. **[TARGET]** Physical on-hand stock belongs to the Organization and is recorded at a physical warehouse/location. The initial operating model assumes one warehouse.
2. **[TARGET]** An Organization can logically allocate some of its stock to a Store. Allocation is not a physical movement. The unallocated balance remains available for later allocation.
3. **[TARGET]** An Order reserves quantity against the relevant Store allocation while it is unresolved. Fulfillment consumes the reservation and records the physical stock-out; cancellation before fulfillment releases the reservation.
4. **[TARGET]** Inventory is included in the optional Finance module. If Finance is unavailable or disabled for an Organization, that Organization's Inventory capability is unavailable as well.
5. **[TARGET]** Channel listing quantities are distinct from physical on-hand, Store allocations, and Order reservations. Without a verified integration, the product must not promise live channel accuracy or oversell prevention.
6. **[TARGET]** The initial one-warehouse experience must not make a Store allocation equivalent to a warehouse. A future multi-warehouse model may add physical transfers while preserving the distinction between logical allocation and physical movement.

This ADR chooses conceptual ownership and quantity semantics. It does not select a Mongoose schema, a transaction strategy, or the detailed Order-to-Finance integration mechanism.

## Consequences

### Positive

- Users can distinguish where goods physically exist from which Store may sell allocated quantities.
- Order reservations have a clear purpose and do not imply physical movement by themselves.
- Multiple Stores can be consolidated without using Store allocation as a substitute for a warehouse transfer.
- The model can grow toward additional warehouses and future channel adapters.

### Costs and constraints

- The product must explain on-hand, allocated, reserved, available, and unallocated quantities clearly in UI and reports.
- Allocation and reservation rules need safeguards for stock limits, concurrent Orders, cancellation, fulfillment, returns, and adjustments.
- Channel quantities and warnings must show their source and freshness when they are not live.
- Orders and Finance need an explicit failure/recovery contract; this ADR does not settle that integration seam.

## Implementation status

- **[CURRENT]** Finance has Organization-scoped Inventory items, locations, movements, reservations, and mappings. Reservations may include Store and platform context.
- **[CURRENT]** The reviewed model does not have a persistent Store allocation entity. Existing reservation context does not constitute a standing allocation.
- **[CURRENT]** The current application uses file-based marketplace workflows and has no verified real-time stock API integration.
- **[TARGET]** The accepted physical-stock / Store-allocation / Order-reservation model is not fully implemented. This ADR is not evidence that allocation persistence, complete multi-warehouse transfers, or channel synchronization already exists.

## Open questions and related records

- [Q-001 — Product catalog ownership across Stores](../docs/open-questions.md#q-001--product-catalog-ownership-across-stores)
- [Q-007 — Orders-to-Finance failure and recovery contract](../docs/open-questions.md#q-007--orders-to-finance-failure-and-recovery-contract)
- [Q-008 — Store allocation persistence and constraints](../docs/open-questions.md#q-008--store-allocation-persistence-and-constraints)
- [Q-009 — Shared Store pool versus per-account channel quotas](../docs/open-questions.md#q-009--shared-store-pool-versus-per-account-channel-quotas)
- [Q-010 — Channel quantity source, freshness, and warnings](../docs/open-questions.md#q-010--channel-quantity-source-freshness-and-warnings)
- [Q-011 — Imported Order shortage, cancellation, and return reconciliation](../docs/open-questions.md#q-011--imported-order-shortage-cancellation-and-return-reconciliation)
- [Q-012 — Multi-warehouse operating model](../docs/open-questions.md#q-012--multi-warehouse-operating-model)
- [Inventory and Sales Channels](../docs/architecture/inventory-and-channels.md)
- [Optional Modules and Feature Flags](../docs/architecture/optional-modules-and-flags.md)
