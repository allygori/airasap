# Finance Suppliers

> [CURRENT] This guide describes the initial Supplier directory owned by Finance. It is a contact directory linked to Purchase records, not a complete procurement or receiving workflow.

## Ownership and scope

- **[CURRENT]** Supplier records belong to one Organization and are managed in `modules/finance/suppliers/`.
- **[CURRENT]** The directory stores a name, contact name, phone, email, address, notes, and active status. Names do not have a tenant-wide uniqueness constraint in this initial scope.
- **[CURRENT]** Supplier records are deactivated/reactivated instead of hard-deleted. Inactive suppliers remain visible in the directory and existing Purchase history, but cannot be selected for a new Purchase.
- **[CURRENT]** This initial directory has no Store scope, product sourcing, tax settings, payment terms, attachments, or supplier ledger. Finance remains Organization-scoped.

## Relationship to Purchases

- **[CURRENT]** New Purchase input uses optional `supplier_id`. The server resolves it inside the trusted Organization scope and rejects a missing or inactive Supplier.
- **[CURRENT]** A Purchase stores the Supplier reference and copies the Supplier's current name into `supplier_name_snapshot`. The copied name is a history snapshot; renaming the directory record does not rewrite earlier Purchase descriptions.
- **[CURRENT]** `supplier_document_reference` remains text on each Purchase for an invoice number or other transaction-specific document reference.
- **[CURRENT]** This development-stage field naming change includes no migration or backfill; the database may be reset before broader use.
- **[OPEN]** Store/product sourcing, purchase returns, receiving milestones, and warehouse relationships remain unresolved in [Q-014](../../docs/open-questions.md#q-014--supplier-ownership-and-purchasing-relationship) and [Q-012](../../docs/open-questions.md#q-012--multi-warehouse-operating-model).

## Application entry points

- **[CURRENT]** Directory page: `/dashboard/finance/suppliers`.
- **[CURRENT]** List/create API: `/api/v1/dashboard/finance/suppliers`; updates and active-state changes use `PATCH /api/v1/dashboard/finance/suppliers/:supplierId`.
- **[CURRENT]** Purchase selection is on `/dashboard/finance/purchase` and is served by the Supplier module's active list.
- **[CURRENT]** Persistence model: `FinanceSupplierModel`, collection `finance_suppliers`, with Organization scope and a compound index for active-name listing.
- **[CURRENT]** API routes require Finance availability and scope every Supplier query/update to the Organization from server-side tenant context.

## Contributor guidance

- Keep Supplier validation, listing, active-state transitions, and Purchase reference resolution in the Finance module. Pages and routes compose those operations.
- Reuse the browser-safe schemas exported from `modules/finance/client.ts`; do not import the server module entry point into Client Components.
- Keep Purchase's `supplier_name_snapshot` for descriptions and historical display; use `supplier_document_reference` for an invoice/document number belonging to that Purchase. Do not populate the Supplier reference as a replacement for the snapshot.
- Do not add a migration or backfill to the initial Supplier implementation. Any later field removal or historical relinking requires a separate, explicitly requested data-change decision.

## Related guides

- [Purchases and expenses](purchases-and-expenses.md)
- [Finance](README.md)
- [Module boundaries](../../docs/architecture/module-boundaries.md)
- [MongoDB and schema](../../docs/conventions/mongodb-and-schema.md)
- [Q-014 — Supplier ownership and purchasing relationship](../../docs/open-questions.md#q-014--supplier-ownership-and-purchasing-relationship)
