# Finance Inventory

> Inventory is implemented inside the optional Finance module. This feature guide records the current service boundary; the shared architecture guide contains the broader current/target stock vocabulary and accepted stock direction.

## Current capability

- **[CURRENT]** Finance Inventory owns Organization-scoped inventory items, locations, movements, reservations, and Product mappings.
- **[CURRENT]** Stock reads derive on-hand from posted movements and account for active reservations when calculating sellable quantity. A movement is associated with an item and physical location and may also carry Store/platform context.
- **[CURRENT]** Inventory setup reads active Product/variant sources from Products and maps them to Finance inventory items. Product catalog ownership across Stores remains unresolved; mapping does not make Product quantity the stock ledger.
- **[CURRENT]** Finance Inventory includes stock reads, adjustments, reservation synchronization from Orders, COGS processing, and setup/mapping workflows.
- **[CURRENT]** Offline sales and purchase posting compose with Finance Inventory. Their operational requirements are described in [Sales](sales.md) and [Purchases and Expenses](purchases-and-expenses.md).
- **[CURRENT]** The Finance schema permits multiple locations, but this does not establish a complete multi-warehouse transfer workflow.

## Target direction and constraints

- **[TARGET]** Physical stock belongs to the Organization's Finance Inventory. A Store may receive a logical allocation, and an imported Order may reserve part of that allocation. Logical allocation is not a physical warehouse transfer.
- **[TARGET]** Start with a one-warehouse user experience while keeping a path to multiple physical warehouses. Inventory is unavailable when Finance is disabled.
- **[OPEN]** Persistent Store allocations, shared-versus-per-account channel pools, channel quantity freshness/warnings, and multi-warehouse operations remain unresolved in [Q-008](../../docs/open-questions.md#q-008--store-allocation-persistence-and-constraints), [Q-009](../../docs/open-questions.md#q-009--shared-store-pool-versus-per-account-channel-quotas), [Q-010](../../docs/open-questions.md#q-010--channel-quantity-source-freshness-and-warnings), and [Q-012](../../docs/open-questions.md#q-012--multi-warehouse-operating-model).
- **[CURRENT]** There is no verified API integration that continuously synchronizes stock with Shopee, Tokopedia, TikTok Shop, or another channel. Imported Orders can update local reservations after import, but do not prevent external overselling.

See [Inventory and Sales Channels](../../docs/architecture/inventory-and-channels.md) for terms, stock examples, current limitations, and the accepted target semantics. See [ADR-0001](../../ADR/0001-organization-inventory-allocation.md) for the durable direction; neither document means Store allocations are fully implemented.

## Source entry points

- [Inventory setup service](../../../modules/finance/inventory/finance-inventory-setup.service.ts), [stock read service](../../../modules/finance/inventory/finance-inventory-stock-read.service.ts), [reservation service](../../../modules/finance/inventory/finance-inventory-reservation.service.ts), and [COGS service](../../../modules/finance/inventory/finance-inventory-cogs.service.ts)
- [Inventory API routes](../../../app/api/v1/dashboard/finance/inventory/)
- [Inventory and Sales Channels](../../docs/architecture/inventory-and-channels.md), [ADR-0001](../../ADR/0001-organization-inventory-allocation.md), and [Products feature](../products/README.md)
