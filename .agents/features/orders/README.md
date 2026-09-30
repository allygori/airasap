# Orders

> Feature guide based on the current application source. It documents imported Order behavior; it does not define a future unified order model for every channel.

## Scope and status

- **[CURRENT]** Orders stores sales records scoped to an Organization and Store. Each record includes a platform Order ID, platform status, buyer/shipping details, embedded line items, payment and fee data, and timestamps/settlement fields used by imports and reports.
- **[CURRENT]** The persisted Order is also a source for product-cost/profit analysis and selected Finance operations. Reports aggregate this data; Finance integration is described below.
- **[CURRENT]** The reviewed import implementations are Shopee-specific Excel workflows. This is not a verified live marketplace API integration or a normalized importer for all platforms.
- **[TARGET]** Orders owns Order intake and Order lifecycle facts. Finance owns accounting and Inventory consequences while Finance is available. See [Module Boundaries](../../docs/architecture/module-boundaries.md).

## Current Order operations

The dashboard API exposes listing, search, active Orders, lookup by internal or marketplace ID, create/update, overwrite, soft delete/restore, and bulk active-status updates. The module service and repository receive Organization context and optional Store context; persisted Order documents require both Organization and Store. The model has a compound unique index on Organization, Store, and `order_id`.

`overwrite` recalculates item-level and Order-level sales, cost, and profit fields from supplied item values. It is distinct from the regular partial update path. Do not assume that every manual mutation automatically invokes the same Finance workflows as the import paths.

## Shopee Excel import workflows

### All-Orders import

1. The dashboard route accepts an Excel upload and records the source file through `FileService`.
2. The importer tries the Shopee V2 All Orders parser, then falls back to the V1 parser if parsing fails.
3. Rows are grouped by marketplace Order ID. Product and variant matching uses imported names/SKUs and the Products module; the result is recorded as `matched`, `unresolved`, or `ambiguous` on each Order item. Product cost is resolved for the Order date when a match/cost is available.
4. A new Order is created when that scoped marketplace Order ID is absent. If it already exists, this import updates the status only when it changed; it does not overwrite the other stored Order fields. Results report created, updated, or ignored Orders.
5. The importer attempts the associated Finance workflow. Finance failures or review conditions are returned as per-Order messages after the Order itself has been saved.

### Completed-Order and released-funds enrichment

- Separate Shopee exports enrich existing Orders with completion or released-funds/payment/fee details. The routes retain a File reference in the Order's `enrichments` metadata.
- The completed-Order workflow can trigger Finance sales/Inventory processing. The released-funds workflow can record marketplace settlement information in Finance.
- These workflows are batch imports, not live updates from the marketplace. Their source file and the imported facts are the evidence available to downstream reports and reconciliation.

## Finance boundary and known seam

- **[CURRENT]** `OrderService` constructs `OrderFinanceIntegrationService` directly. Import paths call Finance to post completed Orders, synchronize reservation lifecycle for other statuses, and record released funds.
- **[CURRENT]** The All-Orders importer catches Finance integration failures and includes a message in the import result; it does not roll back the saved Order because Finance failed.
- **[TARGET]** Core Order intake must remain usable if Finance is disabled or unavailable. Keep Finance writes inside Finance operations and do not write Finance collections from Orders.
- **[OPEN]** The composition point, durable retry/recovery state, and reconciliation contract remain undecided. See [Q-007 — Orders-to-Finance failure and recovery contract](../../docs/open-questions.md#q-007--orders-to-finance-failure-and-recovery-contract).

## Boundaries and limitations

- **[CURRENT]** Product matching and cost lookup are part of the import path; an Order can remain stored with unresolved or ambiguous product matching and unresolved cost status.
- **[CURRENT]** Marketplace data freshness depends on when files are imported. No current workflow guarantees immediate cross-channel visibility or prevents external overselling.
- **[CURRENT]** Product-to-Inventory identity mapping and Inventory reservations belong to Finance Inventory, even though Orders provides the imported facts and identifiers.
- **[OPEN]** Return, cancellation, shortage, and late-import reconciliation semantics are still tracked in [Q-011](../../docs/open-questions.md#q-011--imported-order-shortage-cancellation-and-return-reconciliation).

## Source entry points

- [Order service](../../../modules/orders/order.service.ts) and [Order repository](../../../modules/orders/order.repository.ts)
- [Order schema and model](../../../modules/orders/order.schema.ts) and [persisted model](../../../modules/orders/order.model.ts)
- [Shopee All-Orders importer](../../../modules/orders/services/mass-upload-all-order-shopee-v1.service.ts)
- [Product matching](../../../modules/orders/services/product-matching.ts)
- [Finance integration adapter](../../../modules/orders/services/order-finance-integration.service.ts)
- [Orders API routes](../../../app/api/v1/dashboard/orders/route.ts) and [All-Orders upload](../../../app/api/v1/dashboard/orders/mass-upload/route.ts)
- [Products feature](../products/README.md), [Files feature](../files/README.md), and [Finance feature](../finance/README.md)
