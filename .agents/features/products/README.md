# Products

> Feature guide based on current source. The current Product record is a Store-scoped marketplace/catalog record; it is not yet a decided Organization-wide master catalog.

## Scope and status

- **[CURRENT]** Product records belong to an Organization and Store and carry a platform identifier, product ID, name/history, SKU data, variation information, active state, and nested variants.
- **[CURRENT]** A variant can carry its own platform variant ID, name/history, SKU/GTIN fields, price/discount/final price, and cost information (`default_cost` and dated `costs`). Product quantity is not represented as on-hand inventory in this Product model.
- **[CURRENT]** Product costs are consumed by Orders import/matching and can be exposed as a read-only source for Finance Inventory setup.
- **[OPEN]** Whether the long-term catalog is Store-owned, Organization-owned, or shared through Store listings remains undecided. See [Q-001 — Product catalog ownership across Stores](../../docs/open-questions.md#q-001--product-catalog-ownership-across-stores).

## Current operations

The dashboard API and service support paginated listing/filtering, lookup, create/update, platform filtering, search, active products, bulk active-state changes, soft delete/restore, and a Shopee product Excel import. Create/update logic derives `final_price` from variant price and discount.

The Shopee product importer groups parsed rows by marketplace product ID, assembles variant records/options, generates internal SKUs through the Product-owned `modules/products/sku/sku-generator.ts`, and creates or updates the matching Product record. The generator currently uses random uppercase alphanumeric segments and receives the temporary hardcoded Store code `KD`. **[TARGET]** Future imports should use the owning Store's code; the current generator move preserves the hardcoded value and existing output format. The importer is a format-specific batch path, not an API connector or a general marketplace adapter system.

## Order matching and Inventory source boundary

- **[CURRENT]** Orders import uses Products lookup/matching to associate imported product/variant names and identifiers with local Product records. Order lines preserve match status when matching is unresolved or ambiguous.
- **[CURRENT]** `ProductInventorySourceService` is a narrow read-only contract for Finance Inventory setup. It returns active, non-deleted Product sources and may intentionally omit `storeId` so the query covers the Organization's Stores.
- **[CURRENT]** That Inventory source contract does not establish ownership of a future shared master catalog, nor does it make Product quantity a stock source.
- **[TARGET]** Keep physical stock, Store allocation, and Order reservation in Finance Inventory while Finance is active; keep Product identity and listing data in Products. See [Inventory and Sales Channels](../../docs/architecture/inventory-and-channels.md) and [ADR-0001](../../ADR/0001-organization-inventory-allocation.md).

## Boundaries and open decisions

- Marketplace-specific product IDs and Store-specific records are part of current data shape. Do not infer that two same-named Products in different Stores are the same catalog item.
- Cost history is product/variant cost input for analysis; it is not itself an Inventory valuation ledger.
- Do not add quantity or stock synchronization to Product as a shortcut around Finance Inventory.
- The catalog's ownership/sharing model remains [Q-001](../../docs/open-questions.md#q-001--product-catalog-ownership-across-stores). Channel account identity and future channel quantities remain separate questions in [Q-009](../../docs/open-questions.md#q-009--shared-store-pool-versus-per-account-channel-quotas) and [Q-010](../../docs/open-questions.md#q-010--channel-quantity-source-freshness-and-warnings).

## Source entry points

- [Product SKU generator](../../../modules/products/sku/sku-generator.ts)
- [Product service](../../../modules/products/product.service.ts), [repository](../../../modules/products/product.repository.ts), and [Inventory source service](../../../modules/products/product-inventory-source.service.ts)
- [Product schema](../../../modules/products/product.schema.ts) and [model](../../../modules/products/product.model.ts)
- [Products API](../../../app/api/v1/dashboard/products/route.ts) and [Shopee import route](../../../app/api/v1/dashboard/products/mass-upload/route.ts)
- [Orders feature](../orders/README.md), [Inventory and channels architecture](../../docs/architecture/inventory-and-channels.md), and [Open Questions](../../docs/open-questions.md)
